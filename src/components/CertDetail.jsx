import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  Scale
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '../store/useJourneyStore.js';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// 
// Constants
// 
const INDUSTRY_AVG_COST     = 250;  // USD
const INDUSTRY_AVG_DURATION = 100;  // minutes

// 
// Helpers
// 
function formatDualCost(cost_inr, cost_usd) {
  const numInr = Number(cost_inr);
  const numUsd = Number(cost_usd);
  if (!numInr && !numUsd) return 'Varies';
  
  const inrStr = numInr ? `₹${numInr.toLocaleString('en-IN')}` : '';
  const usdStr = numUsd ? `$${numUsd.toLocaleString()}` : '';
  
  if (inrStr && usdStr) return `${inrStr} / ${usdStr}`;
  return inrStr || usdStr;
}

function formatValidity(months) {
  if (months === null || months === undefined) return '-';
  const n = Number(months);
  if (n >= 999) return 'Lifetime';
  return `${n} Months`;
}

function formatDuration(mins) {
  if (!mins) return '-';
  return `${mins} Mins`;
}

function formatQuestions(n) {
  if (!n) return '-';
  return String(n);
}

const DIFFICULTY_STYLES = {
  foundational: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400' },
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
    CISSP: 'ISC', CISM: 'ISACA', CISA: 'ISACA',
    PMP: 'PMI', CAPM: 'PMI',
    COMPTIA: 'CompTIA',
    RHCE: 'Red Hat', RHCSA: 'Red Hat',
    CCNA: 'Cisco', CCNP: 'Cisco', CCIE: 'Cisco',
  };
  return MAP[prefix] || prefix;
}

