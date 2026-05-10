import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityType } from '../../common/enums/activity-type.enum';
import { Commune } from '../../geo/entities/commune.entity';
import { User } from './user.entity';

/**
 * §4.4 — FarmerProfile (1:1 with User where role = FARMER)
 *
 * Holds the farm-specific details that only farmers provide during registration.
 * The `commune` relation points to the farmer's farm commune, which is the
 * origin used in Haversine distance calculations (§8.1).
 */
@Entity('farmer_profile')
export class FarmerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exact_address', type: 'varchar' })
  exactAddress: string;

  /**
   * Farm land area in hectares — optional during registration (§3).
   */
  @Column({ name: 'land_area', type: 'float', nullable: true })
  landArea: number | null;

  @Column({
    name: 'activity_type',
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  // ── Relations ─────────────────────────────────────────────────────────────

  /**
   * 1:1 — FarmerProfile is the owning side; JoinColumn places `user_id`
   * on this table.
   */
  @OneToOne(() => User, (user) => user.farmerProfile, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  /**
   * The commune where the farm is located.
   * Derived from `farm_commune_id` in the registration form (§3).
   */
  @ManyToOne(() => Commune, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'commune_id' })
  commune: Commune;

  @Column({ name: 'commune_id' })
  communeId: number;
}
