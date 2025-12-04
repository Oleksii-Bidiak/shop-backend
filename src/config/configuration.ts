export const configuration = () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
  },
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/shop?schema=public',
  },
});
