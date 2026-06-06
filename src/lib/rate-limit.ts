// In-memory rate limiter. For production, replace with Redis-backed implementation.

type RateLimitAction = 'listing' | 'message' | 'report' | 'upload';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<RateLimitAction, { limit: number; windowMs: number }> = {
  listing: { limit: 5, windowMs: 60 * 60 * 1000 },    // 5 per hour
  message: { limit: 50, windowMs: 60 * 1000 },          // 50 per minute
  report: { limit: 5, windowMs: 60 * 60 * 1000 },       // 5 per hour
  upload: { limit: 20, windowMs: 60 * 60 * 1000 },      // 20 per hour
};

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  key: string,
  action: RateLimitAction
): { allowed: boolean; remaining: number } {
  const config = RATE_LIMITS[action];
  const storeKey = `${action}:${key}`;
  const now = Date.now();

  const entry = rateLimitStore.get(storeKey);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  rateLimitStore.set(storeKey, entry);

  return { allowed: true, remaining: config.limit - entry.count };
}

export type { RateLimitAction };
