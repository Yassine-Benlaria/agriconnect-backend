import { UserRole } from '../enums/user-role.enum';

/**
 * Shape of the JWT payload embedded in both access and refresh tokens.
 * `sub` follows the JWT standard claim for subject (the user's UUID).
 */
export interface JwtPayload {
  /** User UUID */
  sub: string;
  email: string;
  role: UserRole;
}
