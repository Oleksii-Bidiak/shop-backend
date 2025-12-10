import path from 'node:path';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Verifier } from '@pact-foundation/pact';

import { AppModule } from '../../src/app.module.js';
import { ProductsService } from '../../src/products/products.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

const contractProduct = {
  id: 1,
  name: 'Smartphone X',
  description: 'Flagship device for contract verification',
  categoryId: 2,
  category: {
    id: 2,
    name: 'Electronics',
    slug: 'electronics',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  variants: [
    {
      id: 10,
      name: '128GB',
      sku: 'SMX-128-BLK',
      price: 799,
      currency: 'USD',
      stocks: [
        {
          id: 100,
          location: 'default',
          quantity: 15,
        },
      ],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

class PrismaServiceMock {
  async $connect() {}
}

describe('Contract verification: Products v1 API', () => {
  let app: INestApplication;
  let providerBaseUrl: string;

  beforeAll(() => {
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new PrismaServiceMock())
      .overrideProvider(ProductsService)
      .useValue({
        findAll: jest.fn().mockResolvedValue({ total: 1, page: 1, limit: 10, data: [contractProduct] }),
        findOne: jest.fn().mockResolvedValue(contractProduct),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.setGlobalPrefix('api');
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 0 : address.port;
    providerBaseUrl = `http://127.0.0.1:${port}/api/v1`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches the published consumer contracts', async () => {
    const pactPath = path.resolve(__dirname, '../../contracts/v1-products-consumer.json');

    const result = await new Verifier({
      provider: 'shop-backend',
      providerBaseUrl,
      pactUrls: [pactPath],
      publishVerificationResult: false,
      providerVersion: process.env.GITHUB_SHA ?? 'local',
      stateHandlers: {
        'v1 catalog contains at least one product': async () => undefined,
        'product 1 exists in v1 catalog': async () => undefined,
      },
      logLevel: 'info',
    }).verifyProvider();

    expect(result).toMatch(/finished:\s*0/);
  });
});
