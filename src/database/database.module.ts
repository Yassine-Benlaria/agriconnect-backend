import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        
        // Use your Neon URL from the .env file instead of individual fields
        url: config.get<string>('DATABASE_URL'),

        // Add the SSL properties right here!
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },

        // Load entities automatically from all modules
        autoLoadEntities: true,
        // Keep synchronize:true for MVP / development only.
        // Must be set to false and replaced by migrations before production.
        // synchronize: config.get<string>('NODE_ENV') !== 'production',
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}