import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
import { createMockGroqResponse, isServerTestMode } from '../server/testMode.js'

// ── Rate limiter (lazy-initialised so missing env vars don't crash build) ──
let ratelimit = null
function getRatelimit() {
  if (ratelimit) return ratelimit
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  ratelimit = new Ratelimit({
    redis:     Redis.fromEnv(),
    limiter:   Ratelimit.slidingWindow(20, '60 s'), // 20 req / IP / 60 s
    analytics: false,
  })
  return ratelimit
}

// ── Allowed Groq models whitelist ──────────────────────────
const ALLOWED_MODELS = new Set([
  'llama3-8b-8192',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
])

export default async function handler(req, res) {
  // ── Method guard ────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (isServerTestMode()) {
    return res.status(200).json(createMockGroqResponse(req.body))
  }

  // ── API key guard ────────────────────────────────────────
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  // ── Rate limiting (skip gracefully if Upstash not configured) ───
  const rl = getRatelimit()
  if (rl) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
          || req.headers['x-real-ip']
          || req.socket?.remoteAddress
          || 'anonymous'
    const { success, limit, remaining, reset } = await rl.limit(ip)
    res.setHeader('X-RateLimit-Limit',     limit)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset',     reset)
    if (!success) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait before making another request.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      })
    }
  }

  // ── Body validation ──────────────────────────────────────
  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  // Guard: model must be in allowlist
  if (body.model && !ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: 'Model not permitted: ' + body.model })
  }

  // Guard: messages must be an array of plain objects
  if (!Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'messages must be an array' })
  }

  // Guard: cap total prompt size at ~12,000 chars to prevent prompt injection DDoS
  const totalChars = body.messages.reduce(function(acc, m) {
    return acc + (typeof m.content === 'string' ? m.content.length : 0)
  }, 0)
  if (totalChars > 12000) {
    return res.status(413).json({ error: 'Prompt too large. Reduce input size.' })
  }

  // Guard: strip any system messages injected by client that might override behavior
  const safeMessages = body.messages.map(function(m) {
    return {
      role:    ['user', 'assistant', 'system'].includes(m.role) ? m.role : 'user',
      content: typeof m.content === 'string' ? m.content.replace(/<[^>]*>?/gm, '') : '',
    }
  })

  // ── Forward to Groq ──────────────────────────────────────
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        ...body,
        messages: safeMessages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message })
  }
}
