import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Wifi, Building2, Globe } from 'lucide-react'
import { supabase } from '../services/supabase.js'

// ── Design tokens — read from CSS custom properties ───────
var F_HEAD = "var(--font-head)"
var F_BODY = "var(--font-body)"
var F_MONO = "var(--font-mono)"

const PICTON  = '#51B1E7'
const EMERALD = '#10B981'
const AMBER   = '#F59E0B'
const SPRING  = { type: 'spring', stiffness: 400, damping: 30 }

const CITIES = [
  { id: 'bangalore', label: 'Bangalore',  short: 'BLR' },
  { id: 'hyderabad', label: 'Hyderabad',  short: 'HYD' },
  { id: 'pune',      label: 'Pune',       short: 'PNQ' },
  { id: 'mumbai',    label: 'Mumbai',     short: 'BOM' },
  { id: 'delhi',     label: 'Delhi NCR',  short: 'DEL' },
  { id: 'chennai',   label: 'Chennai',    short: 'MAA' },
  { id: 'kolkata',   label: 'Kolkata',    short: 'CCU' },
  { id: 'ahmedabad', label: 'Ahmedabad',  short: 'AMD' },
]

const CERT_CATEGORIES = [
  { id: 'tech',       label: 'Tech & Cloud',   color: PICTON,    remoteFlag: 'remote',         certs: ['AWS SAA', 'Azure', 'GCP', 'CKA', 'CompTIA Sec+', 'CEH'] },
  { id: 'data',       label: 'Data & AI',      color: '#818CF8', remoteFlag: 'remote',         certs: ['Google Data Analytics', 'IBM Data Science', 'TensorFlow', 'Tableau'] },
  { id: 'management', label: 'Project Mgmt',   color: EMERALD,   remoteFlag: 'hybrid',         certs: ['PMP', 'Scrum Master', 'PRINCE2'] },
  { id: 'business',   label: 'Business & Ops', color: AMBER,     remoteFlag: 'city-dependent', certs: ['Six Sigma', 'APICS CSCP', 'Google PM'] },
  { id: 'finance',    label: 'Finance',        color: '#34D399', remoteFlag: 'city-dependent', certs: ['CFA Level 1', 'FMVA', 'CPA'] },
  { id: 'marketing',  label: 'Marketing',      color: '#F472B6', remoteFlag: 'hybrid',         certs: ['Google Digital Marketing', 'HubSpot', 'Meta Blueprint'] },
  { id: 'product',    label: 'Product & UX',   color: '#A78BFA', remoteFlag: 'remote',         certs: ['Google UX', 'Product Mgmt Cert', 'CSPO'] },
  { id: 'hr',         label: 'HR & People',    color: '#FB923C', remoteFlag: 'city-dependent', certs: ['SHRM-CP', 'HRCI PHR', 'LinkedIn HR'] },
]

// Remote flag config
const REMOTE_FLAG_CONFIG = {
  'remote':         { label: 'Remote-friendly',    color: EMERALD,   Icon: Wifi,      tip: 'Strong demand for remote roles' },
  'hybrid':         { label: 'Hybrid',              color: PICTON,    Icon: Globe,     tip: 'Mix of remote and on-site demand' },
  'city-dependent': { label: 'City-dependent',      color: AMBER,     Icon: Building2, tip: 'Most roles require metro presence' },
}

