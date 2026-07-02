import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

// 5 login attempts per minute per IP
export const loginLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl_login',
  analytics: false,
}) : null;

// 3 signups per hour per IP
export const signupLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl_signup',
  analytics: false,
}) : null;

// 10 offer letter submissions per hour per authenticated user ID (or IP)
export const offerSubmissionLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl_offer_submission',
  analytics: false,
}) : null;

// General API limiter (20 per minute)
export const apiLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'rl_api',
  analytics: false,
}) : null;
