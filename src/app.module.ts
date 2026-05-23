import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { GeoModule } from './geo/geo.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    DatabaseModule,
    GeoModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    DeliveriesModule,
    ReviewsModule,
    AdminModule,
  ],
})
export class AppModule {}

