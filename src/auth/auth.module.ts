import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { FarmerProfile } from '../users/entities/farmer-profile.entity';
import { DelivererProfile } from '../users/entities/deliverer-profile.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    /**
     * JwtModule is configured without a default secret here because
     * AuthService calls jwtService.signAsync() with an explicit secret per
     * token type (access vs. refresh). This avoids accidentally mixing secrets.
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        // No global secret/expiresIn — each signAsync call supplies its own
      }),
    }),

    TypeOrmModule.forFeature([User, FarmerProfile, DelivererProfile]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
