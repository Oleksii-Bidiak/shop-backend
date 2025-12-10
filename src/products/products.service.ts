import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { SortOrder } from '../common/dto/sort-order.enum.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductQueryDto, ProductSortBy } from './dto/product-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const { variants = [], ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants.map((variant) => ({
            ...variant,
          })),
        },
      },
      include: { variants: true, category: true },
    });
  }

  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      sortBy = ProductSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = query;

    const where: Prisma.ProductWhereInput = {
      ...(search
        ? {
            OR: [
              {
                name: { contains: search, mode: Prisma.QueryMode.insensitive },
              },
              {
                description: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(minPrice || maxPrice
        ? {
            variants: {
              some: {
                price: {
                  gte: minPrice,
                  lte: maxPrice,
                },
              },
            },
          }
        : {}),
      ...(startDate || endDate
        ? {
            createdAt: { gte: startDate, lte: endDate },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case ProductSortBy.NAME:
          return { name: sortOrder };
        case ProductSortBy.PRICE:
          return {
            variants: sortOrder === SortOrder.ASC
              ? { _min: { price: sortOrder } }
              : { _max: { price: sortOrder } },
          };
        default:
          return { createdAt: sortOrder };
      }
    })();

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, variants: { include: { stocks: true } } },
        orderBy,
      }),
    ]);

    return { total, page, limit, data };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: { include: { stocks: true } } },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    const { variants, ...data } = dto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(variants
          ? {
              variants: {
                deleteMany: {},
                create: variants,
              },
            }
          : {}),
      },
      include: { category: true, variants: { include: { stocks: true } } },
    });
  }
}
