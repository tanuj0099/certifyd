import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Building2, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Info, ExternalLink,
  Shield, Search
} from 'lucide-react'
import { GOVT_DATA, PRIVATE_DATA, MANDATORY_FINANCIAL_CERTS } from '../data/jobCertData.js'

const F_HEAD = "var(--font-head)";
const F_MONO = "var(--font-mono)";
const F_BODY = "var(--font-body)";
const T      = { duration: 0.25, ease: [0.4,0,0.2,1] }

//  Search bar 
const SearchBar = ({ value, onChange }) => (
  <div style={{ position: 'relative', marginBottom: '24px' }}>
    <Search size={14} color="var(--text-4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search by company, role, or certification..."
      style={{ width: '100%', padding: '11px 14px 11px 36px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '14px', fontFamily: F_BODY, outline: 'none', transition: 'border-color 0.18s', boxSizing: 'border-box' }}
      onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
      onBlur={e  => e.target.style.borderColor = 'var(--border)'}
    />
  </div>
)

//  Verified badge 
const DataBadge = ({ verified, source }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '5px', background: verified ? 'transparent' : 'transparent', border: `1px solid ${verified ? 'transparent' : 'transparent'}`, fontSize: '10px', color: verified ? 'var(--linear-blue)' : 'var(--cool-grey)', fontFamily: F_MONO }}>
    {verified ? <CheckCircle size={9} /> : <AlertCircle size={9} />}
    {verified ? 'Official Source' : 'Employee Reported'}
  </div>
)

