import { Module } from '@nestjs/common';

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

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    AuthModule,
    StatisticsModule,
    CartsModule,
    VariantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
