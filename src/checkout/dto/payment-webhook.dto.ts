import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

import { PaymentStatus } from '../../orders/payment-status.enum.js';

export class PaymentWebhookDto {
  @ApiProperty({ description: 'Payment intent identifier that payment provider sent back' })
  @IsString()
  intentId!: string;

  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}
