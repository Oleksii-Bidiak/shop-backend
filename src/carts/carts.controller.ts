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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

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
import { ErrorResponseDto } from '../common/swagger/swagger.models.js';

@ApiTags('carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER, Role.MANAGER, Role.ADMIN)
@Controller({ path: 'carts', version: '1' })
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get or create active cart' })
  @ApiOkResponse({ description: 'Get or create active cart', type: CartResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  getActive(@CurrentUser() user: AuthUser) {
    return this.cartsService.getActiveCart(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a variant to the cart', description: 'Requires authenticated user role USER or above.' })
  @ApiOkResponse({ description: 'Add a variant to the cart', type: CartResponseDto })
  @UsePipes(EnsureAvailableStockPipe)
  @ApiBadRequestResponse({ description: 'Validation failed or insufficient stock', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  addItem(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(user.sub, dto);
  }

  @Put('items')
  @ApiOperation({ summary: 'Update quantity for an item' })
  @ApiOkResponse({ description: 'Update quantity for an item', type: CartResponseDto })
  @UsePipes(EnsureAvailableStockPipe)
  @ApiBadRequestResponse({ description: 'Validation failed or insufficient stock', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  updateItem(@CurrentUser() user: AuthUser, @Body() dto: UpdateCartItemDto) {
    return this.cartsService.updateItem(user.sub, dto);
  }

  @Delete('items/:variantId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiOkResponse({ description: 'Remove item from cart', type: CartResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Item or cart not found', type: ErrorResponseDto })
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.cartsService.removeItem(user.sub, variantId);
  }

  @Delete('items')
  @ApiOperation({ summary: 'Remove all items from the cart' })
  @ApiOkResponse({ description: 'Remove all items from the cart', type: CartResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cartsService.clearCart(user.sub);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Mark cart as checked out' })
  @ApiOkResponse({ description: 'Mark cart as checked out', type: CartResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Cart not accessible', type: ErrorResponseDto })
  checkout(@CurrentUser() user: AuthUser) {
    return this.cartsService.checkout(user.sub);
  }
}
