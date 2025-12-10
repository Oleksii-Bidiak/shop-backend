import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';

import { CheckoutModule } from '../src/checkout/checkout.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { Role } from '../src/auth/role.enum.js';
import { OrderStatus } from '../src/orders/order-status.enum.js';
import { PaymentStatus } from '../src/orders/payment-status.enum.js';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 1, role: Role.USER };
    return true;
  }
}

class MockRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

class MockPrismaService {
  private stocks = new Map<number, number>([[10, 5]]);
  private orders: any[] = [];
  private payments: any[] = [];
  private cartData = {
    id: 1,
    userId: 1,
    status: 'ACTIVE',
    items: [
      {
        id: 1,
        cartId: 1,
        variantId: 10,
        quantity: 2,
        variant: {
          id: 10,
          sku: 'SKU-10',
          price: 100,
          stocks: [{ variantId: 10, quantity: 5 }],
        },
      },
    ],
  };

  reset() {
    this.stocks = new Map<number, number>([[10, 5]]);
    this.orders = [];
    this.payments = [];
    this.cartData = {
      id: 1,
      userId: 1,
      status: 'ACTIVE',
      items: [
        {
          id: 1,
          cartId: 1,
          variantId: 10,
          quantity: 2,
          variant: {
            id: 10,
            sku: 'SKU-10',
            price: 100,
            stocks: [{ variantId: 10, quantity: 5 }],
          },
        },
      ],
    };
  }

  cart = {
    findFirst: async ({ where }: any) => {
      if (
        where.userId === this.cartData.userId &&
        where.status === this.cartData.status
      ) {
        return { ...this.cartData };
      }
      return null;
    },
    update: async ({ data }: any) => {
      this.cartData = { ...this.cartData, ...data };
      return this.cartData;
    },
  };

  stock = {
    update: async ({ where, data }: any) => {
      const current = this.stocks.get(where.variantId) ?? 0;
      const decrement = data.quantity.decrement;
      if (current < decrement) {
        throw new Error('Insufficient stock');
      }
      this.stocks.set(where.variantId, current - decrement);
      return { variantId: where.variantId, quantity: current - decrement };
    },
  };

  order = {
    create: async ({ data }: any) => {
      const newOrder = {
        id: this.orders.length + 1,
        userId: data.userId,
        status: data.status,
        total: data.total,
        items: data.items.create.map((item: any, index: number) => ({
          id: index + 1,
          ...item,
          variant: { id: item.variantId, sku: 'SKU-10' },
        })),
      };
      this.orders.push(newOrder);
      return newOrder;
    },
    update: async ({ where, data }: any) => {
      const order = this.orders.find((o) => o.id === where.id);
      Object.assign(order, data);
      return order;
    },
  };

  payment = {
    create: async ({ data }: any) => {
      const payment = { id: this.payments.length + 1, ...data };
      this.payments.push(payment);
      return payment;
    },
    findUnique: async ({ where }: any) => {
      const payment = this.payments.find((p) => p.intentId === where.intentId);
      if (!payment) return null;
      const order = this.orders.find((o) => o.id === payment.orderId);
      return { ...payment, order };
    },
    update: async ({ where, data }: any) => {
      const payment = this.payments.find((p) => p.id === where.id)!;
      Object.assign(payment, data);
      return payment;
    },
  };

  async $transaction<T>(cb: (client: this) => Promise<T>) {
    return cb(this);
  }
}

describe('CheckoutController (e2e)', () => {
  let app: INestApplication;
  let prisma: MockPrismaService;

  beforeAll(async () => {
    prisma = new MockPrismaService();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CheckoutModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideGuard(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0);
  });

  beforeEach(() => {
    prisma.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /checkout creates payment intent and locks stock', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ shippingMethod: 'express', note: 'call me' })
      .expect(201);

    expect(response.body.paymentIntentId).toBeDefined();
    expect(response.body.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(response.body.orderStatus).toBe(OrderStatus.PAYMENT_PENDING);
    expect(response.body.amount).toEqual({ subtotal: 200, tax: 40, shipping: 17.5, total: 257.5 });
  });

  it('POST /checkout/webhook updates payment and order status', async () => {
    const checkout = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ shippingMethod: 'standard' })
      .expect(201);

    const intentId = checkout.body.paymentIntentId;

    const webhook = await request(app.getHttpServer())
      .post('/api/v1/checkout/webhook')
      .send({ intentId, status: PaymentStatus.SUCCEEDED })
      .expect(200);

    expect(webhook.body.status).toBe(PaymentStatus.SUCCEEDED);
    expect(prisma['orders'][0].status).toBe(OrderStatus.PAID);
  });
});
