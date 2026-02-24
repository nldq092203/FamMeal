const { AppError } = require('../shared/errors');
const { logger } = require('../shared/logger');
const { env } = require('../config/env');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        message: err.message,
        code: err.code || 'APP_ERROR',
      },
      meta: { timestamp: new Date().toISOString() },
    };

    if (err.details) {
      response.error.details = err.details;
    }

    if (err.statusCode >= 500) {
      logger.error(err.message, { err: err.stack, method: req.method, url: req.url });
    } else {
      logger.warn(err.message, { code: err.code, method: req.method, url: req.url });
    }

    return res.status(err.statusCode).json(response);
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    logger.warn('Database validation error', { err: err.message, method: req.method, url: req.url });
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    logger.error('Database error', { err: err.message, method: req.method, url: req.url });
    return res.status(500).json({
      success: false,
      error: {
        message: 'Database query failed',
        code: 'DB_QUERY_FAILED',
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  logger.error('Unhandled error', { err: err.message, stack: err.stack, method: req.method, url: req.url });

  return res.status(500).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
    },
    meta: { timestamp: new Date().toISOString() },
  });
}

module.exports = { errorHandler };
