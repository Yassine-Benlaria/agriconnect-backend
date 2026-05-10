import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { VehicleType } from '../../common/enums/vehicle-type.enum';

/**
 * §3 — Deliverer registration fields.
 *
 * Note: `email` and `password` are not listed in the §3 registration table
 * (which focuses on role-specific fields) but are required by the base User
 * entity for authentication via the unified `/auth/login` endpoint.
 */
export class RegisterDelivererDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  email: string;

  /** Minimum 8 characters; hashed with bcrypt (cost ≥ 12) in AuthService */
  @IsString()
  @MinLength(8)
  password: string;

  /** The wilaya where the deliverer operates */
  @IsNumber()
  @IsPositive()
  wilayaId: number;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  /** Vehicle registration plate — optional */
  @IsString()
  @IsOptional()
  matricule?: string;
}
