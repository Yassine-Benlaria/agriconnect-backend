import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService, PlatformStats } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

/**
 * All admin endpoints require the ADMIN role.
 * The JwtAuthGuard + RolesGuard combination is applied at class level so
 * every route inherits it automatically.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── User management ───────────────────────────────────────────────────────

  /**
   * GET /api/admin/users
   * Returns all users with their farmer/deliverer profile summaries.
   * Sensitive fields (passwordHash, refreshTokenHash) are excluded by the
   * `select: false` decorator on the User entity.
   */
  @Get('users')
  listUsers(): Promise<User[]> {
    return this.adminService.listUsers();
  }

  /**
   * PATCH /api/admin/users/:id/ban
   * Bans a user:
   *  - isBanned = true  → JwtStrategy rejects their tokens on next request
   *  - refreshTokenHash = null → existing sessions cannot be refreshed
   */
  @Patch('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  banUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.adminService.banUser(id);
  }

  /**
   * PATCH /api/admin/users/:id/unban
   * Restores access — the user must log in again to obtain fresh tokens.
   */
  @Patch('users/:id/unban')
  @HttpCode(HttpStatus.OK)
  unbanUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.adminService.unbanUser(id);
  }

  // ── Statistics ────────────────────────────────────────────────────────────

  /**
   * GET /api/admin/stats
   * Returns:
   *  - orders: total, completed, pending, in-progress, rejected counts
   *  - revenue: product revenue + delivery revenue from completed orders
   *  - users: total, active, banned, counts broken down by role
   */
  @Get('stats')
  getStats(): Promise<PlatformStats> {
    return this.adminService.getStats();
  }
}
