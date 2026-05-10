import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that validates the JWT **refresh token** from the `Authorization: Bearer` header.
 * Used exclusively on the `POST /auth/refresh` endpoint.
 * On success, attaches `{ user, refreshToken }` to `request.user` via
 * JwtRefreshStrategy.validate().
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
