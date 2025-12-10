import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { SortOrder } from '../../common/dto/sort-order.enum.js';

export enum CategorySortBy {
  NAME = 'name',
  SLUG = 'slug',
  CREATED_AT = 'createdAt',
}

export class CategoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by category name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by exact slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: CategorySortBy, default: CategorySortBy.NAME })
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy = CategorySortBy.NAME;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Filter categories created after this date',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter categories created before this date',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
