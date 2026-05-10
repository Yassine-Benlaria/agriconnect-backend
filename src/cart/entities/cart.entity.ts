import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

/**
 * §4.11 — Cart
 *
 * Each buyer has exactly one cart (enforced by the UNIQUE constraint on
 * `buyer_id`). The cart is created lazily on the first item-add or
 * first GET /cart request — no explicit "create cart" endpoint is needed.
 */
@Entity('cart')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────────────────────────────

  /**
   * UNIQUE constraint ensures one cart per buyer.
   * Using OneToOne with JoinColumn places `buyer_id` on this table.
   */
  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ name: 'buyer_id', type: 'uuid', unique: true })
  buyerId: string;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: false,
  })
  items: CartItem[];
}
