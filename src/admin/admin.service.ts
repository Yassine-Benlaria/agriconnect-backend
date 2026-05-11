import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { OrderStatus } from '../common/enums/order-status.enum';

export interface PlatformStats {
  orders: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    rejected: number;
  };
  revenue: {
    /** Sum of total_price for all COMPLETED orders */
    fromProducts: number;
    /** Sum of delivery_price for COMPLETED WITH_DELIVERY orders */
    fromDelivery: number;
    /** Grand total */
    total: number;
  };
  users: {
    total: number;
    active: number;
    banned: number;
    byRole: Record<UserRole, number>;
  };
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  // ── User management ───────────────────────────────────────────────────────

  /**
   * GET /admin/users — paginated list of all users with profile summaries.
   * Sensitive fields (passwordHash, refreshTokenHash) are excluded by the
   * `select: false` decorator on the User entity columns.
   */
  async listUsers(): Promise<User[]> {
    return this.userRepo.find({
      relations: { farmerProfile: true, delivererProfile: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * PATCH /admin/users/:id/ban
   * Bans a user: sets isBanned=true and nulls refreshTokenHash so all
   * existing sessions are immediately invalidated.
   * The active access token remains valid for up to 15 min (by design —
   * the JwtStrategy's DB check enforces the ban on the next request).
   */
  async banUser(userId: string): Promise<User> {
    const user = await this.findUserOrFail(userId);
    await this.userRepo.update(userId, {
      isBanned: true,
      refreshTokenHash: null, // forces re-login and catches the ban on next refresh
    });
    return this.findUserOrFail(userId);
  }

  /**
   * PATCH /admin/users/:id/unban
   * Restores access. The user must log in again to obtain new tokens.
   */
  async unbanUser(userId: string): Promise<User> {
    await this.findUserOrFail(userId);
    await this.userRepo.update(userId, { isBanned: false });
    return this.findUserOrFail(userId);
  }

  // ── Statistics ────────────────────────────────────────────────────────────

  /**
   * GET /admin/stats — platform-wide dashboard statistics.
   *
   * All aggregations are done in a single query per entity to minimise DB
   * round-trips. Raw SQL is used for the multi-group aggregates to avoid
   * fetching all rows into application memory.
   */
  async getStats(): Promise<PlatformStats> {
    // ── Order counts by status ─────────────────────────────────────────────
    const orderCounts = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    const countByStatus = Object.fromEntries(
      orderCounts.map((r) => [r.status, parseInt(r.count, 10)]),
    ) as Partial<Record<OrderStatus, number>>;

    const totalOrders = orderCounts.reduce(
      (sum, r) => sum + parseInt(r.count, 10),
      0,
    );

    const inProgressStatuses: OrderStatus[] = [
      OrderStatus.AWAITING_BUYER_PICKUP,
      OrderStatus.AWAITING_DELIVERER_ASSIGN,
      OrderStatus.AWAITING_DELIVERER_PICKUP,
      OrderStatus.IN_TRANSIT,
    ];
    const inProgress = inProgressStatuses.reduce(
      (sum, s) => sum + (countByStatus[s] ?? 0),
      0,
    );

    // ── Revenue from completed orders ──────────────────────────────────────
    const revenueRow = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_price), 0)', 'products')
      .addSelect('COALESCE(SUM(o.delivery_price), 0)', 'delivery')
      .where('o.status = :status', { status: OrderStatus.COMPLETED })
      .getRawOne<{ products: string; delivery: string }>();

    const fromProducts = parseFloat(revenueRow?.products ?? '0');
    const fromDelivery = parseFloat(revenueRow?.delivery ?? '0');

    // ── User counts ────────────────────────────────────────────────────────
    const userCounts = await this.userRepo
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'SUM(CASE WHEN u.is_banned = false THEN 1 ELSE 0 END)',
        'active',
      )
      .groupBy('u.role')
      .getRawMany<{ role: UserRole; count: string; active: string }>();

    const totalUsers = userCounts.reduce(
      (sum, r) => sum + parseInt(r.count, 10),
      0,
    );
    const totalActive = userCounts.reduce(
      (sum, r) => sum + parseInt(r.active, 10),
      0,
    );
    const totalBanned = totalUsers - totalActive;

    const byRole = Object.fromEntries(
      Object.values(UserRole).map((role) => {
        const row = userCounts.find((r) => r.role === role);
        return [role, row ? parseInt(row.count, 10) : 0];
      }),
    ) as Record<UserRole, number>;

    return {
      orders: {
        total: totalOrders,
        completed: countByStatus[OrderStatus.COMPLETED] ?? 0,
        pending: countByStatus[OrderStatus.PENDING] ?? 0,
        inProgress,
        rejected: countByStatus[OrderStatus.REJECTED] ?? 0,
      },
      revenue: {
        fromProducts,
        fromDelivery,
        total: fromProducts + fromDelivery,
      },
      users: {
        total: totalUsers,
        active: totalActive,
        banned: totalBanned,
        byRole,
      },
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findUserOrFail(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { farmerProfile: true, delivererProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
