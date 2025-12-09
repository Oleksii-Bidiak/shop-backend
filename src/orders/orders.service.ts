import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import { OrderStatus } from './order-status.enum.js';
import { Role } from '../auth/role.enum.js';
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
      for (const item of items) {
        await tx.stock.update({
          where: { variantId: item.variantId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return tx.order.create({
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
    });
  }

  async findAll(query: OrderQueryDto, currentUser: AuthUser) {
    const { page = 1, limit = 10, status, userId } = query;
    const where: Record<string, unknown> = {
      ...(status ? { status } : {}),
      ...(userId && currentUser.role !== Role.USER ? { userId } : {}),
    };

    if (currentUser.role === Role.USER) {
      where.userId = currentUser.sub;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { items: { include: { variant: true } }, user: true },
        orderBy: { createdAt: 'desc' },
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
}
