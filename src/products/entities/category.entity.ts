import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

/** §4.6 — Category (seeded by admin; used as FK on Product) */
@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;
}
