import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { GeoModule } from './geo/geo.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    DatabaseModule,
    GeoModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    // e.g. DeliveriesModule, CategoriesModule, NotificationsModule …
  ],
})
export class AppModule {}

