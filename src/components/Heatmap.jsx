import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Building2, Globe, Loader2, MapPin, RefreshCw, Wifi } from 'lucide-react'
import { fetchDemandFromSupabase } from '../services/dataService.jsx'

const F_HEAD = 'var(--font-head)'
const F_BODY = 'var(--font-body)'
const F_MONO = 'var(--font-mono)'

const PICTON = '#51B1E7'
const EMERALD = '#10B981'
const AMBER = '#F59E0B'
const SPRING = { type: 'spring', stiffness: 400, damping: 30 }

const CITIES = [
  { id: 'bangalore', label: 'Bangalore', short: 'BLR' },
  { id: 'hyderabad', label: 'Hyderabad', short: 'HYD' },
  { id: 'pune', label: 'Pune', short: 'PNQ' },
  { id: 'mumbai', label: 'Mumbai', short: 'BOM' },
  { id: 'delhi', label: 'Delhi NCR', short: 'DEL' },
  { id: 'chennai', label: 'Chennai', short: 'MAA' },
  { id: 'kolkata', label: 'Kolkata', short: 'CCU' },
  { id: 'ahmedabad', label: 'Ahmedabad', short: 'AMD' },
]

const CERT_CATEGORIES = [
  { id: 'tech', label: 'Tech & Cloud', color: PICTON, remoteFlag: 'remote', certs: ['AWS SAA', 'Azure', 'GCP', 'CKA', 'CompTIA Sec+', 'CEH'] },
  { id: 'data', label: 'Data & AI', color: '#818CF8', remoteFlag: 'remote', certs: ['Google Data Analytics', 'IBM Data Science', 'TensorFlow', 'Tableau'] },
  { id: 'management', label: 'Project Mgmt', color: EMERALD, remoteFlag: 'hybrid', certs: ['PMP', 'Scrum Master', 'PRINCE2'] },
  { id: 'business', label: 'Business & Ops', color: AMBER, remoteFlag: 'city-dependent', certs: ['Six Sigma', 'APICS CSCP', 'Google PM'] },
  { id: 'finance', label: 'Finance', color: '#34D399', remoteFlag: 'city-dependent', certs: ['CFA Level 1', 'FMVA', 'CPA'] },
  { id: 'marketing', label: 'Marketing', color: '#F472B6', remoteFlag: 'hybrid', certs: ['Google Digital Marketing', 'HubSpot', 'Meta Blueprint'] },
  { id: 'product', label: 'Product & UX', color: '#A78BFA', remoteFlag: 'remote', certs: ['Google UX', 'Product Mgmt Cert', 'CSPO'] },
  { id: 'hr', label: 'HR & People', color: '#FB923C', remoteFlag: 'city-dependent', certs: ['SHRM-CP', 'HRCI PHR', 'LinkedIn HR'] },
]

const DOMAIN_META = {
  tech: { insight: 'Cloud, DevOps, and cybersecurity postings are concentrated in product and services metros.', yoy: '+34%', avgHike: '35%', topHirers: ['Infosys', 'TCS', 'Wipro', 'Amazon India'] },
  data: { insight: 'Data and AI hiring is strongest where analytics, fintech, and product teams cluster.', yoy: '+42%', avgHike: '38%', topHirers: ['Flipkart', 'Swiggy', 'Zomato', 'Microsoft'] },
  management: { insight: 'Project management credentials are most useful in enterprise delivery, consulting, and transformation roles.', yoy: '+18%', avgHike: '30%', topHirers: ['Accenture', 'Deloitte', 'KPMG', 'IBM'] },
  business: { insight: 'Operations and supply-chain certifications map best to manufacturing and logistics hubs.', yoy: '+15%', avgHike: '25%', topHirers: ['Mahindra', 'Tata Motors', 'L&T', 'Asian Paints'] },
  finance: { insight: 'Finance certifications perform best near banking, investment, and fintech hiring clusters.', yoy: '+22%', avgHike: '35%', topHirers: ['HDFC', 'ICICI', 'Goldman Sachs', 'JP Morgan'] },
  marketing: { insight: 'Digital marketing hiring follows D2C, agency, media, and growth teams.', yoy: '+28%', avgHike: '22%', topHirers: ['Nykaa', 'Meesho', 'Dentsu', 'WPP India'] },
  product: { insight: 'Product and UX credentials are strongest in startup and SaaS product ecosystems.', yoy: '+35%', avgHike: '35%', topHirers: ['PhonePe', 'Razorpay', 'CRED', 'Freshworks'] },
  hr: { insight: 'HR certification demand is strongest around large corporates and high-volume hiring hubs.', yoy: '+12%', avgHike: '25%', topHirers: ['HCL', 'Tech Mahindra', 'Infosys HR', 'Capgemini'] },
}

