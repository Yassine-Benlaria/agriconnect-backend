import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterDelivererDto } from './dto/register-deliverer.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Registration ────────────────────────────────────────────────────────

  /** POST /api/auth/register/buyer */
  @Post('register/buyer')
  @HttpCode(HttpStatus.CREATED)
  registerBuyer(@Body() dto: RegisterBuyerDto): Promise<AuthTokens> {
    return this.authService.registerBuyer(dto);
  }

  /** POST /api/auth/register/farmer */
  @Post('register/farmer')
  @HttpCode(HttpStatus.CREATED)
  registerFarmer(@Body() dto: RegisterFarmerDto): Promise<AuthTokens> {
    return this.authService.registerFarmer(dto);
  }

  /** POST /api/auth/register/deliverer */
  @Post('register/deliverer')
  @HttpCode(HttpStatus.CREATED)
  registerDeliverer(@Body() dto: RegisterDelivererDto): Promise<AuthTokens> {
    return this.authService.registerDeliverer(dto);
  }

  // ── Authentication ──────────────────────────────────────────────────────

  /** POST /api/auth/login — returns access + refresh token pair */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/refresh
   * Send the refresh token in the Authorization: Bearer header.
   * Returns a new access + refresh token pair (token rotation).
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  refresh(
    @CurrentUser() requestUser: { user: User },
  ): Promise<AuthTokens> {
    return this.authService.refreshTokens(requestUser.user.id);
  }

  /**
   * POST /api/auth/logout
   * Invalidates the stored refresh token hash — the access token will
   * expire naturally (15 min by default). Returns 204 No Content.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser('id') userId: string): Promise<void> {
    return this.authService.logout(userId);
  }
}
