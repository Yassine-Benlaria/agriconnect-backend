import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { GeoModule } from './geo/geo.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    GeoModule,
    UsersModule,
    AuthModule,
    // Additional feature modules will be added here as they are implemented
    // e.g. ProductsModule, OrdersModule, DeliveriesModule, …
  ],
})
export class AppModule {}

