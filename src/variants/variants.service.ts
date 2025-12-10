import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVariantDto } from './dto/create-variant.dto.js';
import { UpdateVariantDto } from './dto/update-variant.dto.js';
import { VariantQueryDto } from './dto/variant-query.dto.js';

@Injectable()
export class VariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVariantDto) {
    return this.prisma.variant.create({
      data: dto,
      include: { product: true, stocks: true },
    });
  }

  async findAll(query: VariantQueryDto) {
    const { page = 1, limit = 10, sku, minPrice, maxPrice, productId } = query;

    const where: Prisma.VariantWhereInput = {
      ...(sku
        ? {
            sku: { contains: sku, mode: Prisma.QueryMode.insensitive },
          }
        : {}),
      ...(productId ? { productId } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              gte: minPrice,
              lte: maxPrice,
            },
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.variant.count({ where }),
      this.prisma.variant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true, stocks: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, limit, data };
  }

  async findOne(id: number) {
    const variant = await this.prisma.variant.findUnique({
      where: { id },
      include: { product: true, stocks: true },
    });

    if (!variant) {
      throw new NotFoundException(`Variant ${id} not found`);
    }

    return variant;
  }

  async update(id: number, dto: UpdateVariantDto) {
    await this.findOne(id);

    return this.prisma.variant.update({
      where: { id },
      data: dto,
      include: { product: true, stocks: true },
    });
  }
}
