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
