import {
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
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Order } from '../orders/entities/order.entity';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DELIVERER)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  /**
   * GET /api/deliveries/available
   * Lists AWAITING_DELIVERER_ASSIGN orders in the deliverer's wilaya.
   */
  @Get('available')
  findAvailableTasks(
    @CurrentUser('id') delivererId: string,
  ): Promise<Order[]> {
    return this.deliveriesService.findAvailableTasks(delivererId);
  }

  /**
   * GET /api/deliveries/current
   * Returns the deliverer's currently active task (if any).
   * MUST be declared before :orderId to avoid route collision.
   */
  @Get('current')
  getCurrentTask(@CurrentUser('id') delivererId: string): Promise<Order | null> {
    return this.deliveriesService.getCurrentTask(delivererId);
  }

  /**
   * GET /api/deliveries/:orderId
   * Returns full details of a specific delivery task.
   * Can be viewed if it's assigned to the caller or unassigned in their wilaya.
   */
  @Get(':orderId')
  getTaskDetail(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') delivererId: string,
  ): Promise<Order> {
    return this.deliveriesService.getTaskDetail(orderId, delivererId);
  }

  /**
   * POST /api/deliveries/:orderId/assign
   * Self-assign an available order (§6.6).
   * 409 if already busy or order not available.
   * 403 if order is outside the deliverer's wilaya.
   */
  @Post(':orderId/assign')
  @HttpCode(HttpStatus.OK)
  assignTask(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') delivererId: string,
  ): Promise<Order> {
    return this.deliveriesService.assignTask(orderId, delivererId);
  }

  /**
   * PATCH /api/deliveries/:orderId/confirm-pickup
   * Deliverer confirms physical collection from farmer.
   * If farmer has also confirmed → status transitions to IN_TRANSIT (§7).
   */
  @Patch(':orderId/confirm-pickup')
  @HttpCode(HttpStatus.OK)
  confirmPickup(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') delivererId: string,
  ): Promise<Order> {
    return this.deliveriesService.confirmPickup(orderId, delivererId);
  }

  /**
   * PATCH /api/deliveries/:orderId/confirm-delivery — DELIVERER confirms §6.5.
   * Sets delivererConfirmedDelivery=true.
   * Both buyerConfirmedDelivery + delivererConfirmedDelivery set → COMPLETED.
   * On COMPLETED, deliverer profile is released (isAvailable → true).
   */
  @Patch(':orderId/confirm-delivery')
  @HttpCode(HttpStatus.OK)
  confirmDelivery(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') delivererId: string,
  ): Promise<Order> {
    return this.deliveriesService.confirmDelivery(orderId, delivererId);
  }
}
