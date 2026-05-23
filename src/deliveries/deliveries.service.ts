import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { DelivererProfile } from '../users/entities/deliverer-profile.entity';
import { Commune } from '../geo/entities/commune.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(DelivererProfile)
    private readonly delivererProfileRepo: Repository<DelivererProfile>,
    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * GET /deliveries/available
   * Returns AWAITING_DELIVERER_ASSIGN orders whose farmer commune
   * is in the deliverer's wilaya. INNER JOIN pushes the filter to the DB.
   */
  async findAvailableTasks(delivererId: string): Promise<Order[]> {
    const deliverer = await this.userRepo.findOneOrFail({
      where: { id: delivererId },
      select: { id: true, wilayaId: true },
    });

    return this.orderRepo
      .createQueryBuilder('o')
      .innerJoin(
        'commune',
        'fc',
        'fc.id = o.farmer_commune_id AND fc.wilaya_id = :wilayaId',
        { wilayaId: deliverer.wilayaId },
      )
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('o.farmerCommune', 'farmerCommune')
      .leftJoinAndSelect('o.buyerCommune', 'buyerCommune')
      .leftJoinAndSelect('o.farmer', 'farmer')
      .where('o.status = :status', { status: OrderStatus.AWAITING_DELIVERER_ASSIGN })
      .orderBy('o.created_at', 'DESC')
      .addOrderBy('image.display_order', 'ASC')
      .getMany();
  }

  /**
   * GET /deliveries/current
   * Returns the deliverer's active task (if any).
   */
  async getCurrentTask(delivererId: string): Promise<Order | null> {
    const profile = await this.delivererProfileRepo.findOne({
      where: { userId: delivererId },
    });
    if (!profile) throw new NotFoundException('Deliverer profile not found');
    if (!profile.currentOrderId) return null;

    return this.loadOrder(profile.currentOrderId);
  }

  /**
   * GET /deliveries/:orderId
   * Returns details of a specific delivery task.
   */
  async getTaskDetail(orderId: string, delivererId: string): Promise<Order> {
    const order = await this.loadOrder(orderId);
    
    // Security check: either it's unassigned in their wilaya, or it's assigned to them.
    if (order.delivererId && order.delivererId !== delivererId) {
       throw new ForbiddenException('This task is assigned to another deliverer');
    }

    if (!order.delivererId) {
      const deliverer = await this.userRepo.findOneOrFail({
        where: { id: delivererId },
        select: { id: true, wilayaId: true },
      });
      if (order.farmerCommune.wilayaId !== deliverer.wilayaId) {
        throw new ForbiddenException('This order is outside your registered wilaya');
      }
    }

    return order;
  }

  /**
   * POST /deliveries/:orderId/assign — self-assign (§6.6)
   * Pre-conditions: order AWAITING_DELIVERER_ASSIGN, same wilaya, isAvailable=true
   * Atomic: order.status→AWAITING_DELIVERER_PICKUP, profile.isAvailable→false
   */
  async assignTask(orderId: string, delivererId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.AWAITING_DELIVERER_ASSIGN) {
      throw new ConflictException(
        `Order is not available for assignment (current status: ${order.status})`,
      );
    }

    const deliverer = await this.userRepo.findOneOrFail({
      where: { id: delivererId },
      select: { id: true, wilayaId: true },
    });
    const farmerCommune = await this.communeRepo.findOneOrFail({
      where: { id: order.farmerCommuneId },
    });
    if (farmerCommune.wilayaId !== deliverer.wilayaId) {
      throw new ForbiddenException('This order is outside your registered wilaya');
    }

    const profile = await this.delivererProfileRepo.findOne({
      where: { userId: delivererId },
    });
    if (!profile) throw new NotFoundException('Deliverer profile not found');
    if (!profile.isAvailable) {
      throw new ConflictException(
        'You are currently assigned to another delivery. Complete it before accepting new tasks.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Order, orderId, {
        delivererId,
        status: OrderStatus.AWAITING_DELIVERER_PICKUP,
      });
      await manager.update(
        DelivererProfile,
        { userId: delivererId },
        { isAvailable: false, currentOrderId: orderId },
      );
    });

    return this.loadOrder(orderId);
  }

  /**
   * PATCH /deliveries/:orderId/confirm-pickup
   * Sets delivererConfirmedPickup=true.
   * If farmerConfirmedPickup is already true → IN_TRANSIT (dual-confirmation §7).
   */
  async confirmPickup(orderId: string, delivererId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.delivererId !== delivererId) {
      throw new ForbiddenException('This order is not assigned to you');
    }
    if (order.status !== OrderStatus.AWAITING_DELIVERER_PICKUP) {
      throw new ConflictException(`Cannot confirm pickup in current state: ${order.status}`);
    }
    if (order.delivererConfirmedPickup) {
      throw new ConflictException('You have already confirmed pickup');
    }

    const update: Partial<Order> = { delivererConfirmedPickup: true };
    if (order.farmerConfirmedPickup) {
      update.status = OrderStatus.IN_TRANSIT;
    }

    await this.orderRepo.update(orderId, update);
    return this.loadOrder(orderId);
  }

  private async loadOrder(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        items: { product: { images: true } },
        buyer: true,
        farmer: true,
        deliverer: true,
        buyerCommune: true,
        farmerCommune: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * PATCH /deliveries/:orderId/confirm-delivery — DELIVERER side of §6.5.
   *
   * Sets delivererConfirmedDelivery=true.
   * If buyer has already confirmed → COMPLETED + profile.isAvailable → true.
   */
  async confirmDelivery(orderId: string, delivererId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.delivererId !== delivererId) {
      throw new ForbiddenException('This order is not assigned to you');
    }
    if (order.status !== OrderStatus.IN_TRANSIT) {
      throw new ConflictException(
        `Cannot confirm delivery in current state: ${order.status}`,
      );
    }
    if (order.delivererConfirmedDelivery) {
      throw new ConflictException('You have already confirmed delivery');
    }

    const update: Partial<Order> = { delivererConfirmedDelivery: true };

    if (order.buyerConfirmedDelivery) {
      update.status = OrderStatus.COMPLETED;
      // Release deliverer profile so they can accept new tasks
      await this.dataSource
        .createQueryBuilder()
        .update(DelivererProfile)
        .set({ isAvailable: true, currentOrderId: null })
        .where('user_id = :uid', { uid: delivererId })
        .execute();
    }

    await this.orderRepo.update(orderId, update);
    return this.loadOrder(orderId);
  }
}
