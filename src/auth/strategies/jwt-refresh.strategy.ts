import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

/**
 * Validates the long-lived **refresh token** on `POST /auth/refresh`.
 *
 * Strategy: compare the raw token from the Authorization header against the
 * bcrypt hash stored in the database. This makes stolen tokens from a leaked
 * DB dump useless (they only have hashes, not the raw tokens).
 *
 * `passReqToCallback: true` is needed to extract the raw token string.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<{ user: User; refreshToken: string }> {
    const rawToken = req
      .get('Authorization')
      ?.replace('Bearer ', '')
      .trim();

    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    // Explicitly select the hidden refresh_token_hash column
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        fullname: true,
        refreshTokenHash: true,
      },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    const isMatch = await bcrypt.compare(rawToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    return { user, refreshToken: rawToken }; // becomes request.user
  }
}
