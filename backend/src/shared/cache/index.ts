import { env } from '@/config/env.js';
import { RedisClient } from './redis-client.js';

type CacheEntry = { value: string; expiresAt: number };
type CounterEntry = { count: number; expiresAt: number };

let redis: RedisClient | null = null;
const memory = new Map<string, CacheEntry>();
const memoryCounters = new Map<string, CounterEntry>();

function nowMs(): number {
  return Date.now();
}

function getFromMemory(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function setInMemory(key: string, value: string, ttlSeconds: number): void {
  memory.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 });
}

export async function initCache(): Promise<{ mode: 'redis' | 'memory' | 'disabled' }> {
  if (!env.REDIS_URL) return { mode: 'disabled' };

  try {
    redis = new RedisClient(new URL(env.REDIS_URL));
    await redis.connect();
    return { mode: 'redis' };
  } catch (err) {
    // Fail open: keep server running with in-memory cache fallback.
    // Never log the Redis URL (contains credentials).
    console.error('Redis connection failed; falling back to in-memory cache');
    console.error(err);
    redis = null;
    return { mode: 'memory' };
  }
}

export async function closeCache(): Promise<void> {
  await redis?.quit();
  redis = null;
  memory.clear();
  memoryCounters.clear();
}

export async function cacheGet(key: string): Promise<string | null> {
  if (redis) {
    const value = await redis.command(['GET', key]);
    return typeof value === 'string' ? value : null;
  }
  return getFromMemory(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (redis) {
    await redis.command(['SET', key, value, 'EX', String(ttlSeconds)]);
    return;
  }
  setInMemory(key, value, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  if (redis) {
    await redis.command(['DEL', key]);
    return;
  }
  memory.delete(key);
}

/**
 * Increment a counter with an expiry window (for rate limiting).
 * Returns the counter value after increment.
 */
export async function cacheIncr(key: string, windowSeconds: number): Promise<number> {
  if (redis) {
    const value = await redis.command(['INCR', key]);
    if (typeof value !== 'number') throw new Error('Unexpected Redis INCR response');
    if (value === 1) {
      await redis.command(['EXPIRE', key, String(windowSeconds)]);
    }
    return value;
  }

  const existing = memoryCounters.get(key);
  const now = nowMs();
  if (!existing || existing.expiresAt <= now) {
    memoryCounters.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return 1;
  }

  existing.count += 1;
  return existing.count;
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    await cacheDel(key);
    return null;
  }
}

export async function cacheSetJson<T>(key: string, value: T, ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}

export async function cacheWrapJson<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS
): Promise<T> {
  const cached = await cacheGetJson<T>(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSetJson(key, fresh, ttlSeconds);
  return fresh;
}
