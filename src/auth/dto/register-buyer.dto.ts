import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

/** §3 — Buyer registration fields */
export class RegisterBuyerDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  /** Buyer's street / residential address */
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEmail()
  email: string;

  /** Minimum 8 characters; hashed with bcrypt (cost ≥ 12) in AuthService */
  @IsString()
  @MinLength(8)
  password: string;

  /** Buyer's home wilaya — used as default product browsing scope */
  @IsNumber()
  @IsPositive()
  wilayaId: number;
}
