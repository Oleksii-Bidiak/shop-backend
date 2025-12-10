import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuthUser } from '../auth/interfaces/auth-user.interface.js';
import { Role } from '../auth/role.enum.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CartsService } from './carts.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { CartResponseDto } from './dto/cart-response.dto.js';
import { EnsureAvailableStockPipe } from '../common/pipes/ensure-available-stock.pipe.js';

@ApiTags('carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.MANAGER, Role.ADMIN)
@Controller({ path: 'carts', version: '1' })
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('active')
  @ApiOkResponse({ description: 'Get or create active cart', type: CartResponseDto })
  getActive(@CurrentUser() user: AuthUser) {
    return this.cartsService.getActiveCart(user.sub);
  }

  @Post('items')
  @ApiOkResponse({ description: 'Add a variant to the cart', type: CartResponseDto })
  @UsePipes(EnsureAvailableStockPipe)
  addItem(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(user.sub, dto);
  }

  @Put('items')
  @ApiOkResponse({ description: 'Update quantity for an item', type: CartResponseDto })
  @UsePipes(EnsureAvailableStockPipe)
  updateItem(@CurrentUser() user: AuthUser, @Body() dto: UpdateCartItemDto) {
    return this.cartsService.updateItem(user.sub, dto);
  }

  @Delete('items/:variantId')
  @ApiOkResponse({ description: 'Remove item from cart', type: CartResponseDto })
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.cartsService.removeItem(user.sub, variantId);
  }

  @Delete('items')
  @ApiOkResponse({ description: 'Remove all items from the cart', type: CartResponseDto })
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cartsService.clearCart(user.sub);
  }

  @Post('checkout')
  @ApiOkResponse({ description: 'Mark cart as checked out', type: CartResponseDto })
  checkout(@CurrentUser() user: AuthUser) {
    return this.cartsService.checkout(user.sub);
  }
}
