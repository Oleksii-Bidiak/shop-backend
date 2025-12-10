import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../constants/quantity.constants.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type StockCheckItem = { variantId: number; quantity: number };

@Injectable()
export class EnsureAvailableStockPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform<T extends StockCheckItem | { items: StockCheckItem[] }>(value: T) {
    const items: StockCheckItem[] = 'items' in value ? value.items : [value];

    if (!items?.length) {
      return value;
    }

    const variants = await this.prisma.variant.findMany({
      where: { id: { in: items.map((item) => item.variantId) } },
      include: { stocks: true },
    });

    if (variants.length !== items.length) {
      throw new BadRequestException('One or more variants were not found');
    }

    const stockMap = new Map(
      variants.map((variant) => [variant.id, { sku: variant.sku, quantity: variant.stocks[0]?.quantity ?? 0 }]),
    );

    for (const item of items) {
      const stock = stockMap.get(item.variantId);

      if (!stock) {
        throw new BadRequestException('Variant not found');
      }

      if (item.quantity < MIN_QUANTITY) {
        throw new BadRequestException(`Quantity must be at least ${MIN_QUANTITY}`);
      }

      if (item.quantity > MAX_QUANTITY) {
        throw new BadRequestException(`Quantity cannot exceed ${MAX_QUANTITY}`);
      }

      if (item.quantity > stock.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${stock.sku}. Available: ${stock.quantity}`,
        );
      }
    }

    return value;
  }
}
