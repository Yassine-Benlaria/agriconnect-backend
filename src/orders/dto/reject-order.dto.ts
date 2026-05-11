import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectOrderDto {
  /**
   * Farmer must supply a reason so the buyer understands what went wrong.
   * Stored in `order.rejection_reason` (TEXT column) and surfaced in the
   * buyer's order detail view.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason: string;
}
