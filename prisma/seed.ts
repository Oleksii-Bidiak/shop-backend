import { PrismaClient, OrderStatus, PaymentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [headphones, cases, glass] = await prisma.$transaction([
    prisma.category.create({
      data: { name: 'Headphones', slug: 'headphones', description: 'Wireless and wired audio gear' },
    }),
    prisma.category.create({
      data: { name: 'Cases', slug: 'cases', description: 'Protective cases for devices' },
    }),
    prisma.category.create({
      data: { name: 'Glass', slug: 'glass', description: 'Tempered glass for phones and tablets' },
    }),
  ]);

  const headphonesProduct = await prisma.product.create({
    data: {
      name: 'SonicWave Pro',
      description: 'Noise cancelling over-ear headphones',
      categoryId: headphones.id,
      variants: {
        create: [
          { name: 'Black', sku: 'HD-SW-BLK', price: 249.99 },
          { name: 'Silver', sku: 'HD-SW-SLV', price: 259.99 },
        ],
      },
    },
    include: { variants: true },
  });

  const caseProduct = await prisma.product.create({
    data: {
      name: 'Armor Case',
      description: 'Shock resistant phone case',
      categoryId: cases.id,
      variants: {
        create: [
          { name: 'Midnight Blue', sku: 'CASE-ARM-MB', price: 39.99 },
          { name: 'Crimson Red', sku: 'CASE-ARM-CR', price: 39.99 },
        ],
      },
    },
    include: { variants: true },
  });

  const glassProduct = await prisma.product.create({
    data: {
      name: 'Shield Glass',
      description: 'Scratch-resistant tempered glass',
      categoryId: glass.id,
      variants: {
        create: [
          { name: 'iPhone 15 Pro', sku: 'GLS-IP15P', price: 24.99 },
          { name: 'Pixel 9', sku: 'GLS-PX9', price: 19.99 },
        ],
      },
    },
    include: { variants: true },
  });

  const variants = [
    ...headphonesProduct.variants,
    ...caseProduct.variants,
    ...glassProduct.variants,
  ];

  await prisma.stock.createMany({
    data: variants.map((variant) => ({
      variantId: variant.id,
      quantity: 50,
      location: 'main',
    })),
  });

  const [, , customerUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      create: {
        email: 'admin@example.com',
        name: 'Shop Admin',
        password: await bcrypt.hash('AdminPass123', 10),
        role: Role.ADMIN,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'manager@example.com' },
      create: {
        email: 'manager@example.com',
        name: 'Shop Manager',
        password: await bcrypt.hash('ManagerPass123', 10),
        role: Role.MANAGER,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'customer@example.com' },
      create: {
        email: 'customer@example.com',
        name: 'Sample Customer',
        password: await bcrypt.hash('CustomerPass123', 10),
        role: Role.USER,
      },
      update: {},
    }),
  ]);

  await prisma.order.create({
    data: {
      userId: customerUser.id,
      status: OrderStatus.PAID,
      total: variants[0].price.mul(2),
      items: {
        create: [
          {
            variantId: variants[0].id,
            quantity: 2,
            price: variants[0].price,
          },
        ],
      },
      payments: {
        create: {
          amount: variants[0].price.mul(2),
          currency: 'USD',
          provider: 'mock',
          intentId: 'pi_seed_succeeded',
          status: PaymentStatus.SUCCEEDED,
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
