import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class StockMovementQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by variant id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId?: number;
}
