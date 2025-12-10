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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../auth/role.enum.js';
import { InventoryService } from './inventory.service.js';
import { InventoryQueryDto } from './dto/inventory-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';

@ApiTags('inventory')
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiPaginatedResponse({ description: 'Paginated inventory view' })
  list(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listInventory(query);
  }

  @Get(':variantId')
  getStock(@Param('variantId', ParseIntPipe) variantId: number) {
    return this.inventoryService.getStock(variantId);
  }

  @Post('adjust')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  upsert(@Body() dto: UpdateStockDto) {
    return this.inventoryService.updateStock(dto);
  }
}
