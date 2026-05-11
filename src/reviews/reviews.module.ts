import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewSubscriber } from './review.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Order]),
  ],
  controllers: [ReviewsController],
  /**
   * ReviewSubscriber is declared as a provider so NestJS constructs it via DI.
   * Its constructor calls `dataSource.subscribers.push(this)` which registers
   * it with TypeORM's event system.
   */
  providers: [ReviewsService, ReviewSubscriber],
  exports: [ReviewsService],
})
export class ReviewsModule {}
