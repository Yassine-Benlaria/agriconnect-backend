import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** Fields a user can update on their own profile. All are optional. */
export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fullname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address?: string;

  /** New password — must be at least 8 characters */
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