// 
// StatCard - hero row
// 
function StatCard({ icon: Icon, label, value, valueClass = 'text-[var(--text)]', accent }) {
  return (
    /*
      min-h-[80px] ensures the card is tall enough to be a comfortable
      touch target even on the smallest phones.
    */
    <div className="flex flex-col gap-2 md:gap-3 p-3.5 md:p-5 glass min-h-[80px] md:min-h-0">
      <div className="flex items-center gap-1.5 md:gap-2">
        <div
          className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent ? `${accent}18` : 'rgba(255,255,255,0.05)' }}
        >
          <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color: accent || '#71717a' }} />
        </div>
        <span className="text-[9px] md:text-sm font-medium text-[color:var(--text-3)] uppercase tracking-widest font-semibold text-zinc-500 leading-tight">
          {label}
        </span>
      </div>
      {/*
        Value text: scale down on mobile to prevent overflow in the 22 grid.
        text-lg on mobile (18px)  text-2xl on desktop.
      */}
      <p className={`text-[15px] md:text-2xl font-bold leading-tight tabular-nums break-words ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

// 
// Custom Recharts tooltip - positioned to avoid right-edge clipping
// 
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-2xl shadow-black/10 rounded-xl px-3 py-2.5 text-sm font-medium shadow-xl max-w-[160px]">
      <p className="text-[var(--text-3)] mb-1 truncate">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-semibold" style={{ color: entry.fill }}>
          {entry.name}:{' '}
          <span className="text-[var(--text)]">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// 
// Mock Hike Helper
// 
function getMockHikePercent(level) {
  if (!level) return 15;
  const l = level.toLowerCase();
  if (l.includes('expert') || l.includes('specialty')) return 25;
  if (l.includes('professional')) return 20;
  if (l.includes('associate')) return 15;
  return 10; // foundational
}

// 
// CertROICurve - Area chart for 5-Year Projection
// 
function CertROICurve({ costValue, hikePercent, color, title }) {
  // Assume a base salary of 100,000 for calculation to show tangible curve
  const BASE_SALARY = 100000;
  const annualGain = (BASE_SALARY * hikePercent) / 100;
  
  const data = [];
  let cumulative = -costValue; // Start at year 0 after paying for cert
  data.push({ year: 'Year 0', netValue: cumulative });

  for (let i = 1; i <= 5; i++) {
    cumulative += annualGain;
    data.push({ year: `Year ${i}`, netValue: cumulative });
  }

  return (
    <div className="p-4 md:p-5 glass" style={{ overflow: 'hidden' }}>
      <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
        {title}
      </h4>
      <p className="text-[11px] text-[var(--text-4)] mb-4">
        * Based on a {hikePercent}% avg hike projection (Assumes $100k base salary)
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorNetValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area 
            type="monotone" 
            dataKey="netValue" 
            name="Net ROI" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorNetValue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 
// Loading skeleton
// 
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg)] w-full text-[var(--text)] p-4 md:p-8">
      <div className="max-w-[1100px] mx-auto animate-pulse space-y-6 md:space-y-8">
        {/* Back nav */}
        <div className="h-4 w-24 bg-[var(--border)] rounded" />
        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-[var(--border)] rounded-full" />
          <div className="h-6 w-24 bg-[var(--border)] rounded-full" />
        </div>
        {/* Title */}
        <div className="h-8 md:h-12 w-3/4 bg-[var(--border)] rounded" />
        {/* Stat cards - 22 on mobile, 4 across on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 md:h-28 glass" />
          ))}
        </div>
        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 md:h-48 glass" />
            <div className="h-28 md:h-32 glass" />
          </div>
          <div className="h-56 md:h-64 glass" />
        </div>
      </div>
    </div>
  );
}

// 
// Main component
// 
const CertDetail = () => {
  const { slug } = useParams();
  const router = useRouter();
  const setCompareMode = useJourneyStore(s => s.setCompareMode);
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
        console.error('Error fetching cert details:', err.message || err);
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
      <div className="min-h-screen bg-[var(--bg)] w-full text-[var(--text)] p-4 md:p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--text-3)] text-sm text-center px-4">
          {error || 'Certification not found.'}
        </p>
        <Link
          href="/tools/cert-radar"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--text-3)] hover:text-[var(--text)] hover:border-[var(--text-4)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cert Radar
        </Link>
      </div>
    );
  }

  const diffStyle     = getDifficultyStyle(cert.difficulty_level);
  const vendor        = cert.vendor || vendorFromSlug(cert.slug);
  const costValue     = Number(cert.cost_usd)       || 0;
  const durationValue = Number(cert.exam_duration_minutes) || 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] w-full text-[var(--text)] pb-20 md:pb-24">
      {/*
        Page wrapper:
        Mobile:  px-4  py-6   - tight but breathable
        Tablet:  px-6  py-8
        Desktop: px-10 py-12
      */}
      <div className="max-w-[1100px] mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-10 lg:py-12">

        {/*  Back nav  */}
        <nav className="mb-6 md:mb-10">
          <Link
            href="/tools/cert-radar"
            className="
              inline-flex items-center gap-2
              min-h-[44px] pr-4
              text-sm font-medium text-[var(--text-3)]
              hover:text-[var(--text)] active:text-[var(--text)]
              transition-colors
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Cert Radar
          </Link>
        </nav>

        {/* 
            HERO
         */}
        <header className="mb-6 md:mb-10">
          {/* Badges row - wraps naturally on mobile */}
          <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-5">
            {vendor && (
              <span className="px-3 py-1.5 text-sm font-medium text-[var(--text-3)] uppercase tracking-widest glass rounded-full">
                {vendor}
              </span>
            )}
            {cert.difficulty_level && (
              <span className={`px-3 py-1.5 text-sm font-medium uppercase tracking-widest font-semibold rounded-full border ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text}`}>
                {cert.difficulty_level}
              </span>
            )}
            {cert.functional_track && (
              <span className="px-3 py-1.5 text-sm font-medium text-[var(--text-3)] uppercase tracking-widest glass">
                {cert.functional_track}
              </span>
            )}
          </div>

          {/*
            Title typography scale:
            Mobile:  text-2xl (24px) - no wrapping on 375px
            Tablet:  text-3xl (30px)
            Desktop: text-5xl (48px) - premium impact
          */}
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight leading-[1.05] text-[var(--text)]">
            {cert.name}
          </h1>
        </header>

        {/*  Bottom-line stat cards 
            22 grid on mobile   neat square, no squishing
            4 across on desktop  full-width row
         */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          <StatCard
            icon={DollarSign}
            label="Exam Cost"
            value={formatDualCost(cert.cost_inr, cert.cost_usd)}
            valueClass={costValue === 0 ? 'text-orange-400' : 'text-[var(--text)]'}
            accent="var(--brand-primary)"
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

        {/* 
            MAIN LAYOUT
            
            Mobile:  single column, flex-col
                     Logistics card appears FIRST (order-first)
                     so users see the quick-facts before reading
                     the long narrative text.
            Desktop: 2/3 left narrative + 1/3 sticky sidebar
                     Sidebar returns to its natural right position
                     (order-last on lg).
         */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 md:gap-6 items-start">

          {/*  RIGHT SIDEBAR - Logistics Card 
              order-first:    appears at top on mobile
              lg:order-last:  returns to right column on desktop
              lg:sticky:      sticks while scrolling on desktop
           */}
          <aside className="w-full order-first lg:order-last lg:sticky lg:top-6">
            <div className="p-4 md:p-6 rounded-2xl glass space-y-4 md:space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-3)]">
                Exam Logistics
              </h3>

              {/* Exam Format */}
              {cert.exam_format_type && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-3)] uppercase tracking-widest mb-1">
                      Exam Format
                    </p>
                    <p className="text-sm text-[var(--text)] font-medium">{cert.exam_format_type}</p>
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
                    <p className="text-sm font-medium text-[var(--text-3)] uppercase tracking-widest mb-1">
                      Testing Method
                    </p>
                    <p className="text-sm text-[var(--text)] font-medium">{cert.testing_method}</p>
                  </div>
                </div>
              )}

              {/* Validity */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-3)] uppercase tracking-widest mb-1">
                    Validity Period
                  </p>
                  <p className="text-sm text-[var(--text)] font-medium">
                    {formatValidity(cert.validity_period_months)}
                  </p>
                </div>
              </div>

              {/* Mandatory Training Warning */}
              {cert.requires_mandatory_training && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-3)] font-semibold text-amber-300 mb-0.5">
                      Mandatory Training Required
                    </p>
                    <p className="text-[11px] text-amber-400/70 leading-relaxed">
                      This certification requires completing an official training course before you can sit the exam.
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-[var(--border)]" />

              {/* Quick stats summary */}
              <div className="space-y-3">
                {[
                  { label: 'Total Questions', value: formatQuestions(cert.total_questions) },
                  { label: 'Exam Duration',   value: formatDuration(cert.exam_duration_minutes) },
                  { label: 'Exam Cost',        value: formatDualCost(cert.cost_inr, cert.cost_usd) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-3)]">{label}</span>
                    <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
                  </div>
                ))}
              </div>

              {/* CTA - min-h-[44px] for fat-finger safety */}
              <div className="mt-1 w-full flex items-center gap-2">
                <Link
                  href={`/tools/roi?cert=${cert.slug}`}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    min-h-[44px] py-3 px-4
                    rounded-xl bg-[var(--text)] text-[var(--bg)] text-sm font-bold
                    hover:bg-[var(--text-2)] active:bg-[var(--text-3)]
                    transition-colors
                  "
                >
                  Calculate ROI
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <button
                  onClick={() => {
                    router.push(`/tools/compare?cert1=${cert.slug}`);
                  }}
                  className="
                    flex items-center justify-center
                    min-h-[44px] px-4
                    rounded-xl bg-transparent text-[var(--text)]
                    border border-[var(--border-accent)]
                    hover:bg-[var(--bg-surface)] active:bg-[var(--bg-alt)]
                    transition-colors
                  "
                  title="Compare with another cert"
                >
                  <Scale size={18} className="text-[var(--accent)]" />
                </button>
              </div>

            </div>
          </aside>

          {/*  LEFT COLUMN - Narrative + Charts 
              order-last on mobile (appears below logistics card)
              lg:col-span-2 on desktop (takes 2/3 width)
           */}
          <div className="w-full order-last lg:order-first lg:col-span-2 space-y-5 md:space-y-6">

            {/* What is it? */}
            {cert.overview && (
              <section className="p-4 md:p-6 rounded-2xl glass">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
                    What is it?
                  </h2>
                </div>
                <p className="text-[var(--text)] text-sm md:text-[15px] leading-[1.8] font-normal">
                  {cert.overview}
                </p>
              </section>
            )}

            {/* Eligibility & Prerequisites */}
            {cert.eligibility && (
              <section className="p-4 md:p-6 rounded-2xl bg-amber-500/[0.04] border border-amber-500/[0.15]">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400/80">
                    Eligibility &amp; Prerequisites
                  </h2>
                </div>
                <p className="text-[var(--text-2)] text-sm md:text-[14px] leading-[1.8] whitespace-pre-wrap">
                  {cert.eligibility}
                </p>
              </section>
            )}

            {/* Target Job Roles */}
            {cert.job_roles && cert.job_roles.length > 0 && (
              <section className="p-4 md:p-6 rounded-2xl glass">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-4 h-4 text-orange-400 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
                    Target Job Roles
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cert.job_roles.map((role, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[13px] font-medium text-[var(--text-2)]">
                      {role}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Skills Measured */}
            {cert.skills_measured && cert.skills_measured.length > 0 && (
              <section className="p-4 md:p-6 rounded-2xl glass">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-4 h-4 text-violet-400 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
                    Skills Measured
                  </h2>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cert.skills_measured.map((skill, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 mt-2 flex-shrink-0" />
                      <span className="text-[14px] text-[var(--text-2)] leading-relaxed">{skill}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/*  Market Context Charts  */}
            <section>
              {/* Section divider label */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)] px-2 whitespace-nowrap">
                  Market Context
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {/*
                Charts grid:
                Mobile:  1 column - each chart gets full width, no overflow
                Tablet+: 1 column taking up the full width for the AreaChart
              */}
              <div className="grid grid-cols-1 gap-4">
                <CertROICurve
                  title="5-Year Projected Value Trajectory"
                  costValue={costValue || 0}
                  hikePercent={cert.median_roi_percent || getMockHikePercent(cert.difficulty_level)}
                  color="var(--brand-primary)"
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
