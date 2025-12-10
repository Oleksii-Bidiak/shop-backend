export const configuration = () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
    cors: {
      origins: (process.env.CORS_ORIGINS || '*')
        .split(',')
        .map((origin) => origin.trim()),
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/shop?schema=public',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    totpSecret: process.env.TOTP_SECRET || 'change-me-in-production',
  },
  security: {
    throttle: {
      globalTtl: Number(process.env.THROTTLE_TTL || 60),
      globalLimit: Number(process.env.THROTTLE_LIMIT || 120),
      loginTtl: Number(process.env.LOGIN_THROTTLE_TTL || 60),
      loginLimit: Number(process.env.LOGIN_THROTTLE_LIMIT || 10),
      publicListTtl: Number(process.env.PUBLIC_LIST_THROTTLE_TTL || 60),
      publicListLimit: Number(process.env.PUBLIC_LIST_THROTTLE_LIMIT || 60),
    },
  },
});
