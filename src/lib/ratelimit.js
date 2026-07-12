import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory fallback rate limiter when Redis is unconfigured
const inMemoryStores = new Map();

class InMemoryRateLimiter {
  constructor(maxRequests, windowMs, prefix) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.prefix = prefix;
  }

  async limit(identifier) {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    let record = inMemoryStores.get(key);

    if (!record || now > record.reset) {
      record = { count: 0, reset: now + this.windowMs };
    }

    record.count += 1;
    inMemoryStores.set(key, record);

    const success = record.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - record.count);
    return { success, limit: this.maxRequests, remaining, reset: record.reset };
  }
}

// Different limits for different endpoints
export const rateLimiters = {
  // Auth endpoints — strict (5 per 15 mins)
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        prefix: 'rl:auth',
      })
    : new InMemoryRateLimiter(5, 15 * 60 * 1000, 'rl:auth'),

  // Password reset — strict (3 per 1 hour)
  passwordReset: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        prefix: 'rl:reset',
      })
    : new InMemoryRateLimiter(3, 60 * 60 * 1000, 'rl:reset'),

  // Offer letter submission — per user
  offerLetter: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'rl:offer',
      })
    : new InMemoryRateLimiter(10, 60 * 60 * 1000, 'rl:offer'),

  // Resume analysis — per user
  resumeAnalysis: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'rl:resume',
      })
    : new InMemoryRateLimiter(10, 60 * 60 * 1000, 'rl:resume'),

  // ROI calculator — generous, no auth required
  roiCalc: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 h'),
        prefix: 'rl:roi',
      })
    : new InMemoryRateLimiter(30, 60 * 60 * 1000, 'rl:roi'),

  // General API — catch-all
  general: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        prefix: 'rl:general',
      })
    : new InMemoryRateLimiter(100, 60 * 60 * 1000, 'rl:general'),
};

// Backwards compatibility alias for existing routes
export const offerSubmissionLimiter = rateLimiters.offerLetter;
export const loginLimiter = rateLimiters.auth;
export const signupLimiter = rateLimiters.auth;

// Helper to get identifier (user ID if authed, IP if not)
export function getRateLimitId(request, userId) {
  if (userId) return `user:${userId}`;

  const ip =
    request.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers?.get('x-real-ip') ??
    'unknown';

  return `ip:${ip}`;
}

// Helper to apply rate limit and return response
export async function applyRateLimit(limiter, identifier) {
  if (!limiter) return { limited: false };

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      const waitSeconds = Math.ceil((reset - Date.now()) / 1000);

      return {
        limited: true,
        response: new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again in ${waitSeconds} seconds.`,
            retryAfter: waitSeconds,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': waitSeconds.toString(),
            },
          }
        ),
      };
    }
  } catch (error) {
    // Fail open if redis is temporarily unreachable
  }

  return { limited: false };
}
