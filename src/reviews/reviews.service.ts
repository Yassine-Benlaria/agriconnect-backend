import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  /**
   * POST /reviews — buyer leaves a rating for a completed order.
   *
   * Validations (in order):
   *  1. Order exists
   *  2. Caller is the buyer on the order (prevents reviewing other people's orders)
   *  3. Order is COMPLETED — cannot review in-progress or rejected orders
   *  4. No review already exists for this order (unique per order)
   *
   * The `farmerId` is derived server-side from `order.farmerId` so the buyer
   * cannot spoof which farmer they are reviewing.
   *
   * The ReviewSubscriber fires after the INSERT and updates User.rating /
   * User.ratingCount within the same DB transaction.
   */
  async create(buyerId: string, dto: CreateReviewDto): Promise<Review> {
    // 1 & 2 — load order and verify ownership
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only review your own orders');
    }

    // 3 — only COMPLETED orders are reviewable
    if (order.status !== OrderStatus.COMPLETED) {
      throw new ConflictException(
        'You can only leave a review for a completed order',
      );
    }

    // 4 — idempotency guard (friendly 409 before hitting the DB UNIQUE constraint)
    const existing = await this.reviewRepo.findOne({
      where: { orderId: dto.orderId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this order');
    }

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({
        orderId: dto.orderId,
        reviewerId: buyerId,
        farmerId: order.farmerId, // derived server-side
        rating: dto.rating,
        comment: dto.comment ?? null,
      }),
    );

    // Return with reviewer info loaded
    return this.reviewRepo.findOneOrFail({
      where: { id: review.id },
      relations: { reviewer: true },
    });
  }

  /**
   * GET /reviews/farmer/:farmerId — public list of reviews for a farmer.
   * Sorted newest-first, includes reviewer name for display.
   */
  async findByFarmer(farmerId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { farmerId },
      relations: { reviewer: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * GET /reviews/order/:orderId — fetch the review for a specific order.
   * Returns null if no review yet (buyer can check before submitting).
   */
  async findByOrder(orderId: string): Promise<Review | null> {
    return this.reviewRepo.findOne({
      where: { orderId },
      relations: { reviewer: true },
    });
  }
}
