import { IsNumber, IsPositive } from 'class-validator';

export class UpdateCartItemDto {
  /** Replaces the current quantity — must be > 0. Use DELETE to remove an item. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity: number;
}
