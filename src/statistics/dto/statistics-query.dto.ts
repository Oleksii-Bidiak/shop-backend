import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';

import { OrderStatus } from '../../orders/order-status.enum.js';

type ExportFormat = 'json' | 'csv';

type SalesInterval = 'day' | 'month';

export class StatisticsFilterDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by product category id', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: ['json', 'csv'], example: 'json', description: 'Response format' })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: ExportFormat;
}

export class SalesQueryDto extends StatisticsFilterDto {
  @ApiPropertyOptional({ enum: ['day', 'month'], default: 'day', description: 'Group sales by period' })
  @IsOptional()
  @IsIn(['day', 'month'])
  interval?: SalesInterval = 'day';
}

export class TopSkuQueryDto extends StatisticsFilterDto {
  @ApiPropertyOptional({ description: 'Limit number of returned SKUs', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export type { ExportFormat, SalesInterval };
