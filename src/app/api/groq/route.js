import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createMockGroqResponse, isServerTestMode } from '../../../../server/testMode.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
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

  if (!body || typeof body !== 'object') {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (body.model && !ALLOWED_MODELS.has(body.model)) {
    return json({ error: 'Model not permitted: ' + body.model }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return json({ error: 'messages must be an array' }, { status: 400 });
  }

  const totalChars = body.messages.reduce((acc, message) => {
    return acc + (typeof message.content === 'string' ? message.content.length : 0);
  }, 0);

  if (totalChars > 60000) {
    return json({ error: 'Prompt too large. Reduce input size.' }, { status: 413 });
  }

  const safeMessages = body.messages.map((message) => ({
    role: ['user', 'assistant', 'system'].includes(message.role) ? message.role : 'user',
    content: typeof message.content === 'string' ? message.content.replace(/<[^>]*>?/gm, '') : '',
  }));

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

    const data = await response.json();
    if (!response.ok) return json(data, { status: response.status });

    return json(data);
  } catch (error) {
    return json({ error: 'Proxy error: ' + error.message }, { status: 500 });
  }
}
