import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RejectOrderDto } from './dto/reject-order.dto';
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
   */
  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.FARMER)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  // ── §7 State machine — Farmer response ───────────────────────────────────

  /**
   * PATCH /api/orders/:id/accept — FARMER accepts a PENDING order.
   *
   * §7 State transitions:
   *   PENDING + WITHOUT_DELIVERY → AWAITING_BUYER_PICKUP
   *   PENDING + WITH_DELIVERY    → AWAITING_DELIVERER_ASSIGN
   *
   * Returns the updated order with new status.
   * 409 if the order is not in PENDING status.
   * 403 if the authenticated farmer does not own the order.
   */
  @Patch(':id/accept')
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.OK)
  acceptOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') farmerId: string,
  ): Promise<Order> {
    return this.ordersService.acceptOrder(orderId, farmerId);
  }

  /**
   * PATCH /api/orders/:id/reject — FARMER rejects a PENDING order.
   *
   * §7 State transition:
   *   PENDING → REJECTED
   *
   * Body: `{ rejectionReason: string }` (required, max 500 chars).
   * Returns the updated order with status REJECTED and the stored reason.
   */
  @Patch(':id/reject')
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.OK)
  rejectOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser('id') farmerId: string,
  ): Promise<Order> {
    return this.ordersService.rejectOrder(orderId, farmerId, dto);
  }
}
