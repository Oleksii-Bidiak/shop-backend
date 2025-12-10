import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SortOrder } from '../common/dto/sort-order.enum.js';
import { InventoryQueryDto, InventorySortBy } from './dto/inventory-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto.js';

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
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.stock.findUnique({
        where: { variantId },
      });

      const previousQuantity = existing?.quantity ?? 0;
      const stock = existing
        ? await tx.stock.update({
            where: { variantId },
            data: { quantity, location },
            include: { variant: true },
          })
        : await tx.stock.create({
            data: { variantId, quantity, location },
            include: { variant: true },
          });

      await tx.stockMovement.create({
        data: {
          variantId,
          change: quantity - previousQuantity,
          previousQuantity,
          newQuantity: quantity,
          reason: 'MANUAL_ADJUST',
        },
      });

      return stock;
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

  async listMovements(query: StockMovementQueryDto) {
    const { page = 1, limit = 10, variantId } = query;

    const where: Prisma.StockMovementWhereInput = {
      ...(variantId ? { variantId } : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { variant: true, order: true },
        orderBy: { createdAt: Prisma.SortOrder.desc },
      }),
    ]);

    return { total, page, limit, data };
  }
}
