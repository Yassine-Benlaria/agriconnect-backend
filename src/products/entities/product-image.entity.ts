import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * §4.8 — ProductImage
 *
 * `display_order` is used instead of the reserved SQL keyword `order`.
 * Max 5 images per product enforced in ProductsService (§11).
 */
@Entity('product_image')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Relative URL path served by the static files middleware, e.g. /uploads/products/uuid.jpg */
  @Column({ type: 'varchar' })
  url: string;

  /** Controls front-end display order (lower = first) */
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  // ── Relations ─────────────────────────────────────────────────────────────

  @ManyToOne(() => Product, (product) => product.images, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;
}
