import { fallbackDomains, getSupabase, normalizeDomain } from './_supabase.js'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

let ratelimit = null
function getRatelimit() {
  if (ratelimit) return ratelimit
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  ratelimit = new Ratelimit({
    redis:     Redis.fromEnv(),
    limiter:   Ratelimit.slidingWindow(30, '60 s'),
    analytics: false,
  })
  return ratelimit
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rl = getRatelimit()
  if (rl) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'anonymous'
    const { success, limit: rlLimit, remaining, reset } = await rl.limit(ip)
    res.setHeader('X-RateLimit-Limit', rlLimit)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', reset)
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait before making another request.' })
    }
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

  const supabase = getSupabase()
  if (!supabase) {
    return res.status(200).json({ source: 'token-fallback', domains: fallbackDomains() })
  }

  try {
    const { data, error } = await supabase
      .from('domains')
      .select('id,name,label,color')
      .order('name', { ascending: true })

    if (error) throw error

    return res.status(200).json({
      source: 'supabase',
      domains: (data || []).map(normalizeDomain),
    })
  } catch (error) {
    return res.status(200).json({
      source: 'token-fallback',
      warning: error.message || 'Supabase query failed; using local fallback',
      domains: fallbackDomains(),
    })
  }
}
