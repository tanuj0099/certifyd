import { createClient } from '@supabase/supabase-js'

const FALLBACK_DOMAINS = [
  { id: 'tech', label: 'Tech & Cloud' },
  { id: 'data', label: 'Data & AI' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'finance', label: 'Finance' },
  { id: 'management', label: 'Management' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'hr', label: 'HR & People' },
  { id: 'business', label: 'Business & Ops' },
]

const FALLBACK_CERTIFICATIONS = [
  {
    id: 'aws-saa',
    name: 'AWS Solutions Architect Associate',
    avgCost: 25000,
    avgHike: 35,
    timeMonths: 3,
    demand: 'Very High',
    link: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    affiliate: false,
    tags: ['Cloud', 'Backend', 'DevOps'],
    domain: 'tech',
    forWho: 'Mid-level engineers moving into cloud/architecture roles',
  },
  {
    id: 'google-data-analytics',
    name: 'Google Data Analytics Professional Certificate',
    avgCost: 12000,
    avgHike: 24,
    timeMonths: 4,
    demand: 'High',
    link: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    affiliate: false,
    tags: ['Analytics', 'SQL', 'BI'],
    domain: 'data',
    forWho: 'Career switchers entering data analytics',
  },
  {
    id: 'power-bi-pl300',
    name: 'Microsoft Power BI Data Analyst (PL-300)',
    avgCost: 15000,
    avgHike: 28,
    timeMonths: 3,
    demand: 'High',
    link: 'https://learn.microsoft.com/credentials/certifications/power-bi-data-analyst-associate/',
    affiliate: false,
    tags: ['Power BI', 'Analytics', 'Dashboarding'],
    domain: 'data',
    forWho: 'Analysts and switchers targeting BI roles',
  },
  {
    id: 'pmp',
    name: 'PMP Certification',
    avgCost: 45000,
    avgHike: 30,
    timeMonths: 6,
    demand: 'High',
    link: 'https://www.pmi.org/certifications/project-management-pmp',
    affiliate: false,
    tags: ['Project Management', 'Leadership'],
    domain: 'management',
    forWho: 'Experienced professionals moving into project leadership',
  },
]

let supabase = null

export function getSupabase() {
  if (supabase) return supabase

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null

  supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return supabase
}

export function normalizeCertification(row) {
  return {
    id: row.id,
    name: row.name,
    avgCost: Number(row.avg_cost ?? row.avgCost ?? 0),
    avgHike: Number(row.avg_hike ?? row.avgHike ?? 0),
    timeMonths: Number(row.time_months ?? row.timeMonths ?? 0),
    demand: row.demand || 'Medium',
    link: row.link || '',
    affiliate: Boolean(row.affiliate),
    tags: Array.isArray(row.tags) ? row.tags : [],
    domain: row.domain_id || row.domain || '',
    domainId: row.domain_id || row.domain || '',
    forWho: row.for_who || row.forWho || '',
  }
}

export function normalizeDomain(row) {
  return {
    id: row.id,
    label: row.label || row.name || row.id,
    name: row.name || row.label || row.id,
    color: row.color || '',
  }
}

export function fallbackCertifications(domain) {
  return FALLBACK_CERTIFICATIONS
    .filter(cert => !domain || cert.domain === domain)
    .map(normalizeCertification)
}

export function fallbackDomains() {
  return FALLBACK_DOMAINS.map(normalizeDomain)
}
