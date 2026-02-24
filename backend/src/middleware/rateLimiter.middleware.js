const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  ...(isTestEnv ? { skip: () => true } : {}),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
    meta: { timestamp: new Date().toISOString() },
  },
});

const authLimiter = rateLimit({
  ...(isTestEnv ? { skip: () => true } : {}),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many authentication attempts, please try again later', code: 'RATE_LIMITED' },
    meta: { timestamp: new Date().toISOString() },
  },
});

module.exports = { globalLimiter, authLimiter };
