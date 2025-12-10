import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

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
import { ErrorResponseDto } from '../common/swagger/swagger.models.js';

@ApiTags('checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.MANAGER, Role.ADMIN)
@Controller({ path: 'checkout', version: '1' })
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({
    summary: 'Checkout current cart',
    description: 'Requires authenticated USER, MANAGER, or ADMIN roles.',
  })
  @ApiCreatedResponse({
    description: 'Validate cart, lock stock, create order and payment intent',
    type: CheckoutResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Cart invalid or payment failed to initialize', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'User cannot checkout this cart', type: ErrorResponseDto })
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutRequestDto) {
    return this.checkoutService.checkout(user, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle payment webhook callbacks' })
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
  @ApiBadRequestResponse({ description: 'Invalid webhook payload', type: ErrorResponseDto })
  handleWebhook(@Body() dto: PaymentWebhookDto) {
    return this.checkoutService.handlePaymentWebhook(dto.intentId, dto.status);
  }
}
