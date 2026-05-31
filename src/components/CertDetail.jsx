import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  HelpCircle,
  CalendarDays,
  AlertTriangle,
  Monitor,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const INDUSTRY_AVG_COST     = 250;  // USD
const INDUSTRY_AVG_DURATION = 100;  // minutes

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatCost(cost) {
  if (cost === null || cost === undefined) return '—';
  const n = Number(cost);
  if (n === 0) return 'Free';
  return `$${n.toLocaleString()}`;
}

function formatValidity(months) {
  if (months === null || months === undefined) return '—';
  const n = Number(months);
  if (n >= 999) return 'Lifetime';
  return `${n} Months`;
}

function formatDuration(mins) {
  if (!mins) return '—';
  return `${mins} Mins`;
}

function formatQuestions(n) {
  if (!n) return '—';
  return String(n);
}

const DIFFICULTY_STYLES = {
  foundational: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400' },
  associate:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    text: 'text-blue-400'    },
  professional: { bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  text: 'text-violet-400'  },
  expert:       { bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  text: 'text-orange-400'  },
  specialty:    { bg: 'bg-pink-500/10',    border: 'border-pink-500/25',    text: 'text-pink-400'    },
};

function getDifficultyStyle(level) {
  if (!level) return DIFFICULTY_STYLES.associate;
  return DIFFICULTY_STYLES[level.toLowerCase()] || DIFFICULTY_STYLES.associate;
}

function vendorFromSlug(slug) {
  if (!slug) return null;
  const prefix = slug.split('-')[0].toUpperCase();
  const MAP = {
    AWS: 'AWS', GCP: 'Google Cloud', AZURE: 'Microsoft Azure', AZ: 'Microsoft Azure',
    CKA: 'CNCF', CKAD: 'CNCF', CKS: 'CNCF',
    CISSP: 'ISC²', CISM: 'ISACA', CISA: 'ISACA',
    PMP: 'PMI', CAPM: 'PMI',
    COMPTIA: 'CompTIA',
    RHCE: 'Red Hat', RHCSA: 'Red Hat',
    CCNA: 'Cisco', CCNP: 'Cisco', CCIE: 'Cisco',
  };
  return MAP[prefix] || prefix;
}

