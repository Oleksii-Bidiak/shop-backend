import { Module } from '@nestjs/common';

import { CartsController } from './carts.controller.js';
import { CartsService } from './carts.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EnsureAvailableStockPipe } from '../common/pipes/ensure-available-stock.pipe.js';

@Module({
  imports: [PrismaModule],
  controllers: [CartsController],
  providers: [CartsService, EnsureAvailableStockPipe],
})
export class CartsModule {}
