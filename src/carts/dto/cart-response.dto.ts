import { ApiProperty } from '@nestjs/swagger';

import { CartStatus } from '../cart-status.enum.js';
import { CartItemResponseDto } from './cart-item-response.dto.js';

export class CartResponseDto {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ enum: CartStatus, example: CartStatus.ACTIVE })
  status!: CartStatus;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items!: CartItemResponseDto[];
}
