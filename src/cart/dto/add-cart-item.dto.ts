import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productId: string;

  /** Must be > 0 — supports decimal quantities (e.g. 1.5 kg) */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity: number;
}
