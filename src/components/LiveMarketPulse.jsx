/**
 * LiveMarketPulse — Domain Capsule Edition
 *
 * Changes vs previous version:
 *  1. Domain capsule row replaces the old table — horizontal pill buttons
 *     grouped by sector that filter the data from market_intelligence.
 *  2. Correct Supabase field mapping:
 *       domain_name, min_salary, max_salary, job_count_naukri
 *  3. ROI payback formula: months = cert_cost / (new_salary - current_salary)
 *     with ₹25,000 fallback when certification_cost is missing.
 *  4. All motion() → motion.create() (framer-motion v11+)
 *  5. WebkitBackdropFilter → WebkitBackdropFilter (React prop casing)
 *  6. Only Nordic and Ash themes — no legacy theme guards needed.
 *  7. No wrapping boxes — content renders on var(--bg) directly.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase.js'

// ─── Typography tokens ──────────────────────────────────────────────────────
const FM   = "'JetBrains Mono','IBM Plex Mono',monospace"
const FS   = "'Inter','DM Sans',sans-serif"

// ─── Domain taxonomy ────────────────────────────────────────────────────────
// Maps capsule label → array of domain_name substrings to match.
const CAPSULES = [
  {
    id:    'all',
    label: 'All Roles',
    match: null, // null = show everything
  },
  {
    id:    'cloud',
    label: 'Cloud & DevOps',
    match: ['Cloud', 'DevOps', 'SRE', 'GCP', 'Azure', 'AWS', 'Kubernetes'],
  },
  {
    id:    'data',
    label: 'Data & AI',
    match: [
      'Data', 'Machine Learning', 'AI', 'NLP', 'Computer Vision',
      'Big Data', 'Business Intelligence', 'Statistical',
    ],
  },
  {
    id:    'security',
    label: 'Security',
    match: [
      'Cybersecurity', 'Security', 'Hacker', 'Penetration',
      'SOC', 'Information Security',
    ],
  },
  {
    id:    'software',
    label: 'Engineering',
    match: [
      'Full Stack', 'Backend', 'Frontend', 'Mobile', 'iOS',
      'Android', 'Blockchain', 'Embedded', 'Game', 'QA',
      'Rust', 'Golang', 'Software Architect',
    ],
  },
  {
    id:    'product',
    label: 'Product & PM',
    match: [
      'Product Manager', 'Project Manager', 'Scrum', 'Agile',
      'Business Analyst', 'Operations', 'Program Manager',
      'Management', 'SAP', 'Strategy', 'Supply Chain',
    ],
  },
  {
    id:    'design',
    label: 'Design',
    match: [
      'UI', 'UX', 'Designer', 'Interaction', 'Motion',
      'Visual', 'Service Designer', 'User Research',
    ],
  },
  {
    id:    'finance',
    label: 'Finance',
    match: [
      'Financial', 'Investment', 'Risk', 'Actuarial',
      'Equity', 'Tax', 'Audit', 'Quant', 'Fintech',
    ],
  },
  {
    id:    'marketing',
    label: 'Marketing & Sales',
    match: [
      'Marketing', 'SEO', 'Growth', 'Social Media',
      'Content', 'Performance', 'Sales Development',
    ],
  },
]

// ─── ROI payback formula ─────────────────────────────────────────────────────
const DEFAULT_CERT_COST = 25_000 // ₹ — fallback per spec

/**
 * paybackMonths = cert_cost / ((new_salary - current_salary) / 12)
 * current_salary = min_salary from DB (the "before cert" baseline)
 * new_salary     = max_salary from DB (the "after cert" target)
 */
function calcPayback(row) {
  const cost       = Number(row.certification_cost) || DEFAULT_CERT_COST
  const salaryDiff = (row.max_salary || 0) - (row.min_salary || 0)
  if (salaryDiff <= 0) return null
  const monthlyGain = salaryDiff / 12
  return Math.ceil(cost / monthlyGain)
}

function fmtLPA(rupees) {
  if (!rupees || rupees <= 0) return '—'
  return `₹${(rupees / 100_000).toFixed(1)}L`
}

// ─── Capsule button ─────────────────────────────────────────────────────────
function Capsule({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        padding:       '6px 14px',
        height:        '32px',
        border:        active
          ? '1px solid var(--text)'
          : '1px solid var(--border)',
        borderRadius:  '9999px',
        background:    active ? 'var(--text)' : 'transparent',
        color:         active ? 'var(--bg)' : 'var(--text-3)',
        fontFamily:    FM,
        fontSize:      '11px',
        letterSpacing: '0.08em',
        cursor:        'pointer',
        transition:    'all 0.15s ease',
        whiteSpace:    'nowrap',
        fontWeight:    active ? '600' : '400',
      }}
    >
      {label}
    </button>
  )
}

