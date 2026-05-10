import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VehicleType } from '../../common/enums/vehicle-type.enum';
import { User } from './user.entity';

/**
 * §4.5 — DelivererProfile (1:1 with User where role = DELIVERER)
 *
 * Tracks the deliverer's vehicle, availability, and active task.
 *
 * `currentOrderId` is stored as a plain nullable UUID column instead of a
 * ManyToOne relation to avoid a circular import with the Order entity, which
 * will be created in a later phase. The relation decorator will be added then.
 *
 * Business rules (§6.6):
 *   - `isAvailable` is set to false when a deliverer self-assigns a task.
 *   - If `isAvailable === false`, the assign endpoint returns 409 Conflict.
 *   - On order completion, `isAvailable` resets to true and `currentOrderId`
 *     is set back to null.
 */
@Entity('deliverer_profile')
export class DelivererProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'vehicle_type',
    type: 'enum',
    enum: VehicleType,
  })
  vehicleType: VehicleType;

  /** Vehicle registration plate — optional during registration (§3). */
  @Column({ type: 'varchar', nullable: true })
  matricule: string | null;

  /** False while the deliverer has an active task. Defaults to true. */
  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  /**
   * FK to the active Order.
   * Stored as a plain UUID column here; the full ManyToOne relation with
   * OrderEntity will be added when the Orders module is implemented (Phase 3).
   *
   * @see §6.5 — Delivery Flow
   */
  @Column({ name: 'current_order_id', type: 'uuid', nullable: true })
  currentOrderId: string | null;

  // ── Relations ─────────────────────────────────────────────────────────────

  /**
   * 1:1 — DelivererProfile is the owning side; `user_id` lives on this table.
   */
  @OneToOne(() => User, (user) => user.delivererProfile, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;
}
