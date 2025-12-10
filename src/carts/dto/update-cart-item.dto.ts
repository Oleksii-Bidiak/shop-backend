import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

import { MAX_QUANTITY, MIN_QUANTITY } from '../../common/constants/quantity.constants.js';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  variantId!: number;

  @ApiProperty({
    example: 1,
    minimum: MIN_QUANTITY,
    maximum: MAX_QUANTITY,
    description: 'New quantity for the variant',
  })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_QUANTITY)
  @Max(MAX_QUANTITY)
  quantity!: number;
}
