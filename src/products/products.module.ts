import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from './entities/category.entity';
import { FarmerProfile } from '../users/entities/farmer-profile.entity';
import { Commune } from '../geo/entities/commune.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ImageUploadService } from './image-upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      Category,
      FarmerProfile,
      Commune,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ImageUploadService],
  exports: [ProductsService],
})
export class ProductsModule {}
