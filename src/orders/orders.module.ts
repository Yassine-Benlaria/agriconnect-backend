import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { FarmerProfile } from '../users/entities/farmer-profile.entity';
import { Commune } from '../geo/entities/commune.entity';
import { User } from '../users/entities/user.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DistanceService } from './distance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Cart,     // read-only — to load buyer's cart
      CartItem, // delete — clear cart on order submission
      FarmerProfile,
      Commune,
      User,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, DistanceService],
  exports: [OrdersService, DistanceService],
})
export class OrdersModule {}
