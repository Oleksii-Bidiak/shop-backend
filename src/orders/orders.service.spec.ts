import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { OrdersService } from './orders.service.js';
import { Role } from '../auth/role.enum.js';

describe('OrdersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    variant: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const service = new OrdersService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when requested quantity exceeds available stock', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    prisma.variant.findMany.mockResolvedValue([
      { id: 1, sku: 'SKU-1', price: new Prisma.Decimal(10), stocks: [{ quantity: 1 }] },
    ]);

    await expect(
      service.create(
        { items: [{ variantId: 1, quantity: 2 }] } as any,
        { sub: 1, role: Role.USER } as any,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
