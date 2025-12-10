import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../orders/order-status.enum.js';
import { PaymentStatus } from '../../orders/payment-status.enum.js';

class AmountBreakdownDto {
  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  tax!: number;

  @ApiProperty()
  shipping!: number;

  @ApiProperty()
  total!: number;
}

export class CheckoutResponseDto {
  @ApiProperty({ description: 'Created order identifier' })
  orderId!: number;

  @ApiProperty({ enum: OrderStatus })
  orderStatus!: OrderStatus;

  @ApiProperty({ description: 'Payment intent identifier issued by the payment provider mock' })
  paymentIntentId!: string;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus!: PaymentStatus;

  @ApiProperty({ description: 'Breakdown of the calculated amounts', type: AmountBreakdownDto })
  amount!: AmountBreakdownDto;
}
