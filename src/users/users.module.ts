import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FarmerProfile } from './entities/farmer-profile.entity';
import { DelivererProfile } from './entities/deliverer-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, FarmerProfile, DelivererProfile])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
