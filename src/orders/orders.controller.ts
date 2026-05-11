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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Order } from './entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /api/orders — BUYER submits order from their active cart.
   * Returns the created order with items, prices, and distance info.
   */
  @Post()
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Order> {
    return this.ordersService.createOrder(buyerId, dto);
  }

  /**
   * GET /api/orders — BUYER sees their own orders.
   * FARMER sees orders addressed to them.
   * Both roles use the same endpoint — identity comes from JWT.
   */
  @Get()
  @Roles(UserRole.BUYER, UserRole.FARMER)
  findAll(@CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole): Promise<Order[]> {
    const roleKey = role === UserRole.FARMER ? 'farmer' : 'buyer';
    return this.ordersService.findAllForUser(userId, roleKey);
  }

  /**
   * GET /api/orders/:id — BUYER or FARMER can view their own order detail.
   * Ownership is not enforced here for brevity — add it in Phase 3 guard or
   * by extending findOne with a userId/role filter.
   */
  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.FARMER)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }
}