//  Govt org card 
const GovtCard = ({ org }) => {
  const [open, setOpen] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={T} /* Removed glass-border */
      style={{ borderRadius: '14px', background: 'transparent', border: '1px solid var(--glass-border)', overflow: 'hidden', marginBottom: '12px' }}>

      {/* Header */}
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${org.color}15`, border: `1px solid ${org.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          <Building2 size={18} color={org.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F_HEAD, fontWeight: '800', fontSize: '15px', color: 'var(--text)', marginBottom: '2px' }}>{org.org}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: F_BODY }}>{org.sector} - {org.roles.length} roles</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <DataBadge verified={true} source={org.roles[0]?.source} />
          <ChevronDown size={16} color="var(--text-4)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {/* Description */}
      <div style={{ padding: '0 18px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY }}>{org.description}</div>
      </div>

      {/* Roles */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={T} style={{ overflow: 'hidden' }}>
            {org.roles.map((role, i) => (
              <div key={i} style={{ padding: '14px 18px', borderBottom: i < org.roles.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'transparent' }}>

                {/* Role header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '14px', color: 'var(--text)', marginBottom: '3px' }}>{role.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronRight size={11} color="var(--text-4)" />
                      <span style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: F_BODY }}>{role.transition}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {role.mandatory ? (
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'transparent', border: '1px solid transparent', color: 'var(--cool-grey)', fontFamily: F_MONO }}>MANDATORY</span>
                    ) : (
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'transparent', border: '1px solid transparent', color: 'var(--cool-grey)', fontFamily: F_MONO }}>PREFERRED</span>
                    )}
                  </div>
                </div>

                {/* Cert pill */}
                {role.certId ? (
                  <Link href={`/exams/${role.certId}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '9px', background: `${org.color}08`, border: `1px solid ${org.color}22`, marginBottom: '10px', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    <Shield size={13} color={org.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '13px', color: org.color }}>{role.cert}</span>
                    <ExternalLink size={12} color={org.color} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '9px', background: `${org.color}08`, border: `1px solid ${org.color}22`, marginBottom: '10px' }}>
                    <Shield size={13} color={org.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '13px', color: org.color }}>{role.cert}</span>
                  </div>
                )}

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  {role.salaryRange && (
                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Salary Range</div>
                      <div style={{ fontSize: '12px', color: 'var(--linear-blue)', fontFamily: F_MONO, fontWeight: '700' }}>{role.salaryRange}</div>
                    </div>
                  )}
                  {role.openings && (
                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-4)', fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Openings</div>
                      <div style={{ fontSize: '12px', color: 'var(--linear-blue)', fontFamily: F_MONO, fontWeight: '700' }}>{role.openings}</div>
                    </div>
                  )}
                </div>

                {/* Note */}
                {role.note && (
                  <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                    <Info size={11} color="var(--text-4)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.6' }}>{role.note}</span>
                  </div>
                )}

                {/* Source */}
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO }}>
                  Source: {role.source}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

//  Private company card 
const PrivateCard = ({ company }) => {
  const [open, setOpen] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={T} /* Removed glass-border */
      style={{ borderRadius: '14px', background: 'transparent', border: '1px solid var(--glass-border)', overflow: 'hidden', marginBottom: '12px' }}>

      {/* Header */}
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
        <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${company.color}15`, border: `1px solid ${company.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          <Building2 size={18} color={company.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F_HEAD, fontWeight: '800', fontSize: '15px', color: 'var(--text)', marginBottom: '2px' }}>{company.company}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: F_BODY }}>{company.sector} - {company.size}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <DataBadge verified={false} source={company.source} />
          <ChevronDown size={16} color="var(--text-4)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {/* Disclaimer */}
      <div style={{ margin: '0 18px 14px', padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
        <AlertCircle size={11} color="var(--cool-grey)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '11px', color: 'var(--cool-grey)', fontFamily: F_BODY, lineHeight: '1.5' }}>
          {company.disclaimer} Source: {company.source}
        </span>
      </div>

      {/* Tracks */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={T} style={{ overflow: 'hidden' }}>
            {company.tracks.map((track, i) => (
              <div key={i} style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'transparent' }}>

                {/* Transition arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontFamily: F_HEAD, fontWeight: '700', color: 'var(--text)', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)' }}>{track.from}</span>
                  <span style={{ fontSize: '14px', color: company.color }}>-&gt;</span>
                  <span style={{ fontSize: '12px', fontFamily: F_HEAD, fontWeight: '700', color: company.color, padding: '4px 10px', borderRadius: '6px', background: `${company.color}10`, border: `1px solid ${company.color}25` }}>{track.to}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {track.typicalTime && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-4)', fontFamily: F_MONO }}> {track.typicalTime}</span>
                    )}
                    {track.salaryJump && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'transparent', border: '1px solid transparent', color: 'var(--linear-blue)', fontFamily: F_MONO }}>+{track.salaryJump} hike</span>
                    )}
                  </div>
                </div>

                {/* Cert pills */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
                    {track.mandatory ? 'REQUIRED CERTS' : 'VALUED CERTS'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {track.certs.map((cert, j) => (
                      <span key={j} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '7px', background: `${company.color}0c`, border: `1px solid ${company.color}28`, color: company.color, fontFamily: F_BODY, fontWeight: '600' }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Note */}
                {track.note && (
                  <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                    <Info size={11} color="var(--text-4)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.6' }}>{track.note}</span>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

//  Mandatory financial cert card 
const MandatoryCertCard = ({ cert }) => (
  <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'transparent', border: '1px solid transparent', marginBottom: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
      <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '14px', color: 'var(--text)', flex: 1 }}>{cert.cert}</div>
      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'transparent', border: '1px solid transparent', color: 'var(--cool-grey)', fontFamily: F_MONO, flexShrink: 0 }}>SEBI/IRDAI MANDATED</span>
    </div>
    <div style={{ fontSize: '11px', color: 'var(--cool-grey)', fontFamily: F_MONO, marginBottom: '5px' }}>Authority: {cert.authority}</div>
    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY, marginBottom: '5px' }}>Who needs it: {cert.who}</div>
    <div style={{ fontSize: '11px', color: 'var(--cool-grey)', fontFamily: F_BODY, display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
      <AlertCircle size={11} style={{ flexShrink: 0, marginTop: '2px' }} />
      {cert.penalty}
    </div>
    <a href={cert.link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '11px', color: 'var(--indigo-light)', fontFamily: F_MONO, textDecoration: 'none' }}>
      Official Body <ExternalLink size={10} />
    </a>
  </div>
)

// 
// MAIN COMPONENT
// 
const JobCertMap = () => {
  const [tab,    setTab]    = useState('govt')
  const [search, setSearch] = useState('')

  const query = search.toLowerCase()

  const filteredGovt = GOVT_DATA.filter(org =>
    !query ||
    org.org.toLowerCase().includes(query) ||
    org.sector.toLowerCase().includes(query) ||
    org.roles.some(r =>
      r.role.toLowerCase().includes(query) ||
      r.cert.toLowerCase().includes(query) ||
      r.transition.toLowerCase().includes(query)
    )
  )

  const filteredPrivate = PRIVATE_DATA.filter(co =>
    !query ||
    co.company.toLowerCase().includes(query) ||
    co.sector.toLowerCase().includes(query) ||
    co.tracks.some(t =>
      t.from.toLowerCase().includes(query) ||
      t.to.toLowerCase().includes(query) ||
      t.certs.some(c => c.toLowerCase().includes(query))
    )
  )

  return (
    <div>
      {/* Page header */}
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', padding: '4px', background: 'transparent', borderRadius: '12px', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[
          { id: 'govt', label: 'Government & PSU', count: GOVT_DATA.length },
          { id: 'private', label: 'Private Companies', count: PRIVATE_DATA.length },
          { id: 'mandatory', label: 'SEBI / IRDAI Mandated', count: MANDATORY_FINANCIAL_CERTS.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: F_HEAD, fontWeight: tab === t.id ? '700' : '500', fontSize: '13px', background: tab === t.id ? 'var(--text)' : 'transparent', color: tab === t.id ? 'var(--bg)' : 'var(--text-4)', transition: 'all 0.18s', whiteSpace: 'nowrap' }}>
            {t.label}
            <span style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.7, fontFamily: F_MONO }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Data source disclaimer */}
      <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: '10px', background: 'var(--indigo-dim)', border: '1px solid var(--border-accent)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Info size={13} color="var(--indigo-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: F_BODY, lineHeight: '1.6' }}>
          {tab === 'govt' && <><strong style={{ color: 'var(--indigo-light)' }}>Government data</strong> is from official UPSC/SSC/IBPS/RRB notifications and government circulars. Verified accurate as of March 2026.</>}
          {tab === 'private' && <><strong style={{ color: 'var(--cool-grey)' }}>Private company data</strong> is reported by employees on AmbitionBox, Glassdoor India, and LinkedIn. Not official company policy. Actual requirements vary by business unit and year.</>}
          {tab === 'mandatory' && <><strong style={{ color: 'var(--cool-grey)' }}>These certifications are legally mandated</strong> by SEBI or IRDAI. You cannot legally sell financial/insurance products in India without them.</>}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'govt' && (
          <motion.div key="govt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {filteredGovt.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-4)', fontFamily: F_BODY }}>
                No results for "{search}"
              </div>
            ) : (
              filteredGovt.map((org, i) => <GovtCard key={i} org={org} />)
            )}
          </motion.div>
        )}

        {tab === 'private' && (
          <motion.div key="private" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {filteredPrivate.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-4)', fontFamily: F_BODY }}>
                No results for "{search}"
              </div>
            ) : (
              filteredPrivate.map((co, i) => <PrivateCard key={i} company={co} />)
            )}
          </motion.div>
        )}

        {tab === 'mandatory' && (
          <motion.div key="mandatory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '12px', background: 'transparent', border: '1px solid transparent' }}>
              <div style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '14px', color: 'var(--cool-grey)', marginBottom: '5px' }}>Legal Requirement - Not Optional</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: F_BODY, lineHeight: '1.6' }}>
                If you work in financial services in India, selling mutual funds, insurance, or derivatives without these certifications is illegal. SEBI and IRDAI actively penalise violations.
              </div>
            </div>
            {MANDATORY_FINANCIAL_CERTS.map((cert, i) => (
              <MandatoryCertCard key={i} cert={cert} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default JobCertMap
