const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { UnauthorizedError } = require('../shared/errors');

function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

function optionalAuthMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
      req.user = { userId: payload.userId, email: payload.email };
    } catch (_err) {
      /* silent */
    }
  }

  next();
}

module.exports = { authMiddleware, optionalAuthMiddleware };
