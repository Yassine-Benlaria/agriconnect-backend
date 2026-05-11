import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { FarmerProfile } from '../users/entities/farmer-profile.entity';
import { Commune } from '../geo/entities/commune.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { DeliveryOption } from '../common/enums/delivery-option.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { DistanceService } from './distance.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepo: Repository<FarmerProfile>,
    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly distanceService: DistanceService,
    private readonly dataSource: DataSource,
  ) {}

  // ── POST /orders ──────────────────────────────────────────────────────────

  /**
   * Converts the buyer's active cart into a persisted Order.
   *
   * Steps (§6.2):
   *  1. Load cart — fail if empty
   *  2. Validate cart items (same farmer, all available)
   *  3. Validate buyerCommuneId belongs to buyer's wilaya
   *  4. Load commune GPS coordinates for Haversine
   *  5. Calculate totals and (if WITH_DELIVERY) delivery price
   *  6. Persist Order + OrderItems + clear CartItems in a single transaction
   *  7. Return fully loaded Order
   */
  async createOrder(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    // ── 1. Load cart ─────────────────────────────────────────────────────
    const cart = await this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .where('cart.buyer_id = :buyerId', { buyerId })
      .getOne();

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // ── 2. Cart validation ────────────────────────────────────────────────
    const unavailable = cart.items.filter((i) => !i.product.isAvailable);
    if (unavailable.length > 0) {
      throw new ConflictException(
        `The following products are no longer available: ` +
          unavailable.map((i) => `"${i.product.title}"`).join(', '),
      );
    }

    const farmerIds = [...new Set(cart.items.map((i) => i.product.farmerId))];
    if (farmerIds.length > 1) {
      throw new BadRequestException(
        'All cart items must belong to the same farmer. ' +
          'Please place separate orders for products from different farmers.',
      );
    }
    const farmerId = farmerIds[0];

    // ── 3. Validate buyer's commune belongs to their wilaya ───────────────
    const buyer = await this.userRepo.findOneOrFail({
      where: { id: buyerId },
      select: { id: true, wilayaId: true },
    });

    const buyerCommune = await this.communeRepo.findOne({
      where: { id: dto.buyerCommuneId },
    });
    if (!buyerCommune) {
      throw new NotFoundException('Buyer commune not found');
    }
    if (buyerCommune.wilayaId !== buyer.wilayaId) {
      throw new BadRequestException(
        'The selected commune does not belong to your registered wilaya',
      );
    }

    // ── 4. Resolve farmer's commune ───────────────────────────────────────
    const farmerProfile = await this.farmerProfileRepo.findOne({
      where: { userId: farmerId },
    });
    if (!farmerProfile) {
      throw new ConflictException(
        'Farmer profile is incomplete — cannot process this order',
      );
    }

    const farmerCommune = await this.communeRepo.findOneOrFail({
      where: { id: farmerProfile.communeId },
    });

    // ── 5. Calculate prices ───────────────────────────────────────────────
    const lineItems = cart.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.product.price),
      subtotal:
        Math.round(Number(item.quantity) * Number(item.product.price) * 100) /
        100,
    }));

    const totalPrice = lineItems.reduce((sum, i) => sum + i.subtotal, 0);

    let distanceKm: number | null = null;
    let deliveryPrice: number | null = null;

    if (dto.deliveryOption === DeliveryOption.WITH_DELIVERY) {
      distanceKm = this.distanceService.calculateDistance(
        buyerCommune,
        farmerCommune,
      );
      deliveryPrice = this.distanceService.calculateDeliveryPrice(distanceKm);
    }

    // ── 6. Persist in a transaction ───────────────────────────────────────
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      // Initial status depends on delivery option:
      //   WITH_DELIVERY    → AWAITING_DELIVERER_ASSIGN (after farmer accept)
      //   WITHOUT_DELIVERY → AWAITING_BUYER_PICKUP     (after farmer accept)
      // Both start as PENDING for farmer to accept/reject first.
      const order = await manager.save(
        manager.create(Order, {
          buyerId,
          farmerId,
          deliveryOption: dto.deliveryOption,
          status: OrderStatus.PENDING,
          buyerCommuneId: dto.buyerCommuneId,
          farmerCommuneId: farmerProfile.communeId,
          totalPrice,
          deliveryPrice,
          distanceKm,
          rejectionReason: null,
          delivererId: null,
          farmerConfirmedPickup: false,
          buyerConfirmedPickup: false,
          delivererConfirmedPickup: false,
          buyerConfirmedDelivery: false,
          delivererConfirmedDelivery: false,
        }),
      );

      await manager.save(
        lineItems.map((li) =>
          manager.create(OrderItem, { orderId: order.id, ...li }),
        ),
      );

      // Clear cart items (keep cart entity for future orders)
      await manager.delete(CartItem, { cartId: cart.id });

      return order;
    });

    return this.findOne(savedOrder.id);
  }

  // ── GET /orders (buyer & farmer views) ───────────────────────────────────

  /**
   * Returns orders for a given buyer or farmer.
   * Pass `{ buyerId }` or `{ farmerId }` in the where clause.
   */
  async findAllForUser(
    userId: string,
    role: 'buyer' | 'farmer',
  ): Promise<Order[]> {
    return this.orderRepo.find({
      where: role === 'buyer' ? { buyerId: userId } : { farmerId: userId },
      relations: { items: { product: true }, buyerCommune: true, farmerCommune: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
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
}
