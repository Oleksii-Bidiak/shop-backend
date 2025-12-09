import { Injectable } from '@nestjs/common';

import { OrderStatus } from '../orders/order-status.enum.js';
import { PrismaService } from '../prisma/prisma.service.js';

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
}
