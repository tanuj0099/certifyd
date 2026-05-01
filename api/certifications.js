import { fallbackCertifications, getSupabase, normalizeCertification } from './_supabase.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const domain = String(req.query.domain || '').toLowerCase()
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 200)
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

  const supabase = getSupabase()
  if (!supabase) {
    return res.status(200).json({
      source: 'token-fallback',
      certifications: fallbackCertifications(domain).slice(0, limit),
    })
  }

  try {
    let query = supabase
      .from('certifications')
      .select('id,name,avg_cost,avg_hike,time_months,demand,link,affiliate,tags,domain_id,for_who')
      .order('avg_hike', { ascending: false })
      .limit(limit)

    if (domain) query = query.eq('domain_id', domain)

    const { data, error } = await query
    if (error) throw error

    return res.status(200).json({
      source: 'supabase',
      certifications: (data || []).map(normalizeCertification),
    })
  } catch (error) {
    return res.status(200).json({
      source: 'token-fallback',
      warning: error.message || 'Supabase query failed; using local fallback',
      certifications: fallbackCertifications(domain).slice(0, limit),
    })
  }
}
