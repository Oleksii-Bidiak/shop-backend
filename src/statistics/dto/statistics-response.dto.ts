import { ApiProperty } from '@nestjs/swagger';

export class SalesPeriodModel {
  @ApiProperty({ example: '2025-01-15' })
  period!: string;

  @ApiProperty({ example: 1250.5 })
  revenue!: number;
}

export class CategorySalesModel {
  @ApiProperty({ example: 1 })
  categoryId!: number;

  @ApiProperty({ example: 'Headphones' })
  categoryName!: string;

  @ApiProperty({ example: 25 })
  quantity!: number;

  @ApiProperty({ example: 2500.75 })
  revenue!: number;
}

export class TopSkuModel {
  @ApiProperty({ example: 2 })
  variantId!: number;

  @ApiProperty({ example: 'SKU-12345' })
  sku!: string;

  @ApiProperty({ example: 'Black / 128GB' })
  name!: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  productName!: string;

  @ApiProperty({ example: 30 })
  quantitySold!: number;

  @ApiProperty({ example: 3299.7 })
  revenue!: number;
}

export class ConversionModel {
  @ApiProperty({ example: 45 })
  carts!: number;

  @ApiProperty({ example: 30 })
  orders!: number;

  @ApiProperty({ example: 66.67 })
  conversionRate!: number;
}
