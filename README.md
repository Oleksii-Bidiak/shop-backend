# Shop Backend

A NestJS service that exposes product, category, inventory, and order APIs backed by Prisma with a PostgreSQL datasource.

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables. Create a `.env` file or export variables:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shop?schema=public"
export PORT=3000
```

3. Run Prisma migrations and generate the client:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. (Optional) Seed baseline data:

```bash
npm run prisma:seed
```

5. Start the API:

```bash
npm run start:dev
```

OpenAPI documentation is available at `http://localhost:3000/api/docs` once the server is running.

## Available scripts

- `npm run start:dev` - Start the NestJS server in watch mode.
- `npm run start:prod` - Run the compiled server from `dist/`.
- `npm run build` - Compile TypeScript.
- `npm run lint` - Lint the project using ESLint and Prettier.
- `npm run prisma:migrate` - Apply Prisma migrations to the database.
- `npm run prisma:generate` - Generate the Prisma Client.
- `npm run prisma:seed` - Seed sample catalog and order data.

## Project structure

- `src/config` - Global configuration module.
- `src/prisma` - Prisma service wrapper for NestJS.
- `src/categories`, `src/products`, `src/inventory`, `src/orders` - Feature modules with controllers, services, and DTO validation.
- `prisma/schema.prisma` - Database schema for categories, products, variants, stock, carts, and orders.
- `prisma/seed.ts` - Seed script to load sample catalog data.

## API versioning and compatibility
- The backend uses URI versioning with `v1` as the current stable contract.
- Breaking-change rules, v1 guarantees, and the v2 migration roadmap are described in [docs/VERSIONING.md](docs/VERSIONING.md).

## Testing and quality
- Run `npm test` for unit tests and `npm run test:e2e` for end-to-end coverage.
- Contract verification for key product endpoints is available via `npm run test:contract`; Pact artifacts live under `contracts/` and are published by CI for downstream consumers.
