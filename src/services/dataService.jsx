import { supabase } from './supabaseClient.js'

export async function fetchCertifications({ domain = '', limit = 100, signal } = {}) {
  const params = new URLSearchParams()
  if (domain) params.set('domain', domain)
  if (limit) params.set('limit', String(limit))

  const response = await fetch('/api/certifications?' + params.toString(), { signal })
  if (!response.ok) throw new Error('Certification data unavailable')
  const payload = await response.json()
  return payload.certifications || []
}

export async function fetchDomains({ signal } = {}) {
  const response = await fetch('/api/domains', { signal })
  if (!response.ok) throw new Error('Domain data unavailable')
  const payload = await response.json()
  return payload.domains || []
}

export function certificationToRecommendation(cert, index = 0) {
  return {
    name: cert.name,
    why: cert.forWho || 'Strong match for this target domain based on certification metadata.',
    roi: cert.avgHike ? String(cert.avgHike) + '%' : 'Market-linked',
    timeline: cert.timeMonths ? String(cert.timeMonths) + ' months' : 'Timeline varies',
    fastTrack: cert.link ? 'Open the provider page and review eligibility this week.' : 'Shortlist course providers and compare exam dates this week.',
    primary: index === 0,
    sourceId: cert.id,
  }
}

export function rankCertificationsForSwitcher(certs, timeline = 'flexible') {
  const maxMonths = timeline === 'fast' ? 3 : timeline === 'medium' ? 6 : 8

  return [...certs]
    .filter(cert => timeline === 'flexible' ? true : Number(cert.timeMonths || 99) <= maxMonths)
    .sort((a, b) => {
      const hikeDelta = Number(b.avgHike || 0) - Number(a.avgHike || 0)
      if (hikeDelta) return hikeDelta
      return Number(a.timeMonths || 99) - Number(b.timeMonths || 99)
    })
}

export function normalizeDemandCount(jobCount) {
  const count = Number(jobCount || 0)
  if (count > 2000) return 5
  if (count >= 1000) return 4
  if (count >= 500) return 3
  if (count >= 150) return 2
  return 1
}

export async function fetchDemandFromSupabase({ domain, city = 'all' } = {}) {
  if (!supabase) throw new Error('Supabase client is not configured')

  let query = supabase
    .from('demand_counts')
    .select('city_id,domain_id,job_count,updated_at')
    .eq('domain_id', domain)

  if (city && city !== 'all') query = query.eq('city_id', city)

  const { data, error } = await query
  if (error) throw error

  const cities = {}
  ;(data || []).forEach(row => {
    cities[row.city_id] = {
      jobCount: Number(row.job_count || 0),
      level: normalizeDemandCount(row.job_count),
      updatedAt: row.updated_at || '',
    }
  })

  return {
    source: 'supabase',
    cities,
  }
}
