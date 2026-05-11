import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Commune } from '../../geo/entities/commune.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { DeliveryOption } from '../../common/enums/delivery-option.enum';
import { OrderItem } from './order-item.entity';

/**
 * §4.9 — Order
 *
 * §11 performance indexes on status, buyer_id, and farmer_id are declared
 * here so TypeORM's synchronize creates them automatically.
 *
 * Confirmation booleans model the dual-confirmation pattern (§6.4, §6.5):
 * both parties must confirm before a status transition fires.
 *
 * The `deliverer` relation is nullable — assigned only when a deliverer
 * self-assigns via `POST /deliveries/:orderId/assign` (Phase 3).
 */
@Entity('order')
@Index('IDX_order_status', ['status'])
@Index('IDX_order_buyer', ['buyerId'])
@Index('IDX_order_farmer', ['farmerId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'delivery_option', type: 'enum', enum: DeliveryOption })
  deliveryOption: DeliveryOption;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  /** Calculated by DistanceService (§8.2) when deliveryOption = WITH_DELIVERY */
  @Column({
    name: 'delivery_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  deliveryPrice: number | null;

  /** Sum of (unit_price × quantity) for all OrderItems, calculated at submission time */
  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  /** Haversine distance between buyer's commune and farmer's commune (§8.1) */
  @Column({
    name: 'distance_km',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  distanceKm: number | null;

  // ── Dual-confirmation flags (§6.4, §6.5) ─────────────────────────────────

  @Column({ name: 'farmer_confirmed_pickup', type: 'boolean', default: false })
  farmerConfirmedPickup: boolean;

  /** Used for WITHOUT_DELIVERY path (§6.4) */
  @Column({ name: 'buyer_confirmed_pickup', type: 'boolean', default: false })
  buyerConfirmedPickup: boolean;

  @Column({
    name: 'deliverer_confirmed_pickup',
    type: 'boolean',
    default: false,
  })
  delivererConfirmedPickup: boolean;

  @Column({ name: 'buyer_confirmed_delivery', type: 'boolean', default: false })
  buyerConfirmedDelivery: boolean;

  @Column({
    name: 'deliverer_confirmed_delivery',
    type: 'boolean',
    default: false,
  })
  delivererConfirmedDelivery: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations / FKs ───────────────────────────────────────────────────────

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ name: 'buyer_id', type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmer_id' })
  farmer: User;

  @Column({ name: 'farmer_id', type: 'uuid' })
  farmerId: string;

  /** Assigned when a deliverer self-assigns via POST /deliveries/:orderId/assign */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deliverer_id' })
  deliverer: User | null;

  @Column({ name: 'deliverer_id', type: 'uuid', nullable: true })
  delivererId: string | null;

  @ManyToOne(() => Commune, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'buyer_commune_id' })
  buyerCommune: Commune;

  @Column({ name: 'buyer_commune_id' })
  buyerCommuneId: number;

  @ManyToOne(() => Commune, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmer_commune_id' })
  farmerCommune: Commune;

  @Column({ name: 'farmer_commune_id' })
  farmerCommuneId: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
