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
import { Wilaya } from '../../geo/entities/wilaya.entity';
import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';

/**
 * §4.7 — Product
 *
 * §11 performance indexes on wilaya_id, category_id, and farmer_id are
 * declared here so TypeORM's synchronize creates them automatically.
 * commune_id / wilaya_id are derived from the farmer's FarmerProfile at
 * creation time — buyers cannot override them.
 */
@Entity('product')
@Index('IDX_product_wilaya', ['wilayaId'])
@Index('IDX_product_category', ['categoryId'])
@Index('IDX_product_farmer', ['farmerId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  /** e.g. "kg", "piece", "quintal" */
  @Column({ name: 'price_unit', type: 'varchar' })
  priceUnit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Relations / FKs ───────────────────────────────────────────────────────

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farmer_id' })
  farmer: User;

  @Column({ name: 'farmer_id', type: 'uuid' })
  farmerId: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: number;

  /** Derived from farmer's FarmerProfile.communeId at creation (§4.7) */
  @ManyToOne(() => Commune, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'commune_id' })
  commune: Commune;

  @Column({ name: 'commune_id' })
  communeId: number;

  /** Derived from the commune's wilayaId at creation (§4.7) */
  @ManyToOne(() => Wilaya, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'wilaya_id' })
  wilaya: Wilaya;

  @Column({ name: 'wilaya_id' })
  wilayaId: number;

  @OneToMany(() => ProductImage, (img) => img.product, {
    cascade: true,
    eager: false,
  })
  images: ProductImage[];
}
