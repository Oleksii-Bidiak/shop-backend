import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CheckoutService } from './checkout.service.js';
import { CheckoutRequestDto } from './dto/checkout-request.dto.js';
import { CheckoutResponseDto } from './dto/checkout-response.dto.js';
import { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { PaymentWebhookDto } from './dto/payment-webhook.dto.js';
import { PaymentStatus } from '../orders/payment-status.enum.js';

@ApiTags('checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.MANAGER, Role.ADMIN)
@Controller({ path: 'checkout', version: '1' })
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Validate cart, lock stock, create order and payment intent',
    type: CheckoutResponseDto,
  })
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutRequestDto) {
    return this.checkoutService.checkout(user, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Update payment status and propagate to order if needed',
    schema: {
      properties: {
        status: { enum: Object.values(PaymentStatus) },
        intentId: { type: 'string' },
        orderId: { type: 'number' },
      },
    },
  })
  handleWebhook(@Body() dto: PaymentWebhookDto) {
    return this.checkoutService.handlePaymentWebhook(dto.intentId, dto.status);
  }
}
