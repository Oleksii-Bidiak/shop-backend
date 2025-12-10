import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';

import { InventoryModule } from '../src/inventory/inventory.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { Role } from '../src/auth/role.enum.js';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = req.headers['x-test-role'] as Role | undefined;

    if (!role) {
      throw new UnauthorizedException();
    }

    req.user = { sub: 1, email: 'test@example.com', role };
    return true;
  }
}

class MockPrismaService {
  private stocks = [
    {
      variantId: 1,
      quantity: 25,
      location: 'main',
      variant: {
        id: 1,
        name: 'Variant 1',
        sku: 'SKU-1',
        price: 99,
        product: { id: 1, name: 'Product 1' },
      },
    },
  ];

  reset() {
    this.stocks = [
      {
        variantId: 1,
        quantity: 25,
        location: 'main',
        variant: {
          id: 1,
          name: 'Variant 1',
          sku: 'SKU-1',
          price: 99,
          product: { id: 1, name: 'Product 1' },
        },
      },
    ];
  }

  stock = {
    count: async () => this.stocks.length,
    findMany: async ({ skip = 0, take = 10 }: { skip?: number; take?: number }) =>
      this.stocks.slice(skip, skip + take),
    findUnique: async ({ where }: { where: { variantId: number } }) =>
      this.stocks.find((stock) => stock.variantId === where.variantId) ?? null,
  };

  async $transaction<T>(operations: Promise<T>[]) {
    return Promise.all(operations);
  }
}

describe('InventoryController (authorization)', () => {
  let app: INestApplication;
  let prisma: MockPrismaService;

  beforeAll(async () => {
    prisma = new MockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
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

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.reset();
  });

  it('rejects unauthorized requests to inventory list', async () => {
    await request(app.getHttpServer()).get('/api/v1/inventory').expect(401);
  });

  it('rejects customers without required role', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('x-test-role', Role.USER)
      .expect(403);
  });

  it('allows managers to list inventory', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('x-test-role', Role.MANAGER)
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('allows managers to fetch stock details', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/inventory/1')
      .set('x-test-role', Role.MANAGER)
      .expect(200);

    expect(response.body.variantId).toBe(1);
    expect(response.body.quantity).toBe(25);
  });
});
