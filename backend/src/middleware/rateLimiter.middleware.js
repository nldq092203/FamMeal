const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
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
