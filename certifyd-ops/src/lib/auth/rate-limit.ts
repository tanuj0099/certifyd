import { Redis } from '@upstash/redis';

// Optional Upstash Redis setup
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.error('Failed to initialize Upstash Redis:', e);
  }
}

// In-memory fallback for local development or when Redis is unconfigured
const inMemoryAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  lockedUntil?: number;
  reason?: string;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const attemptLimit = 5;
  const windowMs = 15 * 60 * 1000; // 15 mins
  const lockoutMs = 30 * 60 * 1000; // 30 mins

  if (redis) {
    try {
      const lockKey = `lockout:${ip}`;
      const lockedUntil = await redis.get<number>(lockKey);
      if (lockedUntil && lockedUntil > now) {
        return {
          success: false,
          remaining: 0,
          lockedUntil,
          reason: `Too many failed login attempts. IP locked for 30 minutes.`,
        };
      }

      const countKey = `attempts:${ip}`;
      const count = await redis.incr(countKey);
      if (count === 1) {
        await redis.expire(countKey, 15 * 60); // 15 min window
      }

      if (count > attemptLimit) {
        const lockTime = now + lockoutMs;
        await redis.set(lockKey, lockTime, { ex: 30 * 60 });
        await redis.del(countKey);
        return {
          success: false,
          remaining: 0,
          lockedUntil: lockTime,
          reason: `Exceeded 5 login attempts. IP locked for 30 minutes.`,
        };
      }

      return { success: true, remaining: attemptLimit - count };
    } catch (e) {
      console.error('Redis rate limit error, falling back to memory:', e);
    }
  }

  // In-memory fallback
  let record = inMemoryAttempts.get(ip);
  if (record && record.lockedUntil && record.lockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      lockedUntil: record.lockedUntil,
      reason: `Too many failed login attempts. IP locked for 30 minutes.`,
    };
  }

  if (!record || (now - record.firstAttempt > windowMs)) {
    record = { count: 1, firstAttempt: now };
    inMemoryAttempts.set(ip, record);
    return { success: true, remaining: attemptLimit - 1 };
  }

  record.count += 1;
  if (record.count > attemptLimit) {
    const lockTime = now + lockoutMs;
    record.lockedUntil = lockTime;
    return {
      success: false,
      remaining: 0,
      lockedUntil: lockTime,
      reason: `Exceeded 5 login attempts. IP locked for 30 minutes.`,
    };
  }

  return { success: true, remaining: attemptLimit - record.count };
}

export async function resetRateLimit(ip: string) {
  if (redis) {
    try {
      await redis.del(`attempts:${ip}`);
      await redis.del(`lockout:${ip}`);
    } catch (e) {
      console.error('Redis reset error:', e);
    }
  }
  inMemoryAttempts.delete(ip);
}
