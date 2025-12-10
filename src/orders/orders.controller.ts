import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { Role } from '../auth/role.enum.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import { OrdersService } from './orders.service.js';
import { EnsureAvailableStockPipe } from '../common/pipes/ensure-available-stock.pipe.js';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.MANAGER, Role.ADMIN)
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body(EnsureAvailableStockPipe) createOrderDto: CreateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.create(createOrderDto, user);
  }

  @Get()
  @ApiPaginatedResponse({ description: 'Paginated orders' })
  findAll(@Query() query: OrderQueryDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.findAll(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findOne(id, user);
  }
}
