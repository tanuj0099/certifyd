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

// Different limits for different endpoints
export const rateLimiters = {
  // Auth endpoints — strict
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        prefix: 'rl:auth',
      })
    : null,

  // Offer letter submission — per user
  offerLetter: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'rl:offer',
      })
    : null,

  // Resume analysis — per user
  resumeAnalysis: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'rl:resume',
      })
    : null,

  // ROI calculator — generous, no auth required
  roiCalc: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 h'),
        prefix: 'rl:roi',
      })
    : null,

  // General API — catch-all
  general: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        prefix: 'rl:general',
      })
    : null,
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
