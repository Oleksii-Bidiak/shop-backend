import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderQueryDto, OrderSortBy } from './dto/order-query.dto.js';
import { OrderStatus } from './order-status.enum.js';
import { Role } from '../auth/role.enum.js';
import { SortOrder } from '../common/dto/sort-order.enum.js';
import { AuthUser } from '../auth/interfaces/auth-user.interface.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    { userId, items, status = OrderStatus.PENDING }: CreateOrderDto,
    currentUser: AuthUser,
  ) {
    if (!items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const targetUserId = userId ?? currentUser.sub;
    if (currentUser.role === Role.USER && targetUserId !== currentUser.sub) {
      throw new ForbiddenException('Users can only create orders for themselves');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    const variants = await this.prisma.variant.findMany({
      where: { id: { in: items.map((item) => item.variantId) } },
      include: { stocks: true },
    });

    if (variants.length !== items.length) {
      throw new NotFoundException('One or more variants were not found');
    }

    const stockMap = new Map<number, { quantity: number }>(
      variants.map((variant) => [variant.id, variant.stocks[0] ?? { quantity: 0 }]),
    );

    const total = items.reduce((sum, item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const stock = stockMap.get(item.variantId)!;
      if (stock.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.sku}`,
        );
      }
      return sum + Number(variant.price) * item.quantity;
    }, 0);

    const resolvedStatus =
      currentUser.role === Role.USER ? OrderStatus.PENDING : status;

    return this.prisma.$transaction(async (tx) => {
      const stockChanges: {
        variantId: number;
        previousQuantity: number;
        newQuantity: number;
      }[] = [];

      for (const item of items) {
        const previousQuantity = stockMap.get(item.variantId)!.quantity;
        const newQuantity = previousQuantity - item.quantity;

        await tx.stock.update({
          where: { variantId: item.variantId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        stockChanges.push({
          variantId: item.variantId,
          previousQuantity,
          newQuantity,
        });
      }

      const order = await tx.order.create({
        data: {
          userId: targetUserId,
          status: resolvedStatus,
          total,
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: variants.find((v) => v.id === item.variantId)!.price,
            })),
          },
        },
        include: {
          items: { include: { variant: true } },
          user: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: resolvedStatus,
          changedByUserId: currentUser.sub,
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
            reason: 'ORDER_CREATED',
          })),
        });
      }

      return order;
    });
  }

  async findAll(query: OrderQueryDto, currentUser: AuthUser) {
    const {
      page = 1,
      limit = 10,
      status,
      statuses,
      userId,
      minTotal,
      maxTotal,
      startDate,
      endDate,
      sortBy = OrderSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = query;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(statuses?.length ? { status: { in: statuses } } : {}),
      ...(userId && currentUser.role !== Role.USER ? { userId } : {}),
      ...(minTotal || maxTotal ? { total: { gte: minTotal, lte: maxTotal } } : {}),
      ...(startDate || endDate ? { createdAt: { gte: startDate, lte: endDate } } : {}),
    };

    if (currentUser.role === Role.USER) {
      where.userId = currentUser.sub;
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case OrderSortBy.STATUS:
          return { status: sortOrder };
        case OrderSortBy.TOTAL:
          return { total: sortOrder };
        default:
          return { createdAt: sortOrder };
      }
    })();

    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { include: { variant: true } }, user: true },
        orderBy,
      }),
    ]);

    return { total, page, limit, data };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { variant: true } }, user: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (currentUser.role === Role.USER && order.userId !== currentUser.sub) {
      throw new ForbiddenException('Access to this order is denied');
    }
    return order;
  }

  async getStatusHistory(orderId: number, currentUser: AuthUser, page = 1, limit = 10) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (currentUser.role === Role.USER) {
      throw new ForbiddenException('Access to status history is denied');
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.orderStatusHistory.count({ where: { orderId } }),
      this.prisma.orderStatusHistory.findMany({
        where: { orderId },
        skip: (page - 1) * limit,
        take: limit,
        include: { changedByUser: true },
        orderBy: { changedAt: Prisma.SortOrder.desc },
      }),
    ]);

    return { total, page, limit, data };
  }
}
