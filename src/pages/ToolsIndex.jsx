import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, BarChart2, TrendingUp, FileText, Map,
  Cpu, GraduationCap, CheckCircle, ArrowRight,
} from 'lucide-react'

const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const FS = "'Inter','DM Sans',sans-serif"

const TOOLS = [
  {
    id: 'roi',
    path: '/app',
    icon: BarChart2,
    label: 'ROI Calculator',
    tag: 'CORE',
    desc: 'Enter your salary + city. Get exact payback period and 5-year net gain.',
    badge: 'Most used',
    badgeColor: 'var(--gold)',
  },
  {
    id: 'cert-radar',
    path: '/tools/cert-radar',
    icon: Search,
    label: 'Cert Radar',
    tag: 'DISCOVER',
    desc: 'Browse and filter 500+ tracked certifications across every domain, cost, and difficulty level.',
  },
  {
    id: 'market',
    path: '/tools/market',
    icon: TrendingUp,
    label: 'Live Market Pulse',
    tag: 'INTEL',
    desc: 'Real-time salary movers, trending roles, and certification demand signals from Naukri + LinkedIn.',
    badge: 'Live',
    badgeColor: '#2db87a',
  },
  {
    id: 'offer-analysis',
    path: '/offer-analysis',
    icon: CheckCircle,
    label: 'Offer Analysis',
    tag: 'NEGOTIATE',
    desc: 'Paste a job offer and get a precision breakdown — is this number fair for your city and cert stack?',
  },
  {
    id: 'compare',
    path: '/tools/compare',
    icon: Cpu,
    label: 'Cert Compare',
    tag: 'COMPARE',
    desc: 'Compare two certifications head-to-head on ROI, difficulty, prep time, and market demand.',
  },
  {
    id: 'heatmap',
    path: '/tools/heatmap',
    icon: Map,
    label: 'India Cert Heatmap',
    tag: 'GEO',
    desc: 'See which certifications dominate each Indian city — Bengaluru, Pune, Hyderabad, and more.',
  },
  {
    id: 'jobmap',
    path: '/tools/jobmap',
    icon: Map,
    label: 'Job–Cert Map',
    tag: 'NAVIGATE',
    desc: 'Map job roles to the certifications that will actually get you the role — not just any cert.',
  },
  {
    id: 'simulator',
    path: '/tools/simulator',
    icon: TrendingUp,
    label: 'Career Simulator',
    tag: 'SIMULATE',
    desc: 'Run a 5-year career projection with and without certifications. See the compounding delta.',
  },
  {
    id: 'resume',
    path: '/tools/resume',
    icon: FileText,
    label: 'Resume Analyzer',
    tag: 'OPTIMIZE',
    desc: 'Upload your resume. Get a cert-gap analysis — what\'s missing vs the market you are targeting.',
  },
  {
    id: 'hike',
    path: '/tools/hike',
    icon: BarChart2,
    label: 'Hike Verifier',
    tag: 'VERIFY',
    desc: 'Got a raise? Verify if it is actually above or below market after accounting for your cert stack.',
  },
  {
    id: 'college',
    path: '/tools/college',
    icon: GraduationCap,
    label: 'College vs Corporate',
    tag: 'DECIDE',
    desc: 'MBA vs certifications? Run the financial model — net cost, opportunity cost, and 5-year ROI.',
  },
]

function ToolCard({ tool }) {
  const Icon = tool.icon
  return (
    <Link
      to={tool.path}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          padding: '24px',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          height: '100%',
          cursor: 'pointer',
          transition: 'border-color 180ms ease, background 180ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-mid)'
          e.currentTarget.style.background = 'var(--bg-alt)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {/* Top row: tag + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: FM, fontSize: '9px', letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--text-4)',
          }}>
            {tool.tag}
          </span>
          {tool.badge && (
            <span style={{
              fontFamily: FM, fontSize: '9px', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: tool.badgeColor,
              border: `1px solid ${tool.badgeColor}`,
              padding: '2px 8px', borderRadius: '999px',
            }}>
              {tool.badge}
            </span>
          )}
        </div>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={16} color="var(--text-3)" strokeWidth={1.5} />
          </div>
          <h3 style={{
            margin: 0, fontFamily: FS, fontSize: '16px',
            fontWeight: 750, letterSpacing: '-0.01em',
            color: 'var(--text)', lineHeight: 1.2,
          }}>
            {tool.label}
          </h3>
        </div>

        {/* Description */}
        <p style={{
          margin: 0, fontFamily: FS, fontSize: '13px',
          color: 'var(--text-3)', lineHeight: 1.65, flex: 1,
        }}>
          {tool.desc}
        </p>

        {/* CTA arrow */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: FM, fontSize: '11px', letterSpacing: '0.08em',
          color: 'var(--text-4)', textTransform: 'uppercase',
        }}>
          Open tool <ArrowRight size={11} />
        </div>
      </div>
    </Link>
  )
}

export default function ToolsIndex() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingTop: '128px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px', borderBottom: '1px solid var(--border)', paddingBottom: '32px' }}>
          <p style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Platform / Tools
          </p>
          <h1 style={{ fontFamily: FS, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--text)', margin: '0 0 16px' }}>
            Career Navigation Tools
          </h1>
          <p style={{ fontFamily: FS, fontSize: '15px', color: 'var(--text-3)', lineHeight: 1.7, maxWidth: '54ch', margin: 0 }}>
            Every tool is built around one question: <em style={{ color: 'var(--text-2)' }}>will this cert pay off for you?</em> Pick your starting point.
          </p>
        </div>

        {/* Tool grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  )
}
