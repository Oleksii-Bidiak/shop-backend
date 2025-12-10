import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 3 })
  variantId!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({
    example: {
      id: 3,
      sku: 'TSHIRT-BLUE-M',
      name: 'Blue T-Shirt / Medium',
      price: '29.99',
    },
    description: 'Minimal variant information attached to the cart item',
  })
  variant!: Record<string, unknown>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}