const REMOTE_FLAG_CONFIG = {
  remote: { label: 'Remote-friendly', color: EMERALD, Icon: Wifi, tip: 'Strong demand for remote roles' },
  hybrid: { label: 'Hybrid', color: PICTON, Icon: Globe, tip: 'Mix of remote and on-site demand' },
  'city-dependent': { label: 'City-dependent', color: AMBER, Icon: Building2, tip: 'Most roles require metro presence' },
}

const LEVEL_CONFIG = {
  5: { label: 'Very High', color: EMERALD, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', bar: '100%' },
  4: { label: 'High', color: PICTON, bg: 'rgba(81,177,231,0.08)', border: 'rgba(81,177,231,0.22)', bar: '80%' },
  3: { label: 'Medium', color: AMBER, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', bar: '60%' },
  2: { label: 'Low', color: '#64748B', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.18)', bar: '35%' },
  1: { label: 'Very Low', color: '#94A3B8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.12)', bar: '15%' },
}

const CITY_ALIASES = { bengaluru: 'bangalore', blr: 'bangalore', ncr: 'delhi', gurgaon: 'delhi', gurugram: 'delhi', noida: 'delhi', faridabad: 'delhi', bom: 'mumbai', hyd: 'hyderabad', pnq: 'pune', ccu: 'kolkata', maa: 'chennai', amd: 'ahmedabad' }
const DOMAIN_ALIASES = { cloud: 'tech', devops: 'tech', security: 'tech', backend: 'tech', frontend: 'tech', ml: 'data', ai: 'data', analytics: 'data', pm: 'management', project: 'management', scrum: 'management', agile: 'management', 'supply chain': 'business', operations: 'business', ops: 'business', banking: 'finance', investment: 'finance', fintech: 'finance', 'digital marketing': 'marketing', seo: 'marketing', ux: 'product', design: 'product', people: 'hr', talent: 'hr', recruitment: 'hr' }

function createEmptyDemand() {
  return CITIES.reduce((acc, city) => {
    acc[city.id] = { level: 3, jobCount: 0 }
    return acc
  }, {})
}

function getLevel(data, cityId) {
  return data?.[cityId]?.level || 3
}

function DemandBar({ level }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG[3]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: cfg.bar }} transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }} style={{ height: '100%', borderRadius: '2px', background: cfg.color }} />
      </div>
      <span style={{ fontFamily: F_MONO, fontSize: '10px', color: cfg.color, minWidth: '54px', textAlign: 'right', letterSpacing: '0.04em' }}>
        {cfg.label}
      </span>
    </div>
  )
}

function CityDemandCard({ city, demand, loading }) {
  const level = getLevel(demand, city.id)
  const cfg = LEVEL_CONFIG[level]
  const jobCount = demand?.[city.id]?.jobCount || 0

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} whileHover={{ y: -2, transition: { duration: 0.18 } }} style={{ padding: '14px 16px', borderRadius: '8px', background: cfg.bg, border: '1px solid ' + cfg.border, opacity: loading ? 0.72 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '13px', color: 'var(--text)', letterSpacing: '-0.01em' }}>{city.label}</div>
          <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', letterSpacing: '0.08em', marginTop: '2px' }}>{city.short}</div>
        </div>
        <div style={{ padding: '2px 8px', borderRadius: '5px', background: cfg.color + '16', border: '1px solid ' + cfg.color + '28' }}>
          <span style={{ fontFamily: F_MONO, fontSize: '10px', color: cfg.color, fontWeight: '700', letterSpacing: '0.04em' }}>{level}/5</span>
        </div>
      </div>
      <DemandBar level={level} />
      <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO }}>
        {jobCount ? jobCount.toLocaleString('en-IN') + ' jobs' : loading ? 'Loading jobs' : 'Estimated signal'}
      </div>
    </motion.div>
  )
}

