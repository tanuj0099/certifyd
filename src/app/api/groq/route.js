import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { createMockGroqResponse, isServerTestMode } from '../../../../server/testMode.js';
import { validateGroqRequest } from '@/lib/validations/offer.js';
import { groqCircuitBreaker } from '@/lib/circuitBreaker.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

let ratelimit = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    analytics: false,
  });
  return ratelimit;
}

const ALLOWED_MODELS = new Set([
  'llama3-8b-8192',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]);

function json(data, init) {
  return NextResponse.json(data, init);
}

export const POST = Sentry.wrapRouteHandlerWithSentry(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error('request.json() failed:', err);
    return json({ error: 'Invalid request body', details: err.message }, { status: 400 });
  }

  if (isServerTestMode()) {
    return json(createMockGroqResponse(body));
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'API key not configured on server' }, { status: 500 });
  }

  const rl = getRatelimit();
  if (rl) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const { success, limit, remaining, reset } = await rl.limit(ip);

    if (!success) {
      return json(
        {
          error: 'Rate limit exceeded. Please wait before making another request.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }
  }

  const validation = validateGroqRequest(body);
  if (!validation.success) {
    return json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 });
  }

  const safeMessages = validation.data.messages;

  let cacheKey = null;
  const redisClient = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

  if (redisClient) {
    try {
      const payloadString = JSON.stringify({ ...body, messages: safeMessages });
      const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
      cacheKey = `groq_cache_${hash}`;

      const cachedResponse = await redisClient.get(cacheKey);
      if (cachedResponse) {
        console.log(`[Cache Hit] Serving from Redis: ${cacheKey}`);
        return json(cachedResponse);
      }
    } catch (cacheErr) {
      console.error('Redis get error:', cacheErr);
    }
  }

  try {
    const result = await groqCircuitBreaker.fire('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        messages: safeMessages,
      }),
    });

    if (!result.ok) {
      console.error('Groq API Error:', result.status, result.data);
      return json(result.data, { status: result.status });
    }

    const data = result.data;

    if (redisClient && cacheKey) {
      try {
        await redisClient.set(cacheKey, data, { ex: 86400 }); // 24 hours
        console.log(`[Cache Set] Stored in Redis: ${cacheKey}`);
      } catch (cacheErr) {
        console.error('Redis set error:', cacheErr);
      }
    }

    return json(data);
  } catch (error) {
    Sentry.captureException(error);
    console.error('Proxy error:', error);
    return json({ error: 'Proxy error: ' + error.message }, { status: 500 });
  }
});
