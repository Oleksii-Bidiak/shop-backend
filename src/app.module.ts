import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppConfigModule } from './config/config.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { CartsModule } from './carts/carts.module.js';
import { VariantsModule } from './variants/variants.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CheckoutModule } from './checkout/checkout.module.js';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('security.throttle.globalTtl') ?? 60,
            limit: configService.get<number>('security.throttle.globalLimit') ?? 120,
          },
        ],
      }),
    }),
    PrismaModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    AuthModule,
    StatisticsModule,
    CartsModule,
    VariantsModule,
    CheckoutModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
