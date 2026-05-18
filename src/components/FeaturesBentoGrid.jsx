import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import IntersectionGraphic from './graphics/IntersectionGraphic.jsx'
import FilterGraphic from './graphics/FilterGraphic.jsx'
import PathGraphic from './graphics/PathGraphic.jsx'
import { useTheme } from '../hooks/useTheme.jsx'

const F_SANS = "'Inter', 'DM Sans', sans-serif"
const F_MONO = "'JetBrains Mono', 'IBM Plex Mono', monospace"

const trendingRoles = [
  { role: 'Cloud Security Engineer', jobs: '3,240', salary: 'INR 18.4L' },
  { role: 'Data Platform Analyst', jobs: '2,890', salary: 'INR 14.8L' },
  { role: 'Revenue Ops Manager', jobs: '1,760', salary: 'INR 16.2L' },
]

function TeaserLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '22px',
        color: 'var(--text)',
        textDecoration: 'none',
        fontFamily: F_SANS,
        fontSize: '13px',
        fontWeight: 800,
      }}
    >
      {children}
      <ArrowRight size={14} />
    </Link>
  )
}

function BoxShell({ label, title, copy, children, linkTo, linkLabel, isLast }) {
  return (
    <article
      className="features-bento__box"
      style={{
        minWidth: 0,
        padding: '0 34px',
        borderRight: isLast ? 'none' : '1px solid var(--border)',
        background: 'transparent',
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: '10px',
          color: 'var(--text-4)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: '34px',
        }}
      >
        {label}
      </div>
      <div style={{ minHeight: '232px', display: 'flex', alignItems: 'center' }}>{children}</div>
      <h3
        style={{
          margin: '34px 0 10px',
          color: 'var(--text)',
          fontFamily: F_SANS,
          fontSize: '18px',
          lineHeight: 1.25,
          fontWeight: 850,
          letterSpacing: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          color: 'var(--text-2)',
          fontFamily: F_SANS,
          fontSize: '14px',
          lineHeight: 1.7,
        }}
      >
        {copy}
      </p>
      <TeaserLink to={linkTo}>{linkLabel}</TeaserLink>
    </article>
  )
}

function MarketPulseMock() {
  return (
    <div style={{ width: '100%', display: 'grid', gap: '14px' }}>
      {trendingRoles.map((item, index) => (
        <div
          key={item.role}
          style={{
            display: 'grid',
            gridTemplateColumns: '28px minmax(0, 1fr) auto',
            gap: '12px',
            alignItems: 'center',
            paddingBottom: '14px',
            borderBottom: index === trendingRoles.length - 1 ? 'none' : '1px solid var(--border)',
          }}
        >
          <span
            style={{
              color: 'var(--text)',
              fontFamily: F_MONO,
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            0{index + 1}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--text)', fontFamily: F_SANS, fontSize: '14px', fontWeight: 800 }}>
              {item.role}
            </div>
            <div style={{ color: 'var(--text-3)', fontFamily: F_MONO, fontSize: '10px', marginTop: '5px' }}>
              {item.jobs} open roles
            </div>
          </div>
          <span style={{ color: 'var(--text-2)', fontFamily: F_MONO, fontSize: '11px' }}>{item.salary}</span>
        </div>
      ))}
    </div>
  )
}

function CertRadarMock({ isDark }) {
  return (
    <div style={{ width: '100%', height: '232px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FilterGraphic isDark={isDark} />
    </div>
  )
}

function DashboardMock({ isDark }) {
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <IntersectionGraphic isDark={isDark} />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          marginTop: '18px',
          color: 'var(--text-2)',
          fontFamily: F_MONO,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <MapPin size={13} />
        City calibrated ROI
      </div>
    </div>
  )
}

function RouteAnalysisMock({ isDark }) {
  return (
    <div style={{ width: '100%', height: '232px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PathGraphic isDark={isDark} />
    </div>
  )
}

export default function FeaturesBentoGrid() {
  const { current } = useTheme()
  const isDark = current.id !== 'light'

  return (
    <section
      style={{
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: '104px 24px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ width: 'min(100%, 1180px)', margin: '0 auto' }}>
        <div style={{ maxWidth: '640px', marginBottom: '46px' }}>
          <div
            style={{
              color: 'var(--text-4)',
              fontFamily: F_MONO,
              fontSize: '11px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            Product surface
          </div>
          <h2
            style={{
              margin: 0,
              color: 'var(--text)',
              fontFamily: F_SANS,
              fontSize: '34px',
              lineHeight: 1.08,
              letterSpacing: 0,
              fontWeight: 900,
            }}
          >
            Three ways to stop guessing.
          </h2>
        </div>

        <div
          className="features-bento"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            background: 'transparent',
          }}
        >
          {/* FIG 0.1 — Market Pulse / Cert Radar */}
          <BoxShell
            label="FIG 0.1 // THE FILTER"
            title="Scan the certification pipeline"
            copy="Instantly identify high-demand signals amidst global complexity with our live data integration."
            linkTo="/tools/market"
            linkLabel="View Market Pulse"
          >
            <CertRadarMock isDark={isDark} />
          </BoxShell>
          {/* FIG 0.2 — ROI Calculator */}
          <BoxShell
            label="FIG 0.2 // THE INTERSECTION"
            title="Calculate the payback"
            copy="Move from vibe to numbers with city-calibrated salary delta and payback period math."
            linkTo="/app"
            linkLabel="Calculate ROI"
          >
            <DashboardMock isDark={isDark} />
          </BoxShell>
          {/* FIG 0.3 — Route Analysis */}
          <BoxShell
            label="FIG 0.3 // THE PATH"
            title="Trace the optimal route"
            copy="Find the most efficient certification path for your specific career goals, skipping dead-ends."
            linkTo="/tools/cert-radar"
            linkLabel="Route Analysis"
            isLast
          >
            <RouteAnalysisMock isDark={isDark} />
          </BoxShell>
        </div>
      </div>
    </section>
  )
}
