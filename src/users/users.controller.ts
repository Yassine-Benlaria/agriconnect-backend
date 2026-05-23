import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateWilayaDto } from './dto/update-wilaya.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Own profile (all authenticated roles) ─────────────────────────────────

  /**
   * GET /api/users/me
   * Returns the full profile of the authenticated user including
   * role-specific sub-profiles (farmerProfile or delivererProfile).
   */
  @Get('me')
  @Roles(UserRole.BUYER, UserRole.FARMER, UserRole.DELIVERER, UserRole.ADMIN)
  getMe(@CurrentUser('id') userId: string): Promise<User> {
    return this.usersService.getMe(userId);
  }

  /**
   * PATCH /api/users/me
   * Update mutable fields: fullname, email, phoneNumber, address, password.
   * All fields are optional — only provided fields are updated.
   */
  @Patch('me')
  @Roles(UserRole.BUYER, UserRole.FARMER, UserRole.DELIVERER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  updateMe(
    @Body() dto: UpdateProfileDto,
    @CurrentUser('id') userId: string,
  ): Promise<User> {
    return this.usersService.updateMe(userId, dto);
  }

  /**
   * PATCH /api/users/me/wilaya  (BUYER only)
   * Changes the buyer's browsing wilaya — controls which products they see.
   */
  @Patch('me/wilaya')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  updateWilaya(
    @Body() dto: UpdateWilayaDto,
    @CurrentUser('id') userId: string,
  ): Promise<User> {
    return this.usersService.updateWilaya(userId, dto.wilayaId);
  }

  // ── Farmer directory (BUYER facing) ───────────────────────────────────────

  /**
   * GET /api/users/farmers
   * Lists all active farmers in the buyer's registered wilaya,
   * sorted by rating descending.
   *
   * Must be declared BEFORE /farmers/:id to prevent "farmers" being
   * consumed as a UUID param.
   */
  @Get('farmers')
  @Roles(UserRole.BUYER)
  listFarmers(@CurrentUser() user: User): Promise<User[]> {
    return this.usersService.listFarmersInWilaya(user.wilayaId);
  }

  /**
   * GET /api/users/farmers/:id
   * Returns the public profile of a specific farmer:
   * base user fields + farmerProfile (commune, activityType, landArea) + ratings.
   * 404 if the id is not a FARMER.
   */
  @Get('farmers/:id')
  @Roles(UserRole.BUYER)
  getFarmerProfile(
    @Param('id', ParseUUIDPipe) farmerId: string,
  ): Promise<User> {
    return this.usersService.getFarmerProfile(farmerId);
  }
}
