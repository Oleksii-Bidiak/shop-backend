import { BadRequestException } from '@nestjs/common';

import { EnsureAvailableStockPipe } from './ensure-available-stock.pipe.js';

describe('EnsureAvailableStockPipe', () => {
  const prisma = {
    variant: {
      findMany: jest.fn(),
    },
  } as any;

  const pipe = new EnsureAvailableStockPipe(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects cart item when requested quantity exceeds stock', async () => {
    prisma.variant.findMany.mockResolvedValue([
      { id: 1, sku: 'SKU-1', stocks: [{ quantity: 1 }] },
    ]);

    await expect(pipe.transform({ variantId: 1, quantity: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects order payload when any item exceeds stock', async () => {
    prisma.variant.findMany.mockResolvedValue([
      { id: 1, sku: 'SKU-1', stocks: [{ quantity: 3 }] },
      { id: 2, sku: 'SKU-2', stocks: [{ quantity: 1 }] },
    ]);

    await expect(
      pipe.transform({ items: [{ variantId: 1, quantity: 2 }, { variantId: 2, quantity: 2 }] }),
    ).rejects.toThrow(BadRequestException);
  });
});
