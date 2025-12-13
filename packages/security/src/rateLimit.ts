/**
 * In-memory rate limiter using a sliding window algorithm.
 * Suitable for development; in production consider Redis-backed storage.
 */

export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  resetAt: number;
}

interface WindowEntry {
  timestamps: number[];
}

/**
 * Creates a rate limiter instance with in-memory storage.
 * Uses a sliding window algorithm to track requests.
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const { limit, windowMs } = config;
  const store = new Map<string, WindowEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
      // Remove entry if no timestamps remain
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, windowMs);

  // Allow cleanup interval to not keep process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  /**
   * Check if a request is allowed for the given key.
   * @param key Unique identifier (e.g., `${route}:${ip}`)
   */
  async function check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Filter out timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const currentCount = entry.timestamps.length;
    const resetAt = now + windowMs;

    if (currentCount >= limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request timestamp
    entry.timestamps.push(now);

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetAt,
    };
  }

  return { check, limit };
}
