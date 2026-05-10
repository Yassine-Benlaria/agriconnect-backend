import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Cart } from './entities/cart.entity';

/**
 * All cart endpoints are scoped to the authenticated BUYER.
 * The buyer's identity comes from the JWT — no buyerId in URL paths to prevent
 * accessing another buyer's cart.
 */
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUYER)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** GET /api/cart — view the buyer's cart (creates it lazily if new) */
  @Get()
  getCart(@CurrentUser('id') buyerId: string): Promise<Cart> {
    return this.cartService.getCart(buyerId);
  }

  /** POST /api/cart/items — add a product; quantity is additive if product already in cart */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  addItem(
    @Body() dto: AddCartItemDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Cart> {
    return this.cartService.addItem(buyerId, dto);
  }

  /** PATCH /api/cart/items/:productId — set a new quantity for an existing item */
  @Patch('items/:productId')
  updateItem(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Cart> {
    return this.cartService.updateItem(buyerId, productId, dto);
  }

  /** DELETE /api/cart/items/:productId — remove a single item from the cart */
  @Delete('items/:productId')
  removeItem(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser('id') buyerId: string,
  ): Promise<Cart> {
    return this.cartService.removeItem(buyerId, productId);
  }

  /** DELETE /api/cart — remove all items (cart entity is retained) */
  @Delete()
  @HttpCode(HttpStatus.OK)
  clearCart(@CurrentUser('id') buyerId: string): Promise<Cart> {
    return this.cartService.clearCart(buyerId);
  }
}
