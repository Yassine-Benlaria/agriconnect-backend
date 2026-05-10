import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wilaya } from './wilaya.entity';

/**
 * §4.2 — Commune
 * An administrative subdivision of a Wilaya.
 * GPS coordinates (`lat`, `lng`) enable Haversine distance calculations (§8.1).
 */
@Entity('commune')
export class Commune {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name_latin', type: 'varchar' })
  nameLatin: string;

  @Column({ name: 'name_arabic', type: 'varchar' })
  nameArabic: string;

  /** Latitude — 6 decimal places ≈ 0.1 m precision */
  @Column({ type: 'decimal', precision: 9, scale: 6 })
  lat: number;

  /** Longitude — 6 decimal places ≈ 0.1 m precision */
  @Column({ type: 'decimal', precision: 9, scale: 6 })
  lng: number;

  // ── Relations ─────────────────────────────────────────────────────────────

  @ManyToOne(() => Wilaya, (wilaya) => wilaya.communes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'wilaya_id' })
  wilaya: Wilaya;

  @Column({ name: 'wilaya_id' })
  wilayaId: number;
}
