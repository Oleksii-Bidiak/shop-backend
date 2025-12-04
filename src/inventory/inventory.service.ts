import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listInventory(query: PaginationQueryDto & { search?: string }) {
    const { page = 1, limit = 10, search } = query;
    const where = search
      ? {
          variant: {
            name: { contains: search, mode: 'insensitive' },
          },
        }
      : {};

    const [total, data] = await this.prisma.$transaction([
      this.prisma.stock.count({ where }),
      this.prisma.stock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { variant: { include: { product: true } } },
        orderBy: { updatedAt: 'desc' },
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
