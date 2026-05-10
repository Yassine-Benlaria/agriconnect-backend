import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  /** e.g. "kg", "piece", "quintal" */
  @IsString()
  @IsNotEmpty()
  priceUnit: string;

  @IsNumber()
  @IsPositive()
  categoryId: number;

  @IsNumber()
  @Min(0)
  quantity: number;
}
