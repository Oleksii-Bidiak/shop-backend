import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { CartStatus } from '../carts/cart-status.enum.js';
import { OrderStatus } from '../orders/order-status.enum.js';
import { PaymentStatus } from '../orders/payment-status.enum.js';
import { CheckoutRequestDto } from './dto/checkout-request.dto.js';
import { AuthUser } from '../auth/interfaces/auth-user.interface.js';

@Injectable()
export class CheckoutService {
  private readonly taxRate = 0.2;
  private readonly shippingBase = 10;

  constructor(private readonly prisma: PrismaService) {}

  async checkout(user: AuthUser, dto: CheckoutRequestDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId: user.sub, status: CartStatus.ACTIVE },
      include: {
        items: {
          include: {
            variant: {
              include: { stocks: true },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }

    if (!cart.items.length) {
      throw new BadRequestException('Cart must contain at least one item');
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    );
    const tax = this.roundAmount(subtotal * this.taxRate);
    const shipping = this.calculateShipping(dto.shippingMethod);
    const total = this.roundAmount(subtotal + tax + shipping);
    const intentId = `pi_${randomUUID()}`;

    return this.prisma.$transaction(async (tx) => {
      const stockChanges: {
        variantId: number;
        previousQuantity: number;
        newQuantity: number;
      }[] = [];

      for (const item of cart.items) {
        const stock = item.variant.stocks[0];
        if (!stock || stock.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.variant.sku}`,
          );
        }

        const previousQuantity = stock.quantity;
        const newQuantity = stock.quantity - item.quantity;

        await tx.stock.update({
          where: { variantId: item.variantId },
          data: { quantity: { decrement: item.quantity } },
        });

        stockChanges.push({
          variantId: item.variantId,
          previousQuantity,
          newQuantity,
        });
      }

      const order = await tx.order.create({
        data: {
          userId: user.sub,
          status: OrderStatus.PAYMENT_PENDING,
          total,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.variant.price,
            })),
          },
        },
        include: { items: { include: { variant: true } } },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          changedByUserId: user.sub,
        },
      });

      if (stockChanges.length) {
        await tx.stockMovement.createMany({
          data: stockChanges.map((change) => ({
            variantId: change.variantId,
            orderId: order.id,
            change: change.newQuantity - change.previousQuantity,
            previousQuantity: change.previousQuantity,
            newQuantity: change.newQuantity,
            reason: 'CHECKOUT',
          })),
        });
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          currency: 'USD',
          provider: 'mock',
          intentId,
          status: PaymentStatus.PENDING,
          metadata: {
            shippingMethod: dto.shippingMethod ?? 'standard',
            note: dto.note,
          },
        },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.CHECKED_OUT },
      });

      return {
        orderId: order.id,
        orderStatus: order.status,
        paymentIntentId: payment.intentId,
        paymentStatus: payment.status,
        amount: { subtotal, tax, shipping, total },
      };
    });
  }

  async handlePaymentWebhook(intentId: string, status: PaymentStatus) {
    const payment = await this.prisma.payment.findUnique({
      where: { intentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment intent not found');
    }

    const targetOrderStatus = this.resolveOrderStatus(status, payment.order.status);

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status },
      });

      if (targetOrderStatus !== payment.order.status) {
        const updatedOrder = await tx.order.update({
          where: { id: payment.orderId },
          data: { status: targetOrderStatus },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
          },
        });
      }

      return updatedPayment;
    });
  }

  private calculateShipping(method?: string) {
    if (!method || method === 'standard') {
      return this.shippingBase;
    }

    if (method === 'express') {
      return this.roundAmount(this.shippingBase * 1.75);
    }

    return this.shippingBase;
  }

  private roundAmount(amount: number) {
    return Math.round(amount * 100) / 100;
  }

  private resolveOrderStatus(
    paymentStatus: PaymentStatus,
    currentOrderStatus: OrderStatus,
  ): OrderStatus {
    if (paymentStatus === PaymentStatus.SUCCEEDED) {
      return OrderStatus.PAID;
    }

    if (
      paymentStatus === PaymentStatus.FAILED ||
      paymentStatus === PaymentStatus.CANCELED
    ) {
      return OrderStatus.PAYMENT_FAILED;
    }

    return currentOrderStatus;
  }
}
