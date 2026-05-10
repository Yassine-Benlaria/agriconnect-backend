import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { Commune } from './entities/commune.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wilaya, Commune])],
  exports: [TypeOrmModule],
})
export class GeoModule {}
