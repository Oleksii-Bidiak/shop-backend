import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VariantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'SKU for the variant' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 99.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  price!: number;
}
