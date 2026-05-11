import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { DeliveryOption } from '../../common/enums/delivery-option.enum';

export class CreateOrderDto {
  @IsEnum(DeliveryOption)
  deliveryOption: DeliveryOption;

  /**
   * The commune where the buyer is located / will receive the delivery.
   * Must belong to the buyer's registered wilaya.
   * Used as the origin point for Haversine distance calculation (§8.1).
   */
  @IsNumber()
  @IsPositive()
  buyerCommuneId: number;
}
