import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator.js';
import { ApiTags } from '@nestjs/swagger';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { InventoryService } from './inventory.service.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';

@ApiTags('inventory')
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiPaginatedResponse({ description: 'Paginated inventory view' })
  list(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.inventoryService.listInventory(query);
  }

  @Get(':variantId')
  getStock(@Param('variantId', ParseIntPipe) variantId: number) {
    return this.inventoryService.getStock(variantId);
  }

  @Post('adjust')
  upsert(@Body() dto: UpdateStockDto) {
    return this.inventoryService.updateStock(dto);
  }
}