const DEMAND = {
  tech:       { bangalore: 5, hyderabad: 5, pune: 5, mumbai: 4, delhi: 4, chennai: 4, kolkata: 3, ahmedabad: 3, insight: 'AWS/Cloud certs drive 35% higher salaries. 2,400+ open roles on Naukri.', yoy: '+34%', avgHike: '35%', topHirers: ['Infosys', 'TCS', 'Wipro', 'Amazon India'] },
  data:       { bangalore: 5, hyderabad: 5, pune: 4, mumbai: 5, delhi: 4, chennai: 4, kolkata: 3, ahmedabad: 3, insight: 'Data Science roles growing fastest in Bangalore and Mumbai. ML engineers command ₹20L+.', yoy: '+42%', avgHike: '38%', topHirers: ['Flipkart', 'Swiggy', 'Zomato', 'Microsoft'] },
  management: { bangalore: 4, hyderabad: 4, pune: 4, mumbai: 5, delhi: 5, chennai: 3, kolkata: 3, ahmedabad: 4, insight: 'PMP certified PMs earn 30% more. Delhi NCR and Mumbai have highest PM demand.', yoy: '+18%', avgHike: '30%', topHirers: ['Accenture', 'Deloitte', 'KPMG', 'IBM'] },
  business:   { bangalore: 3, hyderabad: 3, pune: 4, mumbai: 4, delhi: 4, chennai: 3, kolkata: 3, ahmedabad: 5, insight: 'Six Sigma and supply chain certs in high demand in manufacturing hubs like Pune and Ahmedabad.', yoy: '+15%', avgHike: '25%', topHirers: ['Mahindra', 'Tata Motors', 'L&T', 'Asian Paints'] },
  finance:    { bangalore: 3, hyderabad: 3, pune: 3, mumbai: 5, delhi: 4, chennai: 3, kolkata: 4, ahmedabad: 4, insight: "CFA Level 1 opens doors in Mumbai's financial district. 1,200+ openings this quarter.", yoy: '+22%', avgHike: '35%', topHirers: ['HDFC', 'ICICI', 'Goldman Sachs', 'JP Morgan'] },
  marketing:  { bangalore: 4, hyderabad: 3, pune: 4, mumbai: 5, delhi: 5, chennai: 3, kolkata: 3, ahmedabad: 3, insight: 'Digital Marketing certs most valued in Delhi NCR and Mumbai. D2C boom driving demand.', yoy: '+28%', avgHike: '22%', topHirers: ['Nykaa', 'Meesho', 'Dentsu', 'WPP India'] },
  product:    { bangalore: 5, hyderabad: 4, pune: 4, mumbai: 4, delhi: 3, chennai: 3, kolkata: 2, ahmedabad: 2, insight: 'Product Management certs most valued in Bangalore startup ecosystem. ₹25–40L roles.', yoy: '+35%', avgHike: '35%', topHirers: ['PhonePe', 'Razorpay', 'CRED', 'Freshworks'] },
  hr:         { bangalore: 3, hyderabad: 3, pune: 3, mumbai: 4, delhi: 4, chennai: 3, kolkata: 3, ahmedabad: 3, insight: 'SHRM-CP adds 25% to HR salaries. Demand highest in large corporates in Mumbai and Delhi.', yoy: '+12%', avgHike: '25%', topHirers: ['HCL', 'Tech Mahindra', 'Infosys HR', 'Capgemini'] },
}

const LEVEL_CONFIG = {
  5: { label: 'Very High', color: EMERALD,   bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.22)', bar: '100%' },
  4: { label: 'High',      color: PICTON,    bg: 'rgba(81,177,231,0.08)',  border: 'rgba(81,177,231,0.22)', bar: '80%'  },
  3: { label: 'Medium',    color: AMBER,     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)', bar: '60%'  },
  2: { label: 'Low',       color: '#64748B', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.18)', bar: '35%' },
  1: { label: 'Very Low',  color: '#94A3B8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.12)', bar: '15%' },
}

const CITY_ALIASES   = { 'bengaluru': 'bangalore', 'blr': 'bangalore', 'ncr': 'delhi', 'gurgaon': 'delhi', 'gurugram': 'delhi', 'noida': 'delhi', 'faridabad': 'delhi', 'bom': 'mumbai', 'hyd': 'hyderabad', 'pnq': 'pune', 'ccu': 'kolkata', 'maa': 'chennai', 'amd': 'ahmedabad' }
const DOMAIN_ALIASES = { 'cloud': 'tech', 'devops': 'tech', 'security': 'tech', 'backend': 'tech', 'frontend': 'tech', 'ml': 'data', 'ai': 'data', 'analytics': 'data', 'pm': 'management', 'project': 'management', 'scrum': 'management', 'agile': 'management', 'supply chain': 'business', 'operations': 'business', 'ops': 'business', 'banking': 'finance', 'investment': 'finance', 'fintech': 'finance', 'digital marketing': 'marketing', 'seo': 'marketing', 'ux': 'product', 'design': 'product', 'people': 'hr', 'talent': 'hr', 'recruitment': 'hr' }

// ── Demand bar ────────────────────────────────────────────
const DemandBar = ({ level }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG[3]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: cfg.bar }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: '100%', borderRadius: '2px', background: cfg.color }}
        />
      </div>
      <span style={{ fontFamily: F_MONO, fontSize: '10px', color: cfg.color, minWidth: '54px', textAlign: 'right', letterSpacing: '0.04em' }}>
        {cfg.label}
      </span>
    </div>
  )
}

