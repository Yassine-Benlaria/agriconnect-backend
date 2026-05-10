import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database.module';
import { Wilaya } from '../../geo/entities/wilaya.entity';
import { Commune } from '../../geo/entities/commune.entity';
import { SeederService } from './seeder.service';

/**
 * Standalone module used exclusively by the seed script (`npm run seed`).
 * It imports DatabaseModule (which owns ConfigModule + TypeORM root config)
 * and registers only the two entities the seeder needs.
 *
 * This module is NOT imported by AppModule — seeders should never run as
 * part of the normal application startup in production.
 */
@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Wilaya, Commune]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
