import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * §4.10 — OrderItem
 *
 * Stores a price **snapshot** at order-creation time (`unit_price`).
 * This ensures order history is not affected if the farmer later changes
 * the product price.
 *
 * `subtotal` = quantity × unit_price, pre-computed and persisted to avoid
 * rounding drift from repeated float multiplication at query time.
 */
@Entity('order_item')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  /** Price at the moment the order was placed — never changes after creation */
  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // ── Relations ─────────────────────────────────────────────────────────────

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  /**
   * Product reference is kept for display purposes.
   * RESTRICT prevents accidental product deletion with live order references.
   */
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;
}
