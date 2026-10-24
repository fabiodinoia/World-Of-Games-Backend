import rateLimit from 'express-rate-limit';

const windowMs = 15 * 60 * 1000;

const build = (limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

// Brute-force protection for login / register.
export const authLimiter = build(
  Number(process.env.RATE_LIMIT_AUTH) || 30,
  'Too many authentication attempts, try again later'
);

// POST / PUT / DELETE endpoints.
export const writeLimiter = build(
  Number(process.env.RATE_LIMIT_WRITE) || 200,
  'Too many write requests, try again later'
);
