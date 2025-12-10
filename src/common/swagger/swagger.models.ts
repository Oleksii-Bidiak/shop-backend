import { ApiProperty } from '@nestjs/swagger';

import { CartStatus } from '../../carts/cart-status.enum.js';
import { OrderStatus } from '../../orders/order-status.enum.js';
import { PaymentStatus } from '../../orders/payment-status.enum.js';
import { Role } from '../../auth/role.enum.js';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['name should not be empty'],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

export class StatusResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class CategoryModel {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Headphones' })
  name!: string;

  @ApiProperty({ example: 'headphones' })
  slug!: string;

  @ApiProperty({ required: false, example: 'Category description' })
  description?: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class CategoryWithProductsModel extends CategoryModel {
  @ApiProperty({ type: () => [ProductModel] })
  products!: ProductModel[];
}

export class ProductModel {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Wireless Headphones' })
  name!: string;

  @ApiProperty({ required: false, example: 'Noise-cancelling headphones' })
  description?: string;

  @ApiProperty({ example: 1 })
  categoryId!: number;

  @ApiProperty({ type: () => CategoryModel })
  category!: CategoryModel;

  @ApiProperty({ type: () => [VariantModel] })
  variants!: VariantModel[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class StockModel {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ example: 50 })
  quantity!: number;

  @ApiProperty({ required: false, example: 'main' })
  location?: string;

  @ApiProperty({ example: 2 })
  variantId!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ type: () => VariantModel, required: false })
  variant?: VariantModel;
}

export class VariantModel {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'Black / 128GB' })
  name!: string;

  @ApiProperty({ example: 'SKU-12345' })
  sku!: string;

  @ApiProperty({ example: '199.99' })
  price!: string;

  @ApiProperty({ example: 10 })
  productId!: number;

  @ApiProperty({ type: () => ProductModel })
  product!: ProductModel;

  @ApiProperty({ type: () => [StockModel] })
  stocks!: StockModel[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class UserModel {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class CartItemModel {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 2 })
  variantId!: number;

  @ApiProperty({ example: 1 })
  cartId!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ type: () => VariantModel })
  variant!: VariantModel;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class CartModel {
  @ApiProperty({ example: 3 })
  id!: number;

  @ApiProperty({ enum: CartStatus, example: CartStatus.ACTIVE })
  status!: CartStatus;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ type: () => [CartItemModel] })
  items!: CartItemModel[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class OrderItemModel {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 1 })
  orderId!: number;

  @ApiProperty({ example: 2 })
  variantId!: number;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: '99.99' })
  price!: string;

  @ApiProperty({ type: () => VariantModel })
  variant!: VariantModel;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class OrderModel {
  @ApiProperty({ example: 15 })
  id!: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status!: OrderStatus;

  @ApiProperty({ example: '349.99' })
  total!: string;

  @ApiProperty({ example: 3 })
  userId!: number;

  @ApiProperty({ type: () => UserModel })
  user!: UserModel;

  @ApiProperty({ type: () => [OrderItemModel] })
  items!: OrderItemModel[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class PaymentModel {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 15 })
  orderId!: number;

  @ApiProperty({ example: '49.99' })
  amount!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'mock' })
  provider!: string;

  @ApiProperty({ example: 'pi_123456789' })
  intentId!: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @ApiProperty({ required: false, example: { transactionId: 'tx_123' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  updatedAt!: string;
}

export class RevenueByStatusModel {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  status!: OrderStatus;

  @ApiProperty({ example: '499.99' })
  _sum!: { total: string };
}

export class TopCategoryModel {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Headphones' })
  name!: string;

  @ApiProperty({ example: 12 })
  _count!: { products: number };
}

export class AdminOverviewDto {
  @ApiProperty({
    example: { users: 10, orders: 5, revenue: '1200.00', pendingOrders: 2 },
  })
  totals!: { users: number; orders: number; revenue: string | number; pendingOrders: number };

  @ApiProperty({ type: () => [RevenueByStatusModel] })
  revenueByStatus!: RevenueByStatusModel[];

  @ApiProperty({ type: () => [TopCategoryModel] })
  topCategories!: TopCategoryModel[];

  @ApiProperty({ type: () => [OrderModel] })
  recentOrders!: OrderModel[];
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  accessToken!: string;

  @ApiProperty({ type: () => UserModel })
  user!: UserModel;
}

export const SWAGGER_EXTRA_MODELS = [
  ErrorResponseDto,
  StatusResponseDto,
  CategoryModel,
  CategoryWithProductsModel,
  ProductModel,
  VariantModel,
  StockModel,
  UserModel,
  CartItemModel,
  CartModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  RevenueByStatusModel,
  TopCategoryModel,
  AdminOverviewDto,
  AuthResponseDto,
];
