import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

/**
 * §4.12 — Review
 *
 * One review per completed order (UNIQUE on `order_id`).
 * The CHECK constraint on `rating` is enforced at the DB level as a second
 * line of defence after class-validator validates it in the DTO.
 *
 * `reviewer_id` = buyerId (enforced in service).
 * `farmer_id`   = order.farmerId (derived server-side — buyer can't spoof it).
 */
@Entity('review')
@Check('CHK_review_rating', '"rating" BETWEEN 1 AND 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ── Relations / FKs ───────────────────────────────────────────────────────

  /** UNIQUE — one review per completed order */
  @OneToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  /**
   * Denormalized `farmer_id` — copied from order at insert time.
   * Allows efficient `WHERE farmer_id = ?` queries without joining orders.
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmer_id' })
  farmer: User;

  @Column({ name: 'farmer_id', type: 'uuid' })
  farmerId: string;
}
