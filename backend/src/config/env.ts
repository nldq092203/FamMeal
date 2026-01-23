import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('*'),

  // Redis cache (optional)
  REDIS_URL: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().url().optional()
  ),
  CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().min(1).default(60),
  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .optional(),
  LOG_FILE: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().optional()
  ),
  
  // JWT Configuration
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Cron (Vercel cron jobs or external scheduler)
  // If set, cron endpoints will accept ?secret=... (in addition to Vercel's x-vercel-cron header when present).
  CRON_SECRET: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().min(16).optional()
  ),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
};

/**
 * Validated environment configuration
 * Available throughout the application
 */
export const env = parseEnv();

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;
