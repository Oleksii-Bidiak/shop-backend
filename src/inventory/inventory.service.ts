import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SortOrder } from '../common/dto/sort-order.enum.js';
import { InventoryQueryDto, InventorySortBy } from './dto/inventory-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listInventory(query: InventoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sku,
      minPrice,
      maxPrice,
      sortBy = InventorySortBy.UPDATED_AT,
      sortOrder = SortOrder.DESC,
      startDate,
      endDate,
    } = query;

    const where: Prisma.StockWhereInput = {
      ...(search
        ? {
            variant: {
              name: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          }
        : {}),
      ...(sku
        ? {
            variant: { sku },
          }
        : {}),
      ...(minPrice || maxPrice
        ? {
            variant: {
              price: { gte: minPrice, lte: maxPrice },
            },
          }
        : {}),
      ...(startDate || endDate
        ? {
            updatedAt: { gte: startDate, lte: endDate },
          }
        : {}),
    };

    const orderBy: Prisma.StockOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case InventorySortBy.SKU:
          return { variant: { sku: sortOrder } };
        case InventorySortBy.PRICE:
          return { variant: { price: sortOrder } };
        default:
          return { updatedAt: sortOrder };
      }
    })();

    const [total, data] = await this.prisma.$transaction([
      this.prisma.stock.count({ where }),
      this.prisma.stock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { variant: { include: { product: true } } },
        orderBy,
      }),
    ]);

    return { total, page, limit, data };
  }

  async updateStock({ variantId, quantity, location }: UpdateStockDto) {
    const existing = await this.prisma.stock.findUnique({ where: { variantId } });
    if (!existing) {
      return this.prisma.stock.create({
        data: { variantId, quantity, location },
        include: { variant: true },
      });
    }

    return this.prisma.stock.update({
      where: { variantId },
      data: { quantity, location },
      include: { variant: true },
    });
  }

  async getStock(variantId: number) {
    const stock = await this.prisma.stock.findUnique({
      where: { variantId },
      include: { variant: true },
    });
    if (!stock) {
      throw new NotFoundException(`Stock for variant ${variantId} not found`);
    }
    return stock;
  }
}
