import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ActivityType } from '../../common/enums/activity-type.enum';

/** §3 — Farmer registration fields */
export class RegisterFarmerDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  /** Farmer's residential / contact address */
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEmail()
  email: string;

  /** Minimum 8 characters; hashed with bcrypt (cost ≥ 12) in AuthService */
  @IsString()
  @MinLength(8)
  password: string;

  /**
   * The wilaya where the farm is located.
   * Stored on the base User entity as `wilaya_id` and used as the delivery
   * origin for Haversine distance calculation (§8.1).
   */
  @IsNumber()
  @IsPositive()
  farmWilayaId: number;

  /** Commune of the farm — used as the precise GPS origin (§8.1) */
  @IsNumber()
  @IsPositive()
  farmCommuneId: number;

  @IsString()
  @IsNotEmpty()
  farmExactAddress: string;

  /** Farm land area in hectares — optional */
  @IsNumber()
  @Min(0)
  @IsOptional()
  farmLandArea?: number;

  @IsEnum(ActivityType)
  activityType: ActivityType;
}
