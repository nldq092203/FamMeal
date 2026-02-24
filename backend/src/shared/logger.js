const winston = require('winston');
const { env } = require('../config/env');

const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'authorization'];

const redactSensitive = winston.format((info) => {
  for (const field of sensitiveFields) {
    if (info[field]) info[field] = '[REDACTED]';
  }
  return info;
});

function defaultLevel() {
  if (env.NODE_ENV === 'production') return 'info';
  if (env.NODE_ENV === 'test') return 'silent';
  return 'debug';
}

const transports = [];

if (env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.json(),
    })
  );
}

if (env.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: env.LOG_FILE,
      format: winston.format.json(),
    })
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL || defaultLevel(),
  format: winston.format.combine(
    redactSensitive(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  silent: env.NODE_ENV === 'test',
});

function logException(error, message = 'Unhandled exception', context = {}) {
  if (error instanceof Error) {
    logger.error(message, { err: error.message, stack: error.stack, ...context });
    return;
  }
  logger.error(message, { error, ...context });
}

module.exports = { logger, logException };
