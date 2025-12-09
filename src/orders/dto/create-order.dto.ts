import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, ValidateNested } from 'class-validator';

import { OrderStatus } from '../order-status.enum.js';
import { OrderItemDto } from './order-item.dto.js';

export class CreateOrderDto {
  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
