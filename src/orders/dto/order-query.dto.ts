import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { SortOrder } from '../../common/dto/sort-order.enum.js';
import { OrderStatus } from '../order-status.enum.js';

export enum OrderSortBy {
  CREATED_AT = 'createdAt',
  STATUS = 'status',
  TOTAL = 'total',
}

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by multiple order statuses', enum: OrderStatus, isArray: true })
  @IsOptional()
  @IsEnum(OrderStatus, { each: true })
  statuses?: OrderStatus[];

  @ApiPropertyOptional({ description: 'Minimum order total' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  minTotal?: number;

  @ApiPropertyOptional({ description: 'Maximum order total' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  maxTotal?: number;

  @ApiPropertyOptional({ description: 'Filter orders created after this date', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter orders created before this date', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ enum: OrderSortBy, default: OrderSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(OrderSortBy)
  sortBy?: OrderSortBy = OrderSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
