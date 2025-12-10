import { Injectable } from '@nestjs/common';

import { OrderStatus } from '../orders/order-status.enum.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SalesQueryDto, StatisticsFilterDto, TopSkuQueryDto } from './dto/statistics-query.dto.js';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminOverview() {
    const [totalUsers, totalOrders, revenue, pendingOrders] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    const recentOrders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: { include: { variant: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    const topCategories = await this.prisma.category.findMany({
      take: 5,
      orderBy: { products: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } },
      },
    });

    const revenueByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _sum: { total: true },
    });

    return {
      totals: {
        users: totalUsers,
        orders: totalOrders,
        revenue: revenue._sum.total ?? 0,
        pendingOrders,
      },
      revenueByStatus,
      topCategories,
      recentOrders,
    };
  }

  async getSalesByPeriod(query: SalesQueryDto) {
    const where = this.buildOrderWhere(query);
    const orders = await this.prisma.order.findMany({
      where,
      select: { createdAt: true, total: true },
    });

    const grouped = orders.reduce<Record<string, number>>((acc, order) => {
      const period = this.formatPeriod(order.createdAt, query.interval ?? 'day');
      acc[period] = (acc[period] ?? 0) + Number(order.total);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([period, revenue]) => ({ period, revenue }));
  }

  async getSalesByCategory(query: StatisticsFilterDto) {
    const where = this.buildOrderWhere(query);
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: where,
        variant: {
          product: query.categoryId ? { categoryId: query.categoryId } : {},
        },
      },
      select: {
        quantity: true,
        price: true,
        variant: {
          select: {
            product: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    const grouped = items.reduce<Record<number, { name: string; quantity: number; revenue: number }>>(
      (acc, item) => {
        const categoryId = item.variant.product.category?.id ?? 0;
        const categoryName = item.variant.product.category?.name ?? 'Uncategorized';
        const existing = acc[categoryId] ?? { name: categoryName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.price) * item.quantity;
        acc[categoryId] = existing;
        return acc;
      },
      {},
    );

    return Object.entries(grouped)
      .map(([categoryId, stats]) => ({
        categoryId: Number(categoryId),
        categoryName: stats.name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getTopSkus(query: TopSkuQueryDto) {
    const where = this.buildOrderWhere(query);
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: where,
        variant: {
          product: query.categoryId ? { categoryId: query.categoryId } : {},
        },
      },
      select: {
        quantity: true,
        price: true,
        variant: { select: { id: true, sku: true, name: true, product: { select: { name: true } } } },
      },
    });

    const grouped = items.reduce<Record<number, { sku: string; name: string; productName: string; quantity: number; revenue: number }>>(
      (acc, item) => {
        const variantId = item.variant.id;
        const existing =
          acc[variantId] ?? {
            sku: item.variant.sku,
            name: item.variant.name,
            productName: item.variant.product.name,
            quantity: 0,
            revenue: 0,
          };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.price) * item.quantity;
        acc[variantId] = existing;
        return acc;
      },
      {},
    );

    return Object.entries(grouped)
      .map(([variantId, stats]) => ({
        variantId: Number(variantId),
        sku: stats.sku,
        name: stats.name,
        productName: stats.productName,
        quantitySold: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, query.limit ?? 10);
  }

  async getConversion(query: StatisticsFilterDto) {
    const dateFilter = this.buildDateFilter(query);

    const [carts, orders] = await this.prisma.$transaction([
      this.prisma.cart.count({
        where: {
          ...dateFilter,
          items: query.categoryId
            ? {
                some: {
                  variant: {
                    product: { categoryId: query.categoryId },
                  },
                },
              }
            : undefined,
        },
      }),
      this.prisma.order.count({
        where: this.buildOrderWhere(query),
      }),
    ]);

    const conversionRate = carts === 0 ? 0 : Number(((orders / carts) * 100).toFixed(2));

    return { carts, orders, conversionRate };
  }

  private buildDateFilter(query: StatisticsFilterDto) {
    if (!query.startDate && !query.endDate) {
      return undefined;
    }

    return {
      createdAt: {
        ...(query.startDate ? { gte: query.startDate } : {}),
        ...(query.endDate ? { lte: query.endDate } : {}),
      },
    };
  }

  private buildOrderWhere(query: StatisticsFilterDto) {
    return {
      status: query.status,
      ...this.buildDateFilter(query),
      ...(query.categoryId
        ? {
            items: {
              some: { variant: { product: { categoryId: query.categoryId } } },
            },
          }
        : {}),
    };
  }

  private formatPeriod(date: Date, interval: NonNullable<SalesQueryDto['interval']>) {
    if (interval === 'month') {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    return date.toISOString().slice(0, 10);
  }
}
