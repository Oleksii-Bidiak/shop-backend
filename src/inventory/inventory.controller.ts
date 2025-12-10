import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../auth/role.enum.js';
import { InventoryService } from './inventory.service.js';
import { InventoryQueryDto } from './dto/inventory-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { ErrorResponseDto, StockModel } from '../common/swagger/swagger.models.js';

@ApiTags('inventory')
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated inventory view' })
  @ApiPaginatedResponse({ description: 'Paginated inventory view', model: StockModel })
  @ApiBadRequestResponse({ description: 'Invalid filters', type: ErrorResponseDto })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient role', type: ErrorResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  list(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listInventory(query);
  }

  @Get(':variantId')
  @ApiOperation({ summary: 'Get stock by variant id' })
  @ApiOkResponse({ type: StockModel })
  @ApiNotFoundResponse({ description: 'Stock not found', type: ErrorResponseDto })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient role', type: ErrorResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  getStock(@Param('variantId', ParseIntPipe) variantId: number) {
    return this.inventoryService.getStock(variantId);
  }

  @Post('adjust')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Adjust stock',
    description: 'Requires MANAGER or ADMIN roles.',
  })
  @ApiOkResponse({ type: StockModel })
  @ApiBadRequestResponse({ description: 'Validation failed', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient role', type: ErrorResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  upsert(@Body() dto: UpdateStockDto) {
    return this.inventoryService.updateStock(dto);
  }
}
