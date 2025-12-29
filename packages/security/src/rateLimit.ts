/**
 * Rate limiter with Upstash Redis support for serverless environments.
 * Falls back to in-memory storage for local development when Redis is not configured.
 *
 * @see https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Check if rate limiting should be disabled entirely.
 * Useful for CI/testing environments.
 */
function isRateLimitDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMIT === "true";
}

/**
 * Get the rate limit multiplier from environment.
 * Allows CI/testing to use higher limits without changing code.
 * Set RATE_LIMIT_MULTIPLIER=10 to allow 10x more requests.
 */
function getRateLimitMultiplier(): number {
  const multiplier = process.env.RATE_LIMIT_MULTIPLIER;
  if (!multiplier) return 1;
  const parsed = parseInt(multiplier, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

/**
 * Check if Upstash Redis is configured via environment variables.
 */
function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * In-memory storage for fallback when Redis is not available.
 * Used for local development only.
 */
interface WindowEntry {
  timestamps: number[];
}

const inMemoryStore = new Map<string, WindowEntry>();

// Set up cleanup interval for in-memory store (only once)
let cleanupInitialized = false;

function initializeInMemoryCleanup(windowMs: number) {
  if (cleanupInitialized) return;
  cleanupInitialized = true;

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
      if (entry.timestamps.length === 0) {
        inMemoryStore.delete(key);
      }
    }
  }, windowMs);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * In-memory rate limit check for local development.
 */
async function checkInMemory(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  initializeInMemoryCleanup(windowMs);

  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = inMemoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    inMemoryStore.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const currentCount = entry.timestamps.length;
  const resetAt = now + windowMs;

  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - currentCount - 1,
    resetAt,
  };
}

// Cache for Ratelimit instances (one per config)
const rateLimiterCache = new Map<string, Ratelimit>();

/**
 * Get or create an Upstash Ratelimit instance.
 * Instances are cached to enable request coalescing and analytics.
 */
function getOrCreateRatelimiter(
  limit: number,
  windowSeconds: number,
): Ratelimit {
  const cacheKey = `${limit}:${windowSeconds}`;

  let ratelimiter = rateLimiterCache.get(cacheKey);
  if (ratelimiter) {
    return ratelimiter;
  }

  const redis = Redis.fromEnv();

  ratelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: "ratelimit",
  });

  rateLimiterCache.set(cacheKey, ratelimiter);
  return ratelimiter;
}

/**
 * Creates a rate limiter instance.
 *
 * In production (with Upstash Redis configured):
 * - Uses Redis-backed sliding window algorithm
 * - Persists across serverless invocations
 * - Supports distributed rate limiting
 *
 * In development (without Redis):
 * - Falls back to in-memory storage
 * - Logs a warning on first use
 * - Suitable for local testing only
 *
 * Note: The RATE_LIMIT_MULTIPLIER env var is read at request time (not build time)
 * to allow CI/testing to use higher limits without rebuilding.
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const baseLimit = config.limit;
  const windowMs = config.windowMs;
  const windowSeconds = Math.ceil(windowMs / 1000);

  // Log once on first check if using fallback
  let hasLoggedFallback = false;

  async function check(key: string): Promise<RateLimitResult> {
    // Allow completely disabling rate limiting for CI/testing
    if (isRateLimitDisabled()) {
      return {
        allowed: true,
        remaining: 999,
        resetAt: Date.now() + windowMs,
      };
    }

    // Read multiplier at request time, not build time
    const multiplier = getRateLimitMultiplier();
    const limit = baseLimit * multiplier;
    const useRedis = isRedisConfigured();

    // Use in-memory fallback if Redis is not configured
    if (!useRedis) {
      if (!hasLoggedFallback) {
        console.warn(
          "[RateLimit] Upstash Redis not configured (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN). " +
            "Using in-memory fallback. This is fine for local development but will NOT work correctly in serverless production.",
        );
        hasLoggedFallback = true;
      }
      return checkInMemory(key, limit, windowMs);
    }

    // Use Upstash Redis
    const ratelimiter = getOrCreateRatelimiter(limit, windowSeconds);
    const { success, remaining, reset } = await ratelimiter.limit(key);

    return {
      allowed: success,
      remaining,
      resetAt: reset,
    };
  }

  // Return limit as a getter so it reads the multiplier at access time
  return {
    check,
    get limit() {
      return baseLimit * getRateLimitMultiplier();
    },
  };
}
