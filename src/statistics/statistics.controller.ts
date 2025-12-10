import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../auth/role.enum.js';
import { StatisticsService } from './statistics.service.js';
import { AdminOverviewDto, ErrorResponseDto } from '../common/swagger/swagger.models.js';
import { SalesQueryDto, StatisticsFilterDto, TopSkuQueryDto } from './dto/statistics-query.dto.js';
import type { ExportFormat } from './dto/statistics-query.dto.js';
import { CategorySalesModel, ConversionModel, SalesPeriodModel, TopSkuModel } from './dto/statistics-response.dto.js';
import type { Response } from 'express';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller({ path: 'statistics', version: '1' })
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('admin-overview')
  @ApiOperation({ summary: 'Administrative overview' })
  @ApiOkResponse({ description: 'Aggregated shop statistics', type: AdminOverviewDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role', type: ErrorResponseDto })
  getAdminOverview() {
    return this.statisticsService.getAdminOverview();
  }

  @Get('sales/periods')
  @ApiOperation({ summary: 'Sales grouped by period' })
  @ApiOkResponse({ description: 'Sales by period', type: [SalesPeriodModel] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role', type: ErrorResponseDto })
  getSalesByPeriod(@Query() query: SalesQueryDto, @Res({ passthrough: true }) res: Response) {
    return this.respondWithFormat(
      this.statisticsService.getSalesByPeriod(query),
      query.format,
      res,
      'sales-by-period',
    );
  }

  @Get('sales/categories')
  @ApiOperation({ summary: 'Sales grouped by category' })
  @ApiOkResponse({ description: 'Sales by category', type: [CategorySalesModel] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role', type: ErrorResponseDto })
  getSalesByCategory(@Query() query: StatisticsFilterDto, @Res({ passthrough: true }) res: Response) {
    return this.respondWithFormat(
      this.statisticsService.getSalesByCategory(query),
      query.format,
      res,
      'sales-by-category',
    );
  }

  @Get('sales/top-sku')
  @ApiOperation({ summary: 'Top selling SKUs' })
  @ApiOkResponse({ description: 'Top SKUs', type: [TopSkuModel] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role', type: ErrorResponseDto })
  getTopSkus(@Query() query: TopSkuQueryDto, @Res({ passthrough: true }) res: Response) {
    return this.respondWithFormat(
      this.statisticsService.getTopSkus(query),
      query.format,
      res,
      'top-skus',
    );
  }

  @Get('conversion')
  @ApiOperation({ summary: 'Cart to order conversion' })
  @ApiOkResponse({ description: 'Conversion rate', type: ConversionModel })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role', type: ErrorResponseDto })
  getConversion(@Query() query: StatisticsFilterDto, @Res({ passthrough: true }) res: Response) {
    return this.respondWithFormat(
      this.statisticsService.getConversion(query),
      query.format,
      res,
      'conversion',
    );
  }

  private async respondWithFormat(
    dataPromise: Promise<unknown>,
    format: ExportFormat | undefined,
    res: Response,
    filename: string,
  ) {
    const data = await dataPromise;

    if (format === 'csv') {
      const csv = this.toCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return csv;
    }

    return data;
  }

  private toCsv(data: unknown) {
    const rows = Array.isArray(data) ? data : [data];
    if (!rows.length) {
      return '';
    }

    const headers = Array.from(rows.reduce<Set<string>>((set, row) => {
      Object.keys(row as Record<string, unknown>).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()));

    const csvRows = [headers.join(',')];
    for (const row of rows) {
      const line = headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        })
        .join(',');
      csvRows.push(line);
    }

    return csvRows.join('\n');
  }
}
