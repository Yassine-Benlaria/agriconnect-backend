import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { Commune } from './entities/commune.entity';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Wilaya, Commune])],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [TypeOrmModule],
})
export class GeoModule {}
