import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

/**
 * §11 — Role-Based Access Control
 *
 * Must be used **after** JwtAuthGuard so that `request.user` is populated.
 * If a route has no `@Roles()` decorator, access is granted to any authenticated user.
 * If the authenticated user's role is not in the allowed list, 403 Forbidden is thrown.
 *
 * Usage:
 *   \@UseGuards(JwtAuthGuard, RolesGuard)
 *   \@Roles(UserRole.FARMER)
 *   createProduct() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator → any authenticated user may proceed
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
