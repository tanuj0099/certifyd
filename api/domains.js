import { fallbackDomains, getSupabase, normalizeDomain } from './_supabase.js'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

let ratelimit = null
let redisClient = null
function getRedis() {
  if (redisClient) return redisClient
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  redisClient = Redis.fromEnv()
  return redisClient
}

function getRatelimit() {
  if (ratelimit) return ratelimit
  const redis = getRedis()
  if (!redis) return null
  ratelimit = new Ratelimit({
    redis,
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

  const redis = getRedis()
  const cacheKey = 'cache:domains:all'
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return res.status(200).json({ source: 'redis-cache', domains: cached })
      }
    } catch (err) {
      console.warn('Redis get error:', err)
    }
  }

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

    const domains = (data || []).map(normalizeDomain)
    if (redis) {
      try {
        await redis.set(cacheKey, domains, { ex: 86400 }) // 24 hours TTL
      } catch (err) {
        console.warn('Redis set error:', err)
      }
    }

    return res.status(200).json({
      source: 'supabase',
      domains,
    })
  } catch (error) {
    return res.status(200).json({
      source: 'token-fallback',
      warning: error.message || 'Supabase query failed; using local fallback',
      domains: fallbackDomains(),
    })
  }
}
