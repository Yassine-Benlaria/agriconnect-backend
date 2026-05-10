import { IsEmail, IsString, MinLength } from 'class-validator';

/** Unified login DTO — all roles authenticate through a single endpoint */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
