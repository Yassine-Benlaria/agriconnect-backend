import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Review } from './entities/review.entity';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /api/reviews — BUYER submits a 1-5 star rating for a completed order.
   * farmerId is derived from the order server-side — not accepted from the body.
   */
  @Post()
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateReviewDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Review> {
    return this.reviewsService.create(buyerId, dto);
  }

  /**
   * GET /api/reviews/farmer/:farmerId — list all reviews for a farmer.
   * Available to all authenticated roles (buyers browsing farmer profiles).
   */
  @Get('farmer/:farmerId')
  @Roles(UserRole.BUYER, UserRole.FARMER, UserRole.DELIVERER)
  findByFarmer(
    @Param('farmerId', ParseUUIDPipe) farmerId: string,
  ): Promise<Review[]> {
    return this.reviewsService.findByFarmer(farmerId);
  }

  /**
   * GET /api/reviews/order/:orderId — fetch the review for a specific order.
   * Useful for buyers to check if they've already reviewed before showing the form.
   */
  @Get('order/:orderId')
  @Roles(UserRole.BUYER, UserRole.FARMER)
  findByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<Review | null> {
    return this.reviewsService.findByOrder(orderId);
  }
}
