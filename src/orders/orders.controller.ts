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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPaginatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import { ErrorResponseDto, OrderModel } from '../common/swagger/swagger.models.js';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.MANAGER, Role.ADMIN)
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create order',
    description: 'Requires authenticated user; MANAGER/ADMIN can create for others.',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created',
    type: OrderModel,
    examples: {
      created: {
        value: {
          id: 1,
          status: 'PENDING',
          total: '199.98',
          userId: 2,
          items: [],
          user: { id: 2, email: 'user@example.com', name: 'User', role: 'USER' },
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed or insufficient stock', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Role restriction', type: ErrorResponseDto })
  create(
    @Body(EnsureAvailableStockPipe) createOrderDto: CreateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.create(createOrderDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated orders' })
  @ApiPaginatedResponse({ description: 'Paginated orders', model: OrderModel })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  findAll(@Query() query: OrderQueryDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiOkResponse({ type: OrderModel })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden for this user', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found', type: ErrorResponseDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findOne(id, user);
  }
}
