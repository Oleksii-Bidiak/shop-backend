import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CartStatus } from './cart-status.enum.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CartsService {
  private readonly cartInclude = {
    items: { include: { variant: true } },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async getActiveCart(userId: number) {
    const existing = await this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: this.cartInclude,
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cart.create({
      data: { userId },
      include: this.cartInclude,
    });
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await this.getOrCreateCart(userId, tx);
      const variant = await tx.variant.findUnique({
        where: { id: dto.variantId },
        include: { stocks: true },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${dto.variantId} not found`);
      }

      const stockQuantity = variant.stocks[0]?.quantity ?? 0;
      if (dto.quantity > stockQuantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.sku}. Available: ${stockQuantity}`,
        );
      }

      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
      });

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: dto.quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: dto.variantId,
            quantity: dto.quantity,
          },
        });
      }

      return tx.cart.findUnique({ where: { id: cart.id }, include: this.cartInclude });
    });
  }

  async updateItem(userId: number, dto: UpdateCartItemDto) {
    return this.addItem(userId, dto);
  }

  async removeItem(userId: number, variantId: number) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCart(userId, tx);
      if (!cart) {
        throw new NotFoundException('Active cart not found');
      }

      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
      });

      if (!existing) {
        throw new NotFoundException('Cart item not found');
      }

      await tx.cartItem.delete({ where: { id: existing.id } });

      return tx.cart.findUnique({ where: { id: cart.id }, include: this.cartInclude });
    });
  }

  async clearCart(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await this.getOrCreateCart(userId, tx);

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.cart.findUnique({ where: { id: cart.id }, include: this.cartInclude });
    });
  }

  async checkout(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await this.findActiveCart(userId, tx);
      if (!cart) {
        throw new NotFoundException('Active cart not found');
      }

      return tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.CHECKED_OUT },
        include: this.cartInclude,
      });
    });
  }

  private findActiveCart(userId: number, client = this.prisma) {
    return client.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: this.cartInclude,
    });
  }

  private async getOrCreateCart(userId: number, client = this.prisma) {
    const cart = await this.findActiveCart(userId, client);
    if (cart) {
      return cart;
    }

    return client.cart.create({ data: { userId }, include: this.cartInclude });
  }
}
