import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      Product, // needed by CartService to validate product availability
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // exported for OrdersModule (submit order from cart)
})
export class CartModule {}