// ── City card ─────────────────────────────────────────────
const CityDemandCard = ({ city, domainData }) => {
  const level = domainData[city.id] || 3
  const cfg   = LEVEL_CONFIG[level]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      style={{ padding: '14px 16px', borderRadius: '10px', background: cfg.bg, border: '1px solid ' + cfg.border }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '13px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {city.label}
          </div>
          <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', letterSpacing: '0.08em', marginTop: '2px' }}>
            {city.short}
          </div>
        </div>
        <div style={{ padding: '2px 8px', borderRadius: '5px', background: cfg.color + '16', border: '1px solid ' + cfg.color + '28' }}>
          <span style={{ fontFamily: F_MONO, fontSize: '10px', color: cfg.color, fontWeight: '700', letterSpacing: '0.04em' }}>
            {level}/5
          </span>
        </div>
      </div>
      <DemandBar level={level} />
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────
const Heatmap = ({ prefilledCity = '', prefilledDomain = '', certName = '', resumeName = '' }) => {
  // ── Database State ──────────────────────────────────────
  const [certificationsData, setCertificationsData] = useState([]);
  const [domainsData, setDomainsData] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  // ── The "Once and For All" Alias Fix ────────────────────
  const CERTIFICATIONS = certificationsData;
  const certifications = certificationsData;
  const CERT_DOMAINS = domainsData;
  const certDomains = domainsData;

  // ── Fetch from Supabase on mount ────────────────────────
  useEffect(() => {
    async function fetchDatabase() {
      try {
        const [certsResponse, domainsResponse] = await Promise.all([
          supabase.from('certifications').select('*'),
          supabase.from('domains').select('*')
        ]);

        if (certsResponse.data) setCertificationsData(certsResponse.data);
        if (domainsResponse.data) setDomainsData(domainsResponse.data);
      } catch (error) {
        console.error("Failed to fetch Supabase data:", error);
      } finally {
        setDbLoading(false);
      }
    }
    fetchDatabase();
  }, []);

  // ── Loading Fallback ────────────────────────────────────
  if (dbLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--text-3)' }}>Connecting to live database...</div>;
  }

  const [selectedDomain, setSelectedDomain] = useState('tech')
  const [selectedCity,   setSelectedCity]   = useState('')
  const [autoDetected,   setAutoDetected]   = useState(false)

  const firstName = resumeName ? resumeName.split(' ')[0] : ''

  useEffect(() => {
    if (prefilledCity) {
      const lower   = prefilledCity.toLowerCase()
      const cityKey = CITY_ALIASES[lower] || CITIES.find(c => c.label.toLowerCase().includes(lower))?.id || ''
      if (cityKey) { setSelectedCity(cityKey); setAutoDetected(true) }
    }
    if (prefilledDomain) {
      const lower  = prefilledDomain.toLowerCase()
      const domKey = DOMAIN_ALIASES[lower] || lower
      if (CERT_CATEGORIES.find(c => c.id === domKey)) { setSelectedDomain(domKey); setAutoDetected(true) }
    }
  }, [prefilledCity, prefilledDomain])

  const domainData   = DEMAND[selectedDomain]      || DEMAND.tech
  const categoryInfo = CERT_CATEGORIES.find(c => c.id === selectedDomain) || CERT_CATEGORIES[0]
  const cityDemand   = selectedCity ? (domainData[selectedCity] || 3) : null
  const cityInfo     = CITIES.find(c => c.id === selectedCity)
  const sortedCities = [...CITIES].sort((a, b) => (domainData[b.id] || 0) - (domainData[a.id] || 0))

  const headingText  = firstName ? (firstName.toUpperCase() + "'S CERT DEMAND BY") : 'CERT DEMAND BY'
  const subtitleText = firstName
    ? (firstName + ', here is the demand map for your field across India.')
    : 'Pick a domain and see where demand is highest across India.'

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '6px', background: 'rgba(81,177,231,0.08)', border: '1px solid rgba(81,177,231,0.2)', fontSize: '10px', color: PICTON, marginBottom: '12px', letterSpacing: '0.1em', fontFamily: F_MONO, textTransform: 'uppercase' }}>
          <MapPin size={10} /> India demand intelligence · 2026
        </div>
        <h2 style={{ fontFamily: F_HEAD, fontWeight: '800', fontSize: 'clamp(1.5rem,3.2vw,2rem)', color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.03em' }}>
          {headingText} <span style={{ color: PICTON }}>CITY</span>
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.6' }}>
          {subtitleText}
        </p>

        {autoDetected && (prefilledCity || prefilledDomain) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
            style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: EMERALD, flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY }}>
              Auto-detected from your resume:
              {prefilledCity   && <strong style={{ color: PICTON,  marginLeft: '6px' }}>{prefilledCity}</strong>}
              {prefilledDomain && <strong style={{ color: EMERALD, marginLeft: '6px' }}>{CERT_CATEGORIES.find(c => c.id === selectedDomain)?.label || prefilledDomain}</strong>}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Domain selector ────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
          Select your domain
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CERT_CATEGORIES.map(cat => {
            const active = selectedDomain === cat.id
            return (
              <button key={cat.id} onClick={() => setSelectedDomain(cat.id)}
                style={{ padding: '6px 13px', borderRadius: '7px', fontSize: '12px', fontWeight: active ? '700' : '500', cursor: 'pointer', fontFamily: F_BODY, background: active ? cat.color + '14' : 'var(--surface)', border: '1px solid ' + (active ? cat.color + '3A' : 'var(--border)'), color: active ? cat.color : 'var(--text-2)', transition: 'all 0.15s', minHeight: '34px' }}>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Domain insight card ─────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedDomain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {/* Domain insight — plain bordered panel, no NeonCard */}
          <div style={{ padding: '18px 20px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <div style={{ fontFamily: F_MONO, fontSize: '9px', color: categoryInfo.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {'Domain overview — ' + categoryInfo.label}
                  </div>
                  {/* Feature 4: Remote-friendly badge */}
                  {(() => {
                    const flag = REMOTE_FLAG_CONFIG[categoryInfo.remoteFlag]
                    if (!flag) return null
                    const FlagIcon = flag.Icon
                    return (
                      <motion.div
                        key={categoryInfo.id + '-flag'}
                        initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
                        title={flag.tip}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '9999px', background: flag.color + '12', border: '1px solid ' + flag.color + '28', cursor: 'default' }}
                      >
                        <FlagIcon size={9} color={flag.color} />
                        <span style={{ fontFamily: F_MONO, fontSize: '9px', color: flag.color, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{flag.label}</span>
                      </motion.div>
                    )
                  })()}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-2)', fontFamily: F_BODY, lineHeight: '1.7', marginBottom: '10px' }}>
                  {domainData.insight}
                </div>
                <div style={{ fontFamily: F_MONO, fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.02em' }}>
                  {'Key certs: ' + categoryInfo.certs.join(' · ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: F_MONO, fontSize: '1.4rem', color: categoryInfo.color, letterSpacing: '-0.03em', fontWeight: '700', lineHeight: 1 }}>
                    {domainData.yoy}
                  </div>
                  <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
                    YoY growth
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: F_MONO, fontSize: '1.4rem', color: EMERALD, letterSpacing: '-0.03em', fontWeight: '700', lineHeight: 1 }}>
                    {domainData.avgHike}
                  </div>
                  <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
                    Avg hike
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
                Top hirers in India
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {domainData.topHirers.map((h, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '5px', background: categoryInfo.color + '0e', border: '1px solid ' + categoryInfo.color + '20', color: categoryInfo.color, fontFamily: F_MONO, letterSpacing: '0.02em' }}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Your city highlight ─────────────────────── */}
          {cityInfo && cityDemand && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING}
              style={{ marginBottom: '16px', padding: '16px 18px', borderRadius: '10px', background: LEVEL_CONFIG[cityDemand].bg, border: '1px solid ' + LEVEL_CONFIG[cityDemand].color + '33' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <MapPin size={12} color={LEVEL_CONFIG[cityDemand].color} />
                <span style={{ fontFamily: F_MONO, fontSize: '10px', color: LEVEL_CONFIG[cityDemand].color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {firstName ? (firstName + "'s city — " + cityInfo.label) : ('Your city — ' + cityInfo.label)}
                </span>
                <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '6px', background: LEVEL_CONFIG[cityDemand].color + '18', border: '1px solid ' + LEVEL_CONFIG[cityDemand].color + '30' }}>
                  <span style={{ fontFamily: F_MONO, fontSize: '10px', color: LEVEL_CONFIG[cityDemand].color, fontWeight: '700' }}>
                    {LEVEL_CONFIG[cityDemand].label + ' demand'}
                  </span>
                </div>
              </div>
              <DemandBar level={cityDemand} />
              {certName && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.65' }}>
                  <strong style={{ color: LEVEL_CONFIG[cityDemand].color }}>{certName}</strong>
                  {' in ' + cityInfo.label + ': '}
                  <strong style={{ color: LEVEL_CONFIG[cityDemand].color }}>{LEVEL_CONFIG[cityDemand].label.toLowerCase() + ' demand'}</strong>
                  {cityDemand >= 4 ? ' — strong negotiating position for your salary hike.' : cityDemand === 3 ? ' — moderate leverage. Pair with 2 portfolio projects to stand out.' : ' — consider targeting remote roles or Bangalore/Hyderabad opportunities.'}
                </div>
              )}
            </motion.div>
          )}

          {/* ── City filter pills ───────────────────────── */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
              {selectedCity ? 'Filtered by city' : 'Select your city'}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {CITIES.map(city => (
                <button key={city.id} onClick={() => setSelectedCity(selectedCity === city.id ? '' : city.id)}
                  style={{ padding: '5px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: F_MONO, letterSpacing: '0.04em', background: selectedCity === city.id ? 'rgba(81,177,231,0.12)' : 'var(--surface)', border: '1px solid ' + (selectedCity === city.id ? 'rgba(81,177,231,0.35)' : 'var(--border)'), color: selectedCity === city.id ? PICTON : 'var(--text-3)', transition: 'all 0.15s', minHeight: '32px' }}>
                  {city.short}
                </button>
              ))}
              {selectedCity && (
                <button onClick={() => setSelectedCity('')}
                  style={{ padding: '5px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: F_MONO, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-4)', transition: 'all 0.15s', minHeight: '32px' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ── City grid ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '9px', marginBottom: '18px' }}>
            {(selectedCity ? CITIES.filter(c => c.id === selectedCity) : sortedCities).map(city => (
              <div key={city.id} onClick={() => setSelectedCity(selectedCity === city.id ? '' : city.id)} style={{ cursor: 'pointer' }}>
                <CityDemandCard city={city} domainData={domainData} />
              </div>
            ))}
          </div>

          {/* ── All domains ranked for selected city ─────── */}
          {selectedCity && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
                {'All domains in ' + (cityInfo?.label || '') + ' — ranked'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[...CERT_CATEGORIES].sort((a, b) => (DEMAND[b.id]?.[selectedCity] || 0) - (DEMAND[a.id]?.[selectedCity] || 0)).map((cat, i) => {
                  const level  = DEMAND[cat.id]?.[selectedCity] || 3
                  const cfg    = LEVEL_CONFIG[level]
                  const active = selectedDomain === cat.id
                  const rankLabel = i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : ('#' + (i + 1))
                  return (
                    <motion.div key={cat.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035, duration: 0.2 }}
                      onClick={() => setSelectedDomain(cat.id)}
                      style={{ padding: '11px 14px', borderRadius: '9px', background: active ? cat.color + '0c' : 'var(--surface)', border: '1px solid ' + (active ? cat.color + '28' : 'var(--border)'), cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontFamily: F_MONO, fontSize: '10px', color: i < 3 ? cat.color : 'var(--text-4)', minWidth: '24px', fontWeight: i < 3 ? '700' : '400' }}>
                          {rankLabel}
                        </span>
                        <span style={{ fontFamily: F_HEAD, fontSize: '13px', fontWeight: '700', color: active ? cat.color : 'var(--text)', flex: 1, letterSpacing: '-0.01em' }}>
                          {cat.label}
                        </span>
                        <span style={{ fontFamily: F_MONO, fontSize: '10px', color: cfg.color, padding: '2px 7px', borderRadius: '4px', background: cfg.color + '12', letterSpacing: '0.04em' }}>
                          {cfg.label}
                        </span>
                      </div>
                      <DemandBar level={level} />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Legend + data source ─────────────────────── */}
          <div style={{ padding: '14px 16px', borderRadius: '9px', background: 'var(--surface)', border: '1px solid var(--border)', marginTop: '18px' }}>
            <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
              Demand scale
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {Object.entries(LEVEL_CONFIG).reverse().map(([level, cfg]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }} />
                  <span style={{ fontFamily: F_MONO, fontSize: '10px', color: 'var(--text-4)' }}>{cfg.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: F_BODY, lineHeight: '1.5' }}>
              Data: LinkedIn Economic Graph India · Naukri Job Index · NASSCOM Report 2026 · AmbitionBox · Q1 2026
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Heatmap