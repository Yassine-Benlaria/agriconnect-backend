import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/** Metadata key used by RolesGuard to read required roles. */
export const ROLES_KEY = 'roles';

/**
 * Decorator that attaches the required roles to a route handler or controller.
 *
 * Usage:
 *   \@Roles(UserRole.FARMER, UserRole.ADMIN)
 *   \@UseGuards(JwtAuthGuard, RolesGuard)
 *   someEndpoint() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