// ─── Role row ───────────────────────────────────────────────────────────────
function RoleRow({ row, index, total }) {
  const payback = calcPayback(row)
  const isLast  = index === total - 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      style={{
        display:       'grid',
        gridTemplateColumns: '1fr 96px 96px 80px',
        alignItems:    'center',
        gap:           '8px',
        padding:       '14px 0',
        borderBottom:  isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Role name */}
      <span style={{
        fontFamily:    FS,
        fontSize:      '14px',
        color:         'var(--text)',
        letterSpacing: '-0.01em',
        overflow:      'hidden',
        textOverflow:  'ellipsis',
        whiteSpace:    'nowrap',
      }}>
        {row.domain_name}
      </span>

      {/* Salary range */}
      <span style={{
        fontFamily:        FM,
        fontSize:          '12px',
        color:             'var(--text-2)',
        letterSpacing:     '0.02em',
        fontVariantNumeric:'tabular-nums',
        textAlign:         'right',
      }}>
        {fmtLPA(row.min_salary)}
      </span>
      <span style={{
        fontFamily:        FM,
        fontSize:          '12px',
        color:             'var(--text)',
        letterSpacing:     '0.02em',
        fontVariantNumeric:'tabular-nums',
        textAlign:         'right',
      }}>
        {fmtLPA(row.max_salary)}
      </span>

      {/* Jobs */}
      <span style={{
        fontFamily:        FM,
        fontSize:          '11px',
        color:             row.job_count_naukri > 1000 ? 'var(--text)' : 'var(--text-3)',
        letterSpacing:     '0.04em',
        fontVariantNumeric:'tabular-nums',
        textAlign:         'right',
      }}>
        {row.job_count_naukri > 0
          ? row.job_count_naukri.toLocaleString('en-IN')
          : '—'}
      </span>
    </motion.div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function LiveMarketPulse() {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeId,   setActiveId]   = useState('all')
  const [lastSync,   setLastSync]   = useState(null)

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setError('Supabase not configured — check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Select only the columns we use — keeps payload small
        const { data, error: sbErr } = await supabase
          .from('market_intelligence')
          .select('domain_name, min_salary, max_salary, job_count_naukri, updated_at')
          .order('domain_name', { ascending: true })

        if (sbErr) throw sbErr

        // FIX 1: Normalise data to an array before any access.
        // Supabase v2 can return null (RLS with no matching rows, empty table,
        // or a 200 with an empty body). Treat null/undefined as [].
        const rows = Array.isArray(data) ? data : []

        // FIX 2: setLoading(false) immediately after data is confirmed safe —
        // before any secondary computation — so the UI unblocks as fast as
        // possible. The finally block below is now a safety net only.
        setRows(rows)
        setLoading(false)

        // Latest sync timestamp — safe because rows is guaranteed an array
        const latest = rows
          .map(r => r.updated_at)
          .filter(Boolean)
          .sort()
          .at(-1)
        if (latest) setLastSync(latest)

      } catch (err) {
        console.error('[MarketPulse] Supabase error:', err)
        setError(err?.message || 'Failed to load market data')
        // FIX 3: Ensure loading clears on error path too, without relying
        // solely on finally (guards against double-invocation edge cases).
        setLoading(false)
      }
    }

    load()

    // Re-fetch every 5 minutes
    const iv = setInterval(load, 300_000)
    return () => clearInterval(iv)
  }, [])

  // ── Filter by active capsule ─────────────────────────────────────────────
  const capsule = CAPSULES.find(c => c.id === activeId) || CAPSULES[0]

  // FIX 4: Guard against rows being null/undefined at render time.
  // useState initialises to [] but an external mutation or a future refactor
  // could break that. Array.isArray check costs nothing and prevents a
  // TypeError from crashing the whole component tree.
  const safeRows = Array.isArray(rows) ? rows : []

  const filtered = capsule.match
    ? safeRows.filter(row =>
        capsule.match.some(keyword =>
          row.domain_name?.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    : safeRows

  // ── Summary stats from live data ─────────────────────────────────────────
  const rolesWithSalary   = safeRows.filter(r => r.min_salary > 0)
  const totalJobs         = safeRows.reduce((s, r) => s + (r.job_count_naukri || 0), 0)
  const avgMin            = rolesWithSalary.length
    ? Math.round(rolesWithSalary.reduce((s, r) => s + r.min_salary, 0) / rolesWithSalary.length)
    : 0
  const avgMax            = rolesWithSalary.length
    ? Math.round(rolesWithSalary.reduce((s, r) => s + r.max_salary, 0) / rolesWithSalary.length)
    : 0

  return (
    <section style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '16px',
          marginBottom:   '40px',
        }}>
          <div>
            <div style={{
              fontFamily:    FM,
              fontSize:      '10px',
              color:         'var(--text-4)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom:  '10px',
              display:       'flex',
              alignItems:    'center',
              gap:           '10px',
            }}>
              <div style={{ width: '20px', height: '1px', background: 'var(--border)' }} />
              02.1 — LIVE_PULSE
            </div>
            <h2 style={{
              fontFamily:    FS,
              fontWeight:    '700',
              fontSize:      'clamp(1.4rem, 3vw, 1.8rem)',
              letterSpacing: '-0.04em',
              color:         'var(--text)',
              margin:        0,
            }}>
              Live Market Pulse
            </h2>
            <p style={{
              fontFamily: FS,
              fontSize:   '14px',
              color:      'var(--text-3)',
              margin:     '6px 0 0',
            }}>
              Salary ranges and open roles — updated weekly from Naukri
            </p>
          </div>

          {/* Sync badge */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '7px',
            padding:    '5px 12px',
            border:     '1px solid var(--border)',
            borderRadius:'4px',
          }}>
            <div style={{
              width:        '6px',
              height:       '6px',
              borderRadius: '50%',
              background:   safeRows.length > 0 ? '#22c55e' : 'var(--text-4)',
            }} />
            <span style={{
              fontFamily:    FM,
              fontSize:      '10px',
              color:         'var(--text-3)',
              letterSpacing: '0.1em',
            }}>
              {lastSync
                ? `SYNCED ${new Date(lastSync).toLocaleDateString('en-IN')}`
                : 'LOADING'}
            </span>
          </div>
        </div>

        {/* ── Summary stats ─────────────────────────────────────────────── */}
        {!loading && safeRows.length > 0 && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap:                 '1px',
            background:          'var(--border)',
            border:              '1px solid var(--border)',
            marginBottom:        '40px',
          }}>
            {[
              { label: 'ROLES TRACKED',    value: rows.length },
              { label: 'WITH SALARY DATA', value: rolesWithSalary.length },
              { label: 'AVG ENTRY',        value: fmtLPA(avgMin) },
              { label: 'AVG CEILING',      value: fmtLPA(avgMax) },
              { label: 'TOTAL LIVE JOBS',  value: totalJobs > 0 ? totalJobs.toLocaleString('en-IN') : '—' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding:    '20px 16px',
                background: 'var(--bg)',
              }}>
                <div style={{
                  fontFamily:    FM,
                  fontSize:      '10px',
                  color:         'var(--text-4)',
                  letterSpacing: '0.14em',
                  marginBottom:  '8px',
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily:        FM,
                  fontSize:          '20px',
                  fontWeight:        '500',
                  color:             'var(--text)',
                  fontVariantNumeric:'tabular-nums',
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Domain capsule row ────────────────────────────────────────── */}
        <div style={{
          display:    'flex',
          flexWrap:   'wrap',
          gap:        '8px',
          marginBottom:'32px',
        }}>
          {CAPSULES.map(c => (
            <Capsule
              key={c.id}
              label={c.label}
              active={c.id === activeId}
              onClick={() => setActiveId(c.id)}
            />
          ))}
        </div>

        {/* ── Table header ─────────────────────────────────────────────── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 96px 96px 80px',
          gap:                 '8px',
          padding:             '0 0 10px',
          borderBottom:        '1px solid var(--border)',
          marginBottom:        '4px',
        }}>
          {['ROLE', 'ENTRY', 'CEILING', 'JOBS'].map((col, i) => (
            <div key={col} style={{
              fontFamily:    FM,
              fontSize:      '10px',
              color:         'var(--text-4)',
              letterSpacing: '0.14em',
              textAlign:     i === 0 ? 'left' : 'right',
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{
            padding:    '48px 0',
            textAlign:  'center',
            fontFamily: FM,
            fontSize:   '12px',
            color:      'var(--text-4)',
            letterSpacing:'0.1em',
          }}>
            LOADING DATA...
          </div>
        )}

        {error && (
          <div style={{
            padding:    '32px 0',
            fontFamily: FS,
            fontSize:   '14px',
            color:      'var(--err, #D94848)',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{
            padding:    '48px 0',
            textAlign:  'center',
            fontFamily: FS,
            fontSize:   '14px',
            color:      'var(--text-3)',
          }}>
            No data for this sector yet — the scraper is still building the dataset.
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {filtered.map((row, i) => (
              <RoleRow
                key={row.domain_name}
                row={row}
                index={i}
                total={filtered.length}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ── Methodology footnote ─────────────────────────────────────── */}
        {!loading && safeRows.length > 0 && (
          <div style={{
            marginTop:     '32px',
            paddingTop:    '20px',
            borderTop:     '1px solid var(--border)',
            fontFamily:    FM,
            fontSize:      '10px',
            color:         'var(--text-4)',
            letterSpacing: '0.08em',
            lineHeight:    1.8,
          }}>
            DATA: Naukri job counts · Payscale / IndiaTechSalaries salary bands ·
            Entry = p25 (₹/yr) · Ceiling = p75 (₹/yr) ·
            Payback formula: <em>months = cert_cost ÷ (ceiling − entry) × 12</em> ·
            Default cert cost ₹25,000 when not specified.
          </div>
        )}
      </div>
    </section>
  )
}