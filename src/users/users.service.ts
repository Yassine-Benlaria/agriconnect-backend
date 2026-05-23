import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { FarmerProfile } from './entities/farmer-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../common/enums/user-role.enum';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepo: Repository<FarmerProfile>,
  ) {}

  // ── Own profile ────────────────────────────────────────────────────────────

  /**
   * GET /users/me
   * Returns the full profile for the authenticated user including the
   * role-specific sub-profile (farmerProfile or delivererProfile).
   */
  async getMe(userId: string): Promise<User> {
    return this.findUserOrFail(userId);
  }

  /**
   * PATCH /users/me
   * Updates mutable fields on the caller's own profile.
   * Password is re-hashed if provided. Email uniqueness is checked before save.
   */
  async updateMe(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findUserOrFail(userId);

    // Email uniqueness guard (skip if not changing email)
    if (dto.email && dto.email !== user.email) {
      const taken = await this.userRepo.existsBy({ email: dto.email });
      if (taken) throw new BadRequestException('Email is already in use');
    }

    const updates: Partial<User> = {};
    if (dto.fullname)     updates.fullname    = dto.fullname;
    if (dto.email)        updates.email       = dto.email;
    if (dto.phoneNumber)  updates.phoneNumber = dto.phoneNumber;
    if (dto.address)      updates.address     = dto.address;
    if (dto.password) {
      updates.passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    }

    await this.userRepo.update(userId, updates);
    return this.findUserOrFail(userId);
  }

  /**
   * PATCH /users/me/wilaya  (BUYER only)
   * Switches the buyer's browsing wilaya, which controls which products they see.
   */
  async updateWilaya(userId: string, wilayaId: number): Promise<User> {
    await this.findUserOrFail(userId);
    await this.userRepo.update(userId, { wilayaId });
    return this.findUserOrFail(userId);
  }

  // ── Farmer directory (BUYER facing) ───────────────────────────────────────

  /**
   * GET /users/farmers/:id  (BUYER)
   * Returns a farmer's public profile: base user fields + farmerProfile details
   * + their reviews summary (rating / ratingCount already denormalised on User).
   * 404 if the id doesn't correspond to a FARMER.
   */
  async getFarmerProfile(farmerId: string): Promise<User> {
    const farmer = await this.userRepo.findOne({
      where: { id: farmerId, role: UserRole.FARMER },
      relations: { farmerProfile: { commune: true }, wilaya: true },
    });
    if (!farmer) throw new NotFoundException('Farmer not found');
    return farmer;
  }

  /**
   * GET /users/farmers  (BUYER)
   * Lists all non-banned farmers whose registered wilaya matches the buyer's.
   * Sorted by rating descending so the best-rated farmers appear first.
   */
  async listFarmersInWilaya(buyerWilayaId: number): Promise<User[]> {
    return this.userRepo.find({
      where: {
        role: UserRole.FARMER,
        wilayaId: buyerWilayaId,
        isBanned: false,
      },
      relations: { farmerProfile: true, wilaya: true },
      order: { rating: 'DESC' },
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async findUserOrFail(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { farmerProfile: { commune: true }, delivererProfile: true, wilaya: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
