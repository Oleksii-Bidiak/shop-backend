import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckoutRequestDto {
  @ApiPropertyOptional({ description: 'Shipping method selected by the user', example: 'standard' })
  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ApiPropertyOptional({ description: 'Optional customer note for the order' })
  @IsString()
  @IsOptional()
  note?: string;
}
