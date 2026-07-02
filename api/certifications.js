import { fallbackCertifications, getSupabase, normalizeCertification } from './_supabase.js'
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
    limiter:   Ratelimit.slidingWindow(20, '60 s'),
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

  // Sanitise query param by replacing non-alphanumeric/hyphen/underscore with empty string
  const rawDomain = String(req.query.domain || '').toLowerCase()
  const domain = rawDomain.replace(/[^a-z0-9_-]/g, '')
  
  const reqLimit = Math.min(Math.max(Number(req.query.limit || 100), 1), 200)
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

  const redis = getRedis()
  const cacheKey = `cache:certifications:${domain || 'all'}:${reqLimit}`
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return res.status(200).json({ source: 'redis-cache', certifications: cached })
      }
    } catch (err) {
      console.warn('Redis get error:', err)
    }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return res.status(200).json({
      source: 'token-fallback',
      certifications: fallbackCertifications(domain).slice(0, reqLimit),
    })
  }

  try {
    const buildQuery = (colName) => {
      let q = supabase
        .from('certifications')
        .select('*')
        .order('avg_hike', { ascending: false })
        .limit(reqLimit)
      if (domain && colName) q = q.eq(colName, domain)
      return q
    }

    let { data, error } = await buildQuery(domain ? 'domain_id' : null)
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
      // Fallback if the database schema uses 'domain' instead of 'domain_id'
      const fallbackRes = await buildQuery('domain')
      data = fallbackRes.data
      error = fallbackRes.error
    }
    if (error) throw error

    const certifications = (data || []).map(normalizeCertification)
    if (redis) {
      try {
        await redis.set(cacheKey, certifications, { ex: 86400 }) // 24 hours TTL
      } catch (err) {
        console.warn('Redis set error:', err)
      }
    }

    return res.status(200).json({
      source: 'supabase',
      certifications,
    })
  } catch (error) {
    return res.status(200).json({
      source: 'token-fallback',
      warning: error.message || 'Supabase query failed; using local fallback',
      certifications: fallbackCertifications(domain).slice(0, reqLimit),
    })
  }
}
