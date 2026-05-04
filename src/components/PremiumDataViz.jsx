import React from 'react';
import { motion } from 'framer-motion';

const FM = "'JetBrains Mono','IBM Plex Mono',monospace";
const EMERALD = 'var(--linear-blue)';
const AMBER   = 'var(--cool-grey)';
const ROSE    = 'var(--cool-grey)';
const INDIGO  = 'var(--linear-blue)';

// ─── SVG Consensus Gauge ─────────────────────────────────────────────────────
// pct: 0-100   accent: css color string
export function ConsensusGauge({ pct = 72, accent = EMERALD, label = 'ROI Score', size = 120 }) {
  const R    = 44;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * R;
  // only draw the top 270° arc (like a gauge)
  const arcLen   = circ * 0.75;
  const filled   = arcLen * (pct / 100);
  const rotation = 135; // start at bottom-left

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={8}
          strokeDasharray={`${arcLen} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
        {/* Active arc */}
        <motion.circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={accent}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
          transform={`rotate(${rotation} ${cx} ${cy})`}
          initial={{ strokeDashoffset: arcLen }}
          animate={{ strokeDashoffset: arcLen - filled }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${accent}60)` }}
        />
      </svg>
      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingBottom: 8,
      }}>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{ fontFamily: FM, fontSize: size < 100 ? 18 : 22, fontWeight: 700, color: accent, letterSpacing: '-0.03em' }}
        >
          {pct}
        </motion.span>
        <span style={{ fontFamily: FM, fontSize: 8, color: 'transparent', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonBlock({ width = '100%', height = 14, radius = 4, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--border-subtle)',
      animation: 'shimmer 1.6s infinite',
      ...style,
    }} />
  );
}

export function AIResultSkeleton() {
  return (
    <div style={{
      borderRadius: 16, border: '1px solid var(--border-subtle)',
      background: 'var(--border-subtle)', overflow: 'hidden',
      // FIXED HEIGHT — prevents layout jump
      minHeight: 320,
    }}>
      {/* header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <SkeletonBlock width={80} height={10} />
        <SkeletonBlock width={140} height={16} style={{ marginLeft: 8 }} />
        <div style={{ flex: 1 }} />
        <SkeletonBlock width={24} height={24} radius={6} />
      </div>
      {/* gauge + stats row */}
      <div style={{ padding: '18px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <SkeletonBlock width={100} height={100} radius={50} />
        <div style={{ flex: 1, display: 'grid', gap: 10 }}>
          <SkeletonBlock height={12} width="65%" />
          <SkeletonBlock height={12} width="80%" />
          <SkeletonBlock height={12} width="50%" />
        </div>
      </div>
      {/* body lines */}
      <div style={{ padding: '0 18px 18px', display: 'grid', gap: 8 }}>
        <SkeletonBlock height={11} />
        <SkeletonBlock height={11} width="92%" />
        <SkeletonBlock height={11} width="78%" />
      </div>
    </div>
  );
}

// ─── Hero skeleton (replaces the generic "Connecting to live database..." text)
export function HeroSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Leaderboard skeleton */}
      <div style={{ borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--border-subtle)', padding: 16 }}>
        <SkeletonBlock width={120} height={10} style={{ marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[1,2,3].map(i => <SkeletonBlock key={i} height={72} radius={10} />)}
        </div>
      </div>
      {/* Slider skeleton */}
      <div style={{ borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'var(--border-subtle)', padding: 18 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ marginBottom: 18 }}>
            <SkeletonBlock width={90} height={10} style={{ marginBottom: 10 }} />
            <SkeletonBlock height={4} radius={2} />
          </div>
        ))}
      </div>
      {/* Stat cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SkeletonBlock height={100} radius={14} />
        <SkeletonBlock height={100} radius={14} />
      </div>
    </div>
  );
}

// ─── Number roll ticker ───────────────────────────────────────────────────────
export function RollNumber({ value, prefix = '', suffix = '', color = EMERALD, fontSize = 'clamp(1.5rem,4vw,2.2rem)' }) {
  const [displayed, setDisplayed] = React.useState(0);
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

  React.useEffect(() => {
    const frames = 48; // ~0.8s at 60fps
    let f = 0;
    const id = setInterval(() => {
      f++;
      const progress = 1 - Math.pow(1 - f / frames, 3); // easeOutCubic
      setDisplayed(numVal * progress);
      if (f >= frames) { setDisplayed(numVal); clearInterval(id); }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [numVal]);

  const formatted = displayed % 1 === 0
    ? Math.round(displayed).toLocaleString('en-IN')
    : displayed.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <span style={{
      fontFamily: FM, fontWeight: 800, fontSize,
      color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
    }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ─── Verdict status resolver (brutally honest) ────────────────────────────────
export function resolveVerdictStatus(verdict = '', breakEvenMonths = 0) {
  const v = verdict.toLowerCase();
  if (v.includes('strong') || v.includes('excellent') || v.includes('highly recommend')) {
    return { code: 'STRONG_BUY', label: 'STATUS: STRONG BUY', color: EMERALD, bg: 'transparent', border: 'transparent' };
  }
  if (v.includes('moderate') || v.includes('consider') || v.includes('conditional')) {
    return { code: 'NEUTRAL', label: 'STATUS: NEUTRAL — VERIFY ASSUMPTIONS', color: AMBER, bg: 'transparent', border: 'transparent' };
  }
  if (breakEvenMonths > 24 || v.includes('risk') || v.includes('not recommend') || v.includes('avoid')) {
    return { code: 'HIGH_RISK', label: 'STATUS: HIGH RISK. PAYBACK PERIOD > 24 MONTHS', color: ROSE, bg: 'transparent', border: 'transparent' };
  }
  return { code: 'NEUTRAL', label: 'STATUS: NEUTRAL — VERIFY ASSUMPTIONS', color: AMBER, bg: 'transparent', border: 'transparent' };
}

// ─── Data sync badge ──────────────────────────────────────────────────────────
export function DataSyncBadge({ updatedAt }) {
  // Format the Supabase timestamp if provided; else show live-synced label
  const label = React.useMemo(() => {
    if (!updatedAt) return 'DATA VERIFIED LIVE';
    try {
      const d = new Date(updatedAt);
      const opts = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false };
      return `DATA COMPILED: ${d.toLocaleString('en-IN', opts).toUpperCase()} IST`;
    } catch { return 'DATA VERIFIED LIVE'; }
  }, [updatedAt]);

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 4,
      border: '1px solid var(--border-subtle)',
      background: 'var(--border-subtle)',
      fontFamily: FM, fontSize: 9, letterSpacing: '0.08em', color: 'transparent',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: EMERALD, flexShrink: 0,
        boxShadow: `0 0 6px ${EMERALD}`,
        animation: 'pdot 1.6s ease-in-out infinite',
      }} />
      {label}
    </div>
  );
}
