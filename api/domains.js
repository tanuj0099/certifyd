import { fallbackDomains, getSupabase, normalizeDomain } from './_supabase.js'

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
