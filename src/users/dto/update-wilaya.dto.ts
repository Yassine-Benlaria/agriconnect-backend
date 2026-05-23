import { IsInt, IsPositive } from 'class-validator';

/** Body for PATCH /users/me/wilaya — BUYER only */
export class UpdateWilayaDto {
  @IsInt()
  @IsPositive()
  wilayaId: number;
}
