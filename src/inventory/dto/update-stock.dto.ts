import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ example: 'main' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Variant identifier' })
  @Type(() => Number)
  @IsInt()
  variantId!: number;
}
