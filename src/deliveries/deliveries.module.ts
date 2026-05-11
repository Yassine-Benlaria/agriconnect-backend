import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { DelivererProfile } from '../users/entities/deliverer-profile.entity';
import { Commune } from '../geo/entities/commune.entity';
import { User } from '../users/entities/user.entity';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, DelivererProfile, Commune, User]),
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
