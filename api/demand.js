const CITIES = {
  bangalore: 'Bengaluru',
  hyderabad: 'Hyderabad',
  pune: 'Pune',
  mumbai: 'Mumbai',
  delhi: 'Delhi NCR',
  chennai: 'Chennai',
  kolkata: 'Kolkata',
  ahmedabad: 'Ahmedabad',
}

const DOMAIN_QUERIES = {
  tech: 'AWS OR Azure OR cloud OR Kubernetes OR cybersecurity certification',
  data: 'data analyst OR data science OR machine learning OR analytics certification',
  management: 'PMP OR scrum master OR project manager certification',
  business: 'six sigma OR supply chain OR operations certification',
  finance: 'CFA OR financial analyst OR investment analyst certification',
  marketing: 'digital marketing OR SEO OR performance marketing certification',
  product: 'product manager OR UX design OR product owner certification',
  hr: 'HR certification OR SHRM OR talent acquisition',
}

const FALLBACK_COUNTS = {
  tech: { bangalore: 2600, hyderabad: 2300, pune: 1800, mumbai: 1450, delhi: 1500, chennai: 1200, kolkata: 620, ahmedabad: 540 },
  data: { bangalore: 2400, hyderabad: 2100, pune: 1300, mumbai: 2050, delhi: 1400, chennai: 1100, kolkata: 580, ahmedabad: 520 },
  management: { bangalore: 1200, hyderabad: 1100, pune: 1050, mumbai: 2200, delhi: 2100, chennai: 760, kolkata: 620, ahmedabad: 1040 },
  business: { bangalore: 700, hyderabad: 680, pune: 1300, mumbai: 1400, delhi: 1200, chennai: 850, kolkata: 700, ahmedabad: 2100 },
  finance: { bangalore: 820, hyderabad: 720, pune: 760, mumbai: 2400, delhi: 1500, chennai: 700, kolkata: 1100, ahmedabad: 1200 },
  marketing: { bangalore: 1300, hyderabad: 900, pune: 1200, mumbai: 2300, delhi: 2200, chennai: 850, kolkata: 700, ahmedabad: 800 },
  product: { bangalore: 2200, hyderabad: 1300, pune: 1200, mumbai: 1150, delhi: 900, chennai: 700, kolkata: 260, ahmedabad: 280 },
  hr: { bangalore: 820, hyderabad: 780, pune: 740, mumbai: 1300, delhi: 1200, chennai: 760, kolkata: 620, ahmedabad: 680 },
}

export function normalizeDemand(jobCount) {
  if (jobCount > 2000) return 5
  if (jobCount >= 1000) return 4
  if (jobCount >= 500) return 3
  if (jobCount >= 150) return 2
  return 1
}

function getFallbackCount(domain, city) {
  return FALLBACK_COUNTS[domain]?.[city] ?? 500
}

async function fetchJSearchCount(domain, city) {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return null

  const query = DOMAIN_QUERIES[domain] || DOMAIN_QUERIES.tech
  const location = CITIES[city] || city
  const url = new URL('https://jsearch.p.rapidapi.com/search')
  url.searchParams.set('query', query + ' in ' + location + ', India')
  url.searchParams.set('page', '1')
  url.searchParams.set('num_pages', '1')
  url.searchParams.set('country', 'in')

  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': process.env.RAPIDAPI_JSEARCH_HOST || 'jsearch.p.rapidapi.com',
    },
  })

  if (!response.ok) throw new Error('Job API request failed with HTTP ' + response.status)
  const payload = await response.json()
  return Number(payload?.estimated_total_results || payload?.total_results || payload?.data?.length || 0)
}

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

  const rawDomain = String(req.query.domain || 'tech').toLowerCase()
  const domain = rawDomain.replace(/[^a-z0-9_-]/g, '')
  const rawCity = String(req.query.city || 'all').toLowerCase()
  const city = rawCity.replace(/[^a-z0-9_-]/g, '')
  const cities = city === 'all' ? Object.keys(CITIES) : [city]

  if (!DOMAIN_QUERIES[domain]) {
    return res.status(400).json({ error: 'Unsupported domain' })
  }

  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400')

  try {
    const cityResults = {}
    let source = process.env.RAPIDAPI_KEY ? 'rapidapi-jsearch' : 'fallback-estimate'

    await Promise.all(cities.map(async cityId => {
      if (!CITIES[cityId]) return
      let count = null
      try {
        count = await fetchJSearchCount(domain, cityId)
      } catch {
        source = 'fallback-estimate'
      }
      const jobCount = Number.isFinite(count) && count > 0 ? count : getFallbackCount(domain, cityId)
      cityResults[cityId] = {
        jobCount,
        level: normalizeDemand(jobCount),
      }
    }))

    return res.status(200).json({
      domain,
      city,
      source,
      updatedAt: new Date().toISOString(),
      cities: cityResults,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Demand lookup failed' })
  }
}
