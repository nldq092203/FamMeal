import { cacheIncr } from '@/shared/cache/index.js';
import { AppError } from '@/shared/errors.js';

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export async function enforceRateLimit(options: {
  key: string;
  windowSeconds: number;
  max: number;
}): Promise<void> {
  const count = await cacheIncr(options.key, options.windowSeconds);
  if (count > options.max) {
    throw new RateLimitError();
  }
}

