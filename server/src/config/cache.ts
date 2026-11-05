/**
 * High-Performance Caching Layer (Redis + In-Memory Fallback)
 * Provides ultra-fast caching for REST API endpoints and database queries.
 * Supports Redis (Upstash, AWS ElastiCache, Redis Cloud, local Redis) via REDIS_URL,
 * with an automatic, resilient in-memory TTL cache fallback.
 */

import { Redis } from "ioredis";
import type { Request, Response, NextFunction } from "express";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

// Initialize Redis if REDIS_URL or REDIS_HOST is provided
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

if (redisUrl) {
  try {
    const isTls = redisUrl.startsWith("rediss://");
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
      enableOfflineQueue: false,
      connectTimeout: 5000,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
    });

    redisClient.on("connect", () => {
      console.log("⚡ [Cache] Redis connected successfully.");
      isRedisAvailable = true;
    });

    redisClient.on("ready", () => {
      isRedisAvailable = true;
    });

    redisClient.on("error", (err) => {
      console.warn("⚠️ [Cache] Redis error, using in-memory fallback:", err.message);
      isRedisAvailable = false;
    });
  } catch (err: any) {
    console.warn("⚠️ [Cache] Failed to initialize Redis, using in-memory cache:", err.message);
    redisClient = null;
    isRedisAvailable = false;
  }
} else {
  console.log("ℹ️ [Cache] No REDIS_URL configured. Running ultra-fast in-memory cache.");
}

// In-Memory Fallback Store with TTL and size eviction
interface MemoryEntry {
  data: string;
  expiresAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();
const MAX_MEMORY_KEYS = 500;

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000);

export async function getCache<T = any>(key: string): Promise<T | null> {
  // 1. Try Redis if available
  if (isRedisAvailable && redisClient) {
    try {
      const val = await redisClient.get(key);
      if (val) return JSON.parse(val) as T;
    } catch {
      // Fall through to memory store
    }
  }

  // 2. Fallback to in-memory store
  const entry = memoryStore.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  try {
    return JSON.parse(entry.data) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  const serialized = JSON.stringify(value);

  // 1. Set in Redis if available
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.set(key, serialized, "EX", ttlSeconds);
    } catch {
      // Fall through to memory store
    }
  }

  // 2. Set in memory store (with LRU-like eviction if full)
  if (memoryStore.size >= MAX_MEMORY_KEYS) {
    const firstKey = memoryStore.keys().next().value;
    if (firstKey) memoryStore.delete(firstKey);
  }

  memoryStore.set(key, {
    data: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function delCache(keyOrPrefix: string): Promise<void> {
  // 1. Invalidate in Redis
  if (isRedisAvailable && redisClient) {
    try {
      if (keyOrPrefix.includes("*")) {
        const keys = await redisClient.keys(keyOrPrefix);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(keyOrPrefix);
      }
    } catch {
      // ignore
    }
  }

  // 2. Invalidate in memory
  if (keyOrPrefix.includes("*")) {
    const escaped = keyOrPrefix.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const regex = new RegExp("^" + escaped + "$");
    const clean = keyOrPrefix.replace(/[*:]/g, "");
    for (const k of memoryStore.keys()) {
      if (regex.test(k) || (clean && k.includes(clean))) {
        memoryStore.delete(k);
      }
    }
  } else {
    for (const k of memoryStore.keys()) {
      if (k.startsWith(keyOrPrefix) || k === keyOrPrefix || k.includes(keyOrPrefix)) {
        memoryStore.delete(k);
      }
    }
  }
}

/**
 * Express middleware to cache GET requests and set optimal Edge CDN headers
 */
export function cacheMiddleware(ttlSeconds: number = 180) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests without authorization headers
    if (req.method !== "GET" || req.headers.authorization) {
      return next();
    }

    const cacheKey = `http:${req.originalUrl || req.url}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader(
          "Cache-Control",
          `public, max-age=${Math.min(ttlSeconds, 60)}, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`
        );
        return res.json(cached);
      }
    } catch {
      // On cache read error, continue to handler
    }

    // Intercept res.json to store into cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Do not cache empty data or error arrays
      const isEmptyArray = Array.isArray(body?.data) && body.data.length === 0;

      if (res.statusCode >= 200 && res.statusCode < 300 && !isEmptyArray) {
        setCache(cacheKey, body, ttlSeconds).catch(() => {});
        res.setHeader("X-Cache", "MISS");
        res.setHeader(
          "Cache-Control",
          `public, max-age=${Math.min(ttlSeconds, 30)}, s-maxage=${ttlSeconds}, stale-while-revalidate=60`
        );
      } else if (isEmptyArray) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
      return originalJson(body);
    };

    next();
  };
}

export function getCacheStatus(): { provider: "redis" | "memory"; isAvailable: boolean; memoryEntries: number } {
  return {
    provider: isRedisAvailable ? "redis" : "memory",
    isAvailable: isRedisAvailable || memoryStore.size >= 0,
    memoryEntries: memoryStore.size,
  };
}