async function fetchDemand(domain, city = 'all', signal) {
  try {
    return await fetchDemandFromSupabase({ domain, city })
  } catch {
    // Supabase is the primary source; API fallback keeps local/dev usable until
    // VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.
  }

  const response = await fetch('/api/demand?domain=' + encodeURIComponent(domain) + '&city=' + encodeURIComponent(city), { signal })
  if (!response.ok) throw new Error('Demand API returned HTTP ' + response.status)
  return response.json()
}

export default function Heatmap({ prefilledCity = '', prefilledDomain = '', certName = '', resumeName = '' }) {
  const [selectedDomain, setSelectedDomain] = useState('tech')
  const [selectedCity, setSelectedCity] = useState('')
  const [autoDetected, setAutoDetected] = useState(false)
  const [domainDemand, setDomainDemand] = useState(createEmptyDemand)
  const [cityDomainDemand, setCityDomainDemand] = useState({})
  const [source, setSource] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [rankLoading, setRankLoading] = useState(false)
  const [error, setError] = useState('')

  const firstName = resumeName ? resumeName.split(' ')[0] : ''

  useEffect(() => {
    if (prefilledCity) {
      const lower = prefilledCity.toLowerCase()
      const cityKey = CITY_ALIASES[lower] || CITIES.find(city => city.label.toLowerCase().includes(lower))?.id || ''
      if (cityKey) {
        setSelectedCity(cityKey)
        setAutoDetected(true)
      }
    }
    if (prefilledDomain) {
      const lower = prefilledDomain.toLowerCase()
      const domKey = DOMAIN_ALIASES[lower] || lower
      if (CERT_CATEGORIES.find(category => category.id === domKey)) {
        setSelectedDomain(domKey)
        setAutoDetected(true)
      }
    }
  }, [prefilledCity, prefilledDomain])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchDemand(selectedDomain, 'all', controller.signal)
      .then(payload => {
        setDomainDemand({ ...createEmptyDemand(), ...(payload.cities || {}) })
        setSource(payload.source || 'api')
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError('Live demand unavailable. Showing neutral estimates.')
          setDomainDemand(createEmptyDemand())
          setSource('client-fallback')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [selectedDomain])

  useEffect(() => {
    if (!selectedCity) return undefined
    const controller = new AbortController()
    setRankLoading(true)

    Promise.all(CERT_CATEGORIES.map(category => fetchDemand(category.id, selectedCity, controller.signal).then(payload => [category.id, payload.cities?.[selectedCity]])))
      .then(entries => {
        setCityDomainDemand(Object.fromEntries(entries.filter(([, value]) => value)))
      })
      .catch(() => setCityDomainDemand({}))
      .finally(() => {
        if (!controller.signal.aborted) setRankLoading(false)
      })

    return () => controller.abort()
  }, [selectedCity])

  const categoryInfo = CERT_CATEGORIES.find(category => category.id === selectedDomain) || CERT_CATEGORIES[0]
  const domainMeta = DOMAIN_META[selectedDomain] || DOMAIN_META.tech
  const cityInfo = CITIES.find(city => city.id === selectedCity)
  const cityDemand = selectedCity ? getLevel(domainDemand, selectedCity) : null
  const sortedCities = useMemo(() => [...CITIES].sort((a, b) => getLevel(domainDemand, b.id) - getLevel(domainDemand, a.id)), [domainDemand])

  const headingText = firstName ? firstName.toUpperCase() + "'S CERT DEMAND BY" : 'CERT DEMAND BY'
  const subtitleText = firstName ? firstName + ', here is the demand map for your field across India.' : 'Pick a domain and see where demand is highest across India.'

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '6px', background: 'rgba(81,177,231,0.08)', border: '1px solid rgba(81,177,231,0.2)', fontSize: '10px', color: PICTON, marginBottom: '12px', letterSpacing: '0.08em', fontFamily: F_MONO, textTransform: 'uppercase' }}>
          {loading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={10} />} India demand intelligence
        </div>
        <h2 style={{ fontFamily: F_HEAD, fontWeight: '800', fontSize: 'clamp(1.5rem,3.2vw,2rem)', color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.03em' }}>
          {headingText} <span style={{ color: PICTON }}>CITY</span>
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.6' }}>{subtitleText}</p>

        {autoDetected && (prefilledCity || prefilledDomain) ? (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: EMERALD, flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY }}>
              Auto-detected from your resume:
              {prefilledCity && <strong style={{ color: PICTON, marginLeft: '6px' }}>{prefilledCity}</strong>}
              {prefilledDomain && <strong style={{ color: EMERALD, marginLeft: '6px' }}>{CERT_CATEGORIES.find(category => category.id === selectedDomain)?.label || prefilledDomain}</strong>}
            </div>
          </motion.div>
        ) : null}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Select your domain</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CERT_CATEGORIES.map(category => {
            const active = selectedDomain === category.id
            return (
              <button key={category.id} type="button" onClick={() => setSelectedDomain(category.id)} style={{ padding: '6px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: active ? '700' : '500', cursor: 'pointer', fontFamily: F_BODY, background: active ? category.color + '14' : 'var(--surface)', border: '1px solid ' + (active ? category.color + '3A' : 'var(--border)'), color: active ? category.color : 'var(--text-2)', minHeight: '34px' }}>
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', color: AMBER, fontFamily: F_BODY, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={14} /> {error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div key={selectedDomain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div style={{ padding: '18px 20px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <div style={{ fontFamily: F_MONO, fontSize: '9px', color: categoryInfo.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {'Domain overview - ' + categoryInfo.label}
                  </div>
                  {(() => {
                    const flag = REMOTE_FLAG_CONFIG[categoryInfo.remoteFlag]
                    const FlagIcon = flag.Icon
                    return (
                      <div title={flag.tip} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '9999px', background: flag.color + '12', border: '1px solid ' + flag.color + '28' }}>
                        <FlagIcon size={9} color={flag.color} />
                        <span style={{ fontFamily: F_MONO, fontSize: '9px', color: flag.color, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{flag.label}</span>
                      </div>
                    )
                  })()}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-2)', fontFamily: F_BODY, lineHeight: '1.7', marginBottom: '10px' }}>{domainMeta.insight}</div>
                <div style={{ fontFamily: F_MONO, fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.02em' }}>{'Key certs: ' + categoryInfo.certs.join(' / ')}</div>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
                {[['YoY growth', domainMeta.yoy, categoryInfo.color], ['Avg hike', domainMeta.avgHike, EMERALD]].map(([label, value, color]) => (
                  <div key={label} style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: F_MONO, fontSize: '1.4rem', color, fontWeight: '700', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Top hirers in India</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {domainMeta.topHirers.map(hirer => (
                  <span key={hirer} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '5px', background: categoryInfo.color + '0e', border: '1px solid ' + categoryInfo.color + '20', color: categoryInfo.color, fontFamily: F_MONO, letterSpacing: '0.02em' }}>{hirer}</span>
                ))}
              </div>
            </div>
          </div>

          {cityInfo && cityDemand ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} style={{ marginBottom: '16px', padding: '16px 18px', borderRadius: '8px', background: LEVEL_CONFIG[cityDemand].bg, border: '1px solid ' + LEVEL_CONFIG[cityDemand].color + '33' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <MapPin size={12} color={LEVEL_CONFIG[cityDemand].color} />
                <span style={{ fontFamily: F_MONO, fontSize: '10px', color: LEVEL_CONFIG[cityDemand].color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{firstName ? firstName + "'s city - " + cityInfo.label : 'Your city - ' + cityInfo.label}</span>
                <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '6px', background: LEVEL_CONFIG[cityDemand].color + '18', border: '1px solid ' + LEVEL_CONFIG[cityDemand].color + '30' }}>
                  <span style={{ fontFamily: F_MONO, fontSize: '10px', color: LEVEL_CONFIG[cityDemand].color, fontWeight: '700' }}>{LEVEL_CONFIG[cityDemand].label + ' demand'}</span>
                </div>
              </div>
              <DemandBar level={cityDemand} />
              {certName ? (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.65' }}>
                  <strong style={{ color: LEVEL_CONFIG[cityDemand].color }}>{certName}</strong>
                  {' in ' + cityInfo.label + ': '}
                  <strong style={{ color: LEVEL_CONFIG[cityDemand].color }}>{LEVEL_CONFIG[cityDemand].label.toLowerCase() + ' demand'}</strong>
                  {cityDemand >= 4 ? ' - strong negotiating position for your salary hike.' : cityDemand === 3 ? ' - moderate leverage. Pair with 2 portfolio projects to stand out.' : ' - consider targeting remote roles or Bangalore/Hyderabad opportunities.'}
                </div>
              ) : null}
            </motion.div>
          ) : null}

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{selectedCity ? 'Filtered by city' : 'Select your city'}</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {CITIES.map(city => (
                <button key={city.id} type="button" onClick={() => setSelectedCity(selectedCity === city.id ? '' : city.id)} style={{ padding: '5px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: F_MONO, letterSpacing: '0.04em', background: selectedCity === city.id ? 'rgba(81,177,231,0.12)' : 'var(--surface)', border: '1px solid ' + (selectedCity === city.id ? 'rgba(81,177,231,0.35)' : 'var(--border)'), color: selectedCity === city.id ? PICTON : 'var(--text-3)', minHeight: '32px' }}>
                  {city.short}
                </button>
              ))}
              {selectedCity ? (
                <button type="button" onClick={() => setSelectedCity('')} style={{ padding: '5px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: F_MONO, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-4)', minHeight: '32px' }}>Clear</button>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '9px', marginBottom: '18px' }}>
            {(selectedCity ? CITIES.filter(city => city.id === selectedCity) : sortedCities).map(city => (
              <div key={city.id} onClick={() => setSelectedCity(selectedCity === city.id ? '' : city.id)} style={{ cursor: 'pointer' }}>
                <CityDemandCard city={city} demand={domainDemand} loading={loading} />
              </div>
            ))}
          </div>

          {selectedCity ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {'All domains in ' + (cityInfo?.label || '') + ' - ranked'}
                {rankLoading ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[...CERT_CATEGORIES].sort((a, b) => getLevel(cityDomainDemand, b.id) - getLevel(cityDomainDemand, a.id)).map((category, index) => {
                  const level = cityDomainDemand[category.id]?.level || (category.id === selectedDomain ? cityDemand : 3)
                  const cfg = LEVEL_CONFIG[level]
                  const active = selectedDomain === category.id
                  const rankLabel = '#' + (index + 1)
                  return (
                    <motion.div key={category.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.035, duration: 0.2 }} onClick={() => setSelectedDomain(category.id)} style={{ padding: '11px 14px', borderRadius: '8px', background: active ? category.color + '0c' : 'var(--surface)', border: '1px solid ' + (active ? category.color + '28' : 'var(--border)'), cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: F_MONO, fontSize: '10px', color: index < 3 ? category.color : 'var(--text-4)', minWidth: '24px', fontWeight: index < 3 ? '700' : '400' }}>{rankLabel}</span>
                        <span style={{ fontFamily: F_HEAD, fontSize: '13px', fontWeight: '700', color: active ? category.color : 'var(--text)', flex: 1, letterSpacing: '-0.01em' }}>{category.label}</span>
                        <span style={{ fontFamily: F_MONO, fontSize: '10px', color: cfg.color, padding: '2px 7px', borderRadius: '4px', background: cfg.color + '12', letterSpacing: '0.04em' }}>{cfg.label}</span>
                      </div>
                      <DemandBar level={level} />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ) : null}

          <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', marginTop: '18px' }}>
            <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Demand scale</div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {Object.entries(LEVEL_CONFIG).reverse().map(([level, cfg]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                  <span style={{ fontFamily: F_MONO, fontSize: '10px', color: 'var(--text-4)' }}>{cfg.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: F_BODY, lineHeight: '1.5' }}>
              Source: {source === 'rapidapi-jsearch' ? 'RapidAPI JSearch live job counts' : source === 'fallback-estimate' ? 'Server fallback estimates until RAPIDAPI_KEY is configured' : 'Demand API'}.
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
