import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates the JWT **access token** from the `Authorization: Bearer` header.
 * On success, attaches the User object to `request.user` via JwtStrategy.validate().
 * On failure, returns 401 Unauthorized automatically.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
