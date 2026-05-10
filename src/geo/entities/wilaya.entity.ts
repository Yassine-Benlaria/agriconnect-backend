import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Commune } from './commune.entity';

/**
 * §4.1 — Wilaya
 * Represents one of Algeria's 58 administrative wilayas.
 * The `code` maps to the official 2-digit wilaya code (01–58).
 */
@Entity('wilaya')
export class Wilaya {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name_latin', type: 'varchar' })
  nameLatin: string;

  @Column({ name: 'name_arabic', type: 'varchar' })
  nameArabic: string;

  /** Official 2-digit numeric code, e.g. 1 (Adrar), 16 (Algiers) */
  @Column({ type: 'int' })
  code: number;

  // ── Relations ─────────────────────────────────────────────────────────────

  @OneToMany(() => Commune, (commune) => commune.wilaya)
  communes: Commune[];
}
