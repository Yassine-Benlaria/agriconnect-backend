import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Wilaya } from '../../geo/entities/wilaya.entity';
import { FarmerProfile } from './farmer-profile.entity';
import { DelivererProfile } from './deliverer-profile.entity';

/**
 * §4.3 — User (base entity, discriminated by `role`)
 *
 * A single table holds all user types (FARMER, BUYER, DELIVERER, ADMIN).
 * Role-specific extra fields live in FarmerProfile (§4.4) and
 * DelivererProfile (§4.5) via 1:1 relations.
 *
 * Security notes (§11):
 *  - `passwordHash` is never selected by default (select: false).
 *  - Passwords must be hashed with bcrypt, cost factor ≥ 12, before storing.
 */
@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  fullname: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'phone_number', type: 'varchar' })
  phoneNumber: string;

  /** Never returned in query results by default — must be explicitly selected. */
  @Column({ name: 'password_hash', type: 'varchar', select: false })
  passwordHash: string;

  /**
   * Hashed refresh token (bcrypt, cost 10).
   * Nulled out on logout to invalidate the token server-side.
   * Never returned in query results by default.
   */
  @Column({ name: 'refresh_token_hash', type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  /** Nullable for DELIVERER — they set a wilaya but no street address. */
  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations ─────────────────────────────────────────────────────────────

  /**
   * All users are associated with a wilaya.
   * FARMER: the farm wilaya (farm_wilaya_id in §3 registration fields maps here).
   * BUYER / DELIVERER: their home/operating wilaya.
   */
  @ManyToOne(() => Wilaya, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'wilaya_id' })
  wilaya: Wilaya;

  @Column({ name: 'wilaya_id' })
  wilayaId: number;

  /** Populated only when role === FARMER */
  @OneToOne(() => FarmerProfile, (profile) => profile.user, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  farmerProfile: FarmerProfile | null;

  /** Populated only when role === DELIVERER */
  @OneToOne(() => DelivererProfile, (profile) => profile.user, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  delivererProfile: DelivererProfile | null;
}