// ─────────────────────────────────────────────────────────
// StatCard — hero row
// ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, valueClass = 'text-white', accent }) {
  return (
    /*
      min-h-[80px] ensures the card is tall enough to be a comfortable
      touch target even on the smallest phones.
    */
    <div className="flex flex-col gap-2 md:gap-3 p-3.5 md:p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.07] min-h-[80px] md:min-h-0">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div
          className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent ? `${accent}18` : 'rgba(255,255,255,0.05)' }}
        >
          <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color: accent || '#71717a' }} />
        </div>
        <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-semibold text-zinc-500 leading-tight">
          {label}
        </span>
      </div>
      {/*
        Value text: scale down on mobile to prevent overflow in the 2×2 grid.
        text-lg on mobile (≈18px) → text-2xl on desktop.
      */}
      <p className={`text-lg md:text-2xl font-bold leading-none tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Custom Recharts tooltip — positioned to avoid right-edge clipping
// ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-xl max-w-[160px]">
      <p className="text-zinc-400 mb-1 truncate">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-semibold" style={{ color: entry.fill }}>
          {entry.name}:{' '}
          <span className="text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ComparisonChart — horizontal bar chart
// ─────────────────────────────────────────────────────────
function ComparisonChart({ title, thisValue, avgValue, unit, thisLabel, color }) {
  const data = [
    { name: thisLabel,      value: thisValue },
    { name: 'Industry Avg', value: avgValue  },
  ];

  const pct = avgValue > 0
    ? Math.round(Math.abs(thisValue - avgValue) / avgValue * 100)
    : 0;
  const comparison =
    thisValue > avgValue ? `${pct}% above industry average`
    : thisValue < avgValue ? `${pct}% below industry average`
    : 'Matches industry average';

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.07]">
      <h4 className="text-[10px] md:text-xs uppercase tracking-widest font-semibold text-zinc-500 mb-3 md:mb-4">
        {title}
      </h4>

      {/*
        ResponsiveContainer width="100%" is critical — it lets Recharts
        measure the parent div and never overflow the viewport.
        height is taller on mobile (110px) so bars are finger-friendly.
        YAxis width is reduced on mobile to reclaim horizontal space.
      */}
      <ResponsiveContainer width="100%" height={110}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: '#52525b', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={76}
          />
          {/*
            position="left" keeps the tooltip from clipping off the
            right edge on narrow mobile screens.
          */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            position={{ x: 0 }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={30}>
            <Cell fill={color} />
            <Cell fill="#3f3f46" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-zinc-600 mt-2">{comparison}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black w-full text-white p-4 md:p-8">
      <div className="max-w-[1100px] mx-auto animate-pulse space-y-6 md:space-y-8">
        {/* Back nav */}
        <div className="h-4 w-24 bg-white/5 rounded" />
        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-white/5 rounded-full" />
          <div className="h-6 w-24 bg-white/5 rounded-full" />
        </div>
        {/* Title */}
        <div className="h-8 md:h-12 w-3/4 bg-white/10 rounded" />
        {/* Stat cards — 2×2 on mobile, 4 across on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 md:h-28 bg-zinc-900/30 border border-white/5 rounded-2xl" />
          ))}
        </div>
        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 md:h-48 bg-zinc-900/30 border border-white/5 rounded-2xl" />
            <div className="h-28 md:h-32 bg-zinc-900/30 border border-white/5 rounded-2xl" />
          </div>
          <div className="h-56 md:h-64 bg-zinc-900/30 border border-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
const CertDetail = () => {
  const { slug } = useParams();
  const [cert, setCert]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!slug) { setIsLoading(false); return; }
    let active = true;

    const fetchCert = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('certifications')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchError) throw fetchError;
        if (active) setCert(data);
      } catch (err) {
        console.error('Error fetching cert details:', err);
        if (active) setError(err.message || 'Failed to load certification details.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchCert();
    return () => { active = false; };
  }, [slug]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-black w-full text-white p-4 md:p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500 text-sm text-center px-4">
          {error || 'Certification not found.'}
        </p>
        <Link
          to="/tools/cert-radar"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cert Radar
        </Link>
      </div>
    );
  }

  const diffStyle     = getDifficultyStyle(cert.difficulty_level);
  const vendor        = cert.vendor || vendorFromSlug(cert.slug);
  const costValue     = Number(cert.base_cost_usd)       || 0;
  const durationValue = Number(cert.exam_duration_minutes) || 0;

  return (
    <div className="min-h-screen bg-black w-full text-white pb-20 md:pb-24">
      {/*
        Page wrapper:
        Mobile:  px-4  py-6   — tight but breathable
        Tablet:  px-6  py-8
        Desktop: px-10 py-12
      */}
      <div className="max-w-[1100px] mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-10 lg:py-12">

        {/* ── Back nav ── */}
        <nav className="mb-6 md:mb-10">
          <Link
            to="/tools/cert-radar"
            className="
              inline-flex items-center gap-2
              min-h-[44px] pr-4
              text-sm font-medium text-zinc-500
              hover:text-white active:text-white
              transition-colors
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Cert Radar
          </Link>
        </nav>

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <header className="mb-6 md:mb-10">
          {/* Badges row — wraps naturally on mobile */}
          <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-5">
            {vendor && (
              <span className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-white/5 border border-white/10 text-zinc-400 rounded-full">
                {vendor}
              </span>
            )}
            {cert.difficulty_level && (
              <span className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold rounded-full border ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text}`}>
                {cert.difficulty_level}
              </span>
            )}
            {cert.functional_track && (
              <span className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-white/5 border border-white/10 text-zinc-400 rounded-full">
                {cert.functional_track}
              </span>
            )}
          </div>

          {/*
            Title typography scale:
            Mobile:  text-2xl (24px) — no wrapping on 375px
            Tablet:  text-3xl (30px)
            Desktop: text-5xl (48px) — premium impact
          */}
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] text-white">
            {cert.name}
          </h1>
        </header>

        {/* ── Bottom-line stat cards ──────────────────────────
            2×2 grid on mobile  → neat square, no squishing
            4 across on desktop → full-width row
        ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          <StatCard
            icon={DollarSign}
            label="Exam Cost"
            value={formatCost(cert.base_cost_usd)}
            valueClass={costValue === 0 ? 'text-emerald-400' : 'text-emerald-300'}
            accent="#10b981"
          />
          <StatCard
            icon={CalendarDays}
            label="Validity"
            value={formatValidity(cert.validity_period_months)}
            accent="#3b82f6"
          />
          <StatCard
            icon={Clock}
            label="Exam Length"
            value={formatDuration(cert.exam_duration_minutes)}
            accent="#8b5cf6"
          />
          <StatCard
            icon={HelpCircle}
            label="Questions"
            value={formatQuestions(cert.total_questions)}
            accent="#f59e0b"
          />
        </div>

        {/* ══════════════════════════════════════════════
            MAIN LAYOUT
            ─────────────────────────────────────────────
            Mobile:  single column, flex-col
                     Logistics card appears FIRST (order-first)
                     so users see the quick-facts before reading
                     the long narrative text.
            Desktop: 2/3 left narrative + 1/3 sticky sidebar
                     Sidebar returns to its natural right position
                     (order-last on lg).
        ══════════════════════════════════════════════ */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 md:gap-6 items-start">

          {/* ── RIGHT SIDEBAR — Logistics Card ──────────────
              order-first:    appears at top on mobile
              lg:order-last:  returns to right column on desktop
              lg:sticky:      sticks while scrolling on desktop
          ── */}
          <aside className="w-full order-first lg:order-last lg:sticky lg:top-6">
            <div className="p-4 md:p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.09] space-y-4 md:space-y-5">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-400">
                Exam Logistics
              </h3>

              {/* Exam Format */}
              {cert.exam_format_type && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-1">
                      Exam Format
                    </p>
                    <p className="text-sm text-zinc-200 font-medium">{cert.exam_format_type}</p>
                  </div>
                </div>
              )}

              {/* Testing Method */}
              {cert.testing_method && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Monitor className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-1">
                      Testing Method
                    </p>
                    <p className="text-sm text-zinc-200 font-medium">{cert.testing_method}</p>
                  </div>
                </div>
              )}

              {/* Validity */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-1">
                    Validity Period
                  </p>
                  <p className="text-sm text-zinc-200 font-medium">
                    {formatValidity(cert.validity_period_months)}
                  </p>
                </div>
              </div>

              {/* Mandatory Training Warning */}
              {cert.requires_mandatory_training && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-300 mb-0.5">
                      Mandatory Training Required
                    </p>
                    <p className="text-[11px] text-amber-400/70 leading-relaxed">
                      This certification requires completing an official training course before you can sit the exam.
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* Quick stats summary */}
              <div className="space-y-3">
                {[
                  { label: 'Total Questions', value: formatQuestions(cert.total_questions) },
                  { label: 'Exam Duration',   value: formatDuration(cert.exam_duration_minutes) },
                  { label: 'Exam Cost',        value: formatCost(cert.base_cost_usd) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="text-xs font-semibold text-zinc-200">{value}</span>
                  </div>
                ))}
              </div>

              {/* CTA — min-h-[44px] for fat-finger safety */}
              <Link
                to="/app"
                className="
                  mt-1 w-full flex items-center justify-center gap-2
                  min-h-[44px] py-3 px-4
                  rounded-xl bg-white text-black text-sm font-bold
                  hover:bg-zinc-100 active:bg-zinc-200
                  transition-colors
                "
              >
                Calculate ROI
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Affiliate Disclosure */}
              <p className="text-[10px] text-zinc-500 text-center pt-2 leading-relaxed">
                If you purchase training through links on this page, we may earn a commission. This does not affect our ROI calculations.
              </p>
            </div>
          </aside>

          {/* ── LEFT COLUMN — Narrative + Charts ────────────
              order-last on mobile (appears below logistics card)
              lg:col-span-2 on desktop (takes 2/3 width)
          ── */}
          <div className="w-full order-last lg:order-first lg:col-span-2 space-y-5 md:space-y-6">

            {/* What is it? */}
            {cert.about_description && (
              <section className="p-4 md:p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.07]">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <h2 className="text-xs md:text-sm font-semibold uppercase tracking-widest text-zinc-400">
                    What is it?
                  </h2>
                </div>
                <p className="text-zinc-200 text-sm md:text-[15px] leading-[1.8] font-normal">
                  {cert.about_description}
                </p>
              </section>
            )}

            {/* Eligibility & Prerequisites */}
            {cert.eligibility_criteria && (
              <section className="p-4 md:p-6 rounded-2xl bg-amber-500/[0.04] border border-amber-500/[0.15]">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <h2 className="text-xs md:text-sm font-semibold uppercase tracking-widest text-amber-400/80">
                    Eligibility &amp; Prerequisites
                  </h2>
                </div>
                <p className="text-zinc-300 text-sm md:text-[14px] leading-[1.8]">
                  {cert.eligibility_criteria}
                </p>
              </section>
            )}

            {/* ── Market Context Charts ── */}
            <section>
              {/* Section divider label */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 px-2 whitespace-nowrap">
                  Market Context
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/*
                Charts grid:
                Mobile:  1 column — each chart gets full width, no overflow
                Tablet+: 2 columns side by side
              */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ComparisonChart
                  title="Exam Cost vs. Industry Avg"
                  thisValue={costValue || 0}
                  avgValue={INDUSTRY_AVG_COST}
                  unit="$"
                  thisLabel={vendor || 'This Cert'}
                  color="#10b981"
                />
                <ComparisonChart
                  title="Exam Duration vs. Industry Avg"
                  thisValue={durationValue || 0}
                  avgValue={INDUSTRY_AVG_DURATION}
                  unit=" min"
                  thisLabel={vendor || 'This Cert'}
                  color="#8b5cf6"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertDetail;
