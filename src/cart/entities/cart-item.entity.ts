import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * §4.11 — CartItem
 *
 * The composite UNIQUE constraint on (cart_id, product_id) is enforced at
 * the DB level — a product can appear at most once per cart. The service
 * handles "add already-present product" by incrementing the quantity instead
 * of inserting a second row.
 */
@Entity('cart_item')
@Unique('UQ_cart_item_cart_product', ['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Quantity supports decimals (e.g. 1.5 kg) — matches Product.quantity type. */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  // ── Relations ─────────────────────────────────────────────────────────────

  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId: string;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;
}
