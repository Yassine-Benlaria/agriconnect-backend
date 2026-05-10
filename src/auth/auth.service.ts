import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../common/enums/user-role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { FarmerProfile } from '../users/entities/farmer-profile.entity';
import { DelivererProfile } from '../users/entities/deliverer-profile.entity';
import { User } from '../users/entities/user.entity';

import { LoginDto } from './dto/login.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterDelivererDto } from './dto/register-deliverer.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';

/** Shape returned by all auth endpoints */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullname: string;
    role: UserRole;
  };
}

/** bcrypt cost factors — §11 mandates ≥ 12 for passwords */
const PASSWORD_SALT_ROUNDS = 12;
/** Refresh tokens only need cost 10 — they are long strings already */
const REFRESH_TOKEN_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepository: Repository<FarmerProfile>,
    @InjectRepository(DelivererProfile)
    private readonly delivererProfileRepository: Repository<DelivererProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  async registerBuyer(dto: RegisterBuyerDto): Promise<AuthTokens> {
    await this.assertEmailAvailable(dto.email);

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.userRepository.save(
      this.userRepository.create({
        fullname: dto.fullname,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        address: dto.address,
        passwordHash,
        role: UserRole.BUYER,
        wilayaId: dto.wilayaId,
      }),
    );

    return this.issueTokens(user);
  }

  async registerFarmer(dto: RegisterFarmerDto): Promise<AuthTokens> {
    await this.assertEmailAvailable(dto.email);

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    /**
     * Use a transaction: if FarmerProfile creation fails, the User row is
     * rolled back automatically — no orphaned user records.
     */
    const user = await this.dataSource.transaction(async (manager) => {
      const newUser = await manager.save(
        manager.create(User, {
          fullname: dto.fullname,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          address: dto.address,
          passwordHash,
          role: UserRole.FARMER,
          wilayaId: dto.farmWilayaId,
        }),
      );

      await manager.save(
        manager.create(FarmerProfile, {
          userId: newUser.id,
          communeId: dto.farmCommuneId,
          exactAddress: dto.farmExactAddress,
          landArea: dto.farmLandArea ?? null,
          activityType: dto.activityType,
        }),
      );

      return newUser;
    });

    return this.issueTokens(user);
  }

  async registerDeliverer(dto: RegisterDelivererDto): Promise<AuthTokens> {
    await this.assertEmailAvailable(dto.email);

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const user = await this.dataSource.transaction(async (manager) => {
      const newUser = await manager.save(
        manager.create(User, {
          fullname: dto.fullname,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          address: null, // Deliverers have no fixed address (§4.3)
          passwordHash,
          role: UserRole.DELIVERER,
          wilayaId: dto.wilayaId,
        }),
      );

      await manager.save(
        manager.create(DelivererProfile, {
          userId: newUser.id,
          vehicleType: dto.vehicleType,
          matricule: dto.matricule ?? null,
          isAvailable: true,
          currentOrderId: null,
        }),
      );

      return newUser;
    });

    return this.issueTokens(user);
  }

  // ── Login / Refresh / Logout ──────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthTokens> {
    // Explicitly select the hidden passwordHash column
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      // Use a generic message to prevent user enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  async refreshTokens(userId: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
    });
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    // Nulling the stored hash invalidates the refresh token server-side
    await this.userRepository.update(userId, { refreshTokenHash: null });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Signs a new access + refresh token pair, stores the refresh token hash,
   * and returns both tokens alongside a safe user summary.
   */
  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ) as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      }),
    ]);

    // Persist the hashed refresh token so we can validate and revoke it
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      REFRESH_TOKEN_SALT_ROUNDS,
    );
    await this.userRepository.update(user.id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    };
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const exists = await this.userRepository.existsBy({ email });
    if (exists) {
      throw new ConflictException('An account with this email already exists');
    }
  }
}
