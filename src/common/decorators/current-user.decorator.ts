import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Route parameter decorator that extracts the authenticated user (or a single
 * field) from the request object set by JwtStrategy.validate().
 *
 * Usage:
 *   getProfile(\@CurrentUser() user: User) { ... }
 *   getId(\@CurrentUser('id') id: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
