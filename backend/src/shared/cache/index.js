const Redis = require('ioredis');
const { env } = require('../../config/env');
const { logger } = require('../logger');

let redis = null;
const memory = new Map();
const memoryCounters = new Map();

function nowMs() {
  return Date.now();
}

function getFromMemory(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function setInMemory(key, value, ttlSeconds) {
  memory.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 });
}

async function initCache() {
  if (!env.REDIS_URL) return { mode: 'disabled' };

  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    await redis.connect();
    logger.info('Redis cache connected');
    return { mode: 'redis' };
  } catch (err) {
    logger.error('Redis connection failed; falling back to in-memory cache');
    redis = null;
    return { mode: 'memory' };
  }
}

async function closeCache() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
  memory.clear();
  memoryCounters.clear();
}

async function cacheGet(key) {
  if (redis) {
    return redis.get(key);
  }
  return getFromMemory(key);
}

async function cacheSet(key, value, ttlSeconds) {
  if (redis) {
    await redis.set(key, value, 'EX', ttlSeconds);
    return;
  }
  setInMemory(key, value, ttlSeconds);
}

async function cacheDel(key) {
  if (redis) {
    await redis.del(key);
    return;
  }
  memory.delete(key);
}

async function cacheIncr(key, windowSeconds) {
  if (redis) {
    const value = await redis.incr(key);
    if (value === 1) {
      await redis.expire(key, windowSeconds);
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

async function cacheGetJson(key) {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    await cacheDel(key);
    return null;
  }
}

async function cacheSetJson(key, value, ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS) {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}

async function cacheWrapJson(key, loader, ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS) {
  const cached = await cacheGetJson(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSetJson(key, fresh, ttlSeconds);
  return fresh;
}

module.exports = {
  initCache,
  closeCache,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheIncr,
  cacheGetJson,
  cacheSetJson,
  cacheWrapJson,
};
