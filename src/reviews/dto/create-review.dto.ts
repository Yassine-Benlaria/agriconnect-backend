import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  /** The completed order being reviewed */
  @IsUUID()
  orderId: string;

  /** Star rating: 1 (worst) to 5 (best) */
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  /** Optional written feedback — max 1 000 characters */
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}
