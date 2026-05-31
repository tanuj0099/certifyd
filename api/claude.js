import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'
import { createMockClaudeResponse, isServerTestMode } from '../server/testMode.js'

let ratelimit = null
function getRatelimit() {
  if (ratelimit) return ratelimit
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  ratelimit = new Ratelimit({
    redis:     Redis.fromEnv(),
    limiter:   Ratelimit.slidingWindow(5, '60 s'),
    analytics: false,
  })
  return ratelimit
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (isServerTestMode()) {
    return res.status(200).json(createMockClaudeResponse())
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Claude API key not configured' })
  }

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

  const { messages, max_tokens = 1024, temperature = 0.7 } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  const totalChars = messages.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0)
  if (totalChars > 15000) {
    return res.status(413).json({ error: 'Prompt too large. Reduce input size.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':        apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type':     'application/json',
      },
      body: JSON.stringify({
        model:       'claude-sonnet-4-6',
        max_tokens,
        temperature,
        system:      messages.find(m => m.role === 'system')?.content || 'You are a helpful assistant.',
        messages:    messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.replace(/<[^>]*>?/gm, '') : '' })),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    const text = data.content?.[0]?.text || ''
    return res.status(200).json({ content: text, usage: data.usage })
  } catch (err) {
    return res.status(500).json({ error: 'Claude proxy error: ' + err.message })
  }
}
