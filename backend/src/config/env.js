const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().integer().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  DATABASE_URL: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().default('*'),
  REDIS_URL: Joi.string().uri().allow('', null).optional(),
  CACHE_DEFAULT_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').optional(),
  LOG_FILE: Joi.string().allow('', null).optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CRON_ENABLED: Joi.boolean().default(false),
  CRON_SECRET: Joi.string().min(16).allow('', null).optional(),
}).unknown(true);

const { error, value } = envSchema.validate(process.env, { stripUnknown: false });

if (error) {
  console.error('Invalid environment variables:', error.message);
  throw new Error('Invalid environment variables');
}

const env = {
  NODE_ENV: value.NODE_ENV,
  PORT: value.PORT,
  HOST: value.HOST,
  DATABASE_URL: value.DATABASE_URL,
  CORS_ORIGIN: value.CORS_ORIGIN,
  REDIS_URL: value.REDIS_URL || undefined,
  CACHE_DEFAULT_TTL_SECONDS: value.CACHE_DEFAULT_TTL_SECONDS,
  LOG_LEVEL: value.LOG_LEVEL,
  LOG_FILE: value.LOG_FILE || undefined,
  JWT_ACCESS_SECRET: value.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: value.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: value.JWT_REFRESH_EXPIRES_IN,
  CRON_ENABLED: value.CRON_ENABLED,
  CRON_SECRET: value.CRON_SECRET || undefined,
};

module.exports = { env };
