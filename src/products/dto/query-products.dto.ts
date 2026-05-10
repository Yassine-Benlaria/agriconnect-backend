import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum ProductSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DATE_DESC = 'date_desc',
  RATING_DESC = 'rating_desc',
}

/** Shared base — used by both the BUYER browse endpoint and the FARMER /my endpoint. */
export class QueryProductsDto {
  @IsNumber()
  @IsOptional()
  wilayaId?: number;

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy;

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  /** Default and maximum pagination limit of 20 (§11) */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
