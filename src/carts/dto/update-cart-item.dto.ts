import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  variantId!: number;

  @ApiProperty({ example: 1, minimum: 1, description: 'New quantity for the variant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
