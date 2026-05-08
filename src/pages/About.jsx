import { motion } from 'framer-motion'
import { ArrowRight, Database, ShieldCheck, Sparkles, Mail } from 'lucide-react'
import MarketingPageShell, { GlassCard, PillButton, StatCard } from '../components/MarketingPageShell.jsx'

const FB = "'Inter','DM Sans',sans-serif"
const FH = "'EB Garamond','Cormorant Garamond',Georgia,serif"
const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const T = { duration: 0.34, ease: [0.16, 1, 0.3, 1] }

const DATA_SOURCES = [
  { source: 'LinkedIn India', detail: 'Role, city, and salary benchmarks', updated: 'Q1 2026' },
  { source: 'NASSCOM', detail: 'Domain demand and hiring signals', updated: '2026 survey' },
  { source: 'Naukri', detail: 'Active job postings and keyword counts', updated: 'Monthly' },
  { source: 'AmbitionBox', detail: 'Self-reported hike outcomes', updated: 'Continuous' },
]

const PRINCIPLES = [
  {
    title: 'Median, not fantasy',
    body: 'We use medians because averages get distorted by outliers. The goal is decision support, not hype.',
  },
  {
    title: 'India-first context',
    body: 'Every estimate is calibrated for Indian cities, Indian compensation norms, and Indian hiring signals.',
  },
  {
    title: 'No affiliate pressure',
    body: 'We do not earn money when you choose a cert. That keeps the recommendation honest, including when the answer is no.',
  },
  {
    title: 'Useful, not vague',
    body: 'We would rather give you a concrete payback period than a polished paragraph that says "it depends."',
  },
]

export default function AboutPage() {
  return (
    <MarketingPageShell
      eyebrow="ABOUT"
      title="Why CertifyROI"
      accent="exists"
      subtitle="We built CertifyROI to answer the question every professional eventually asks: will this certification actually pay for itself in my city, at my current salary, and in my real career path?"
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={T} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <GlassCard style={{ padding: 'clamp(22px, 4vw, 36px)' }}>
            <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              The honest version
            </div>
            <p style={{ fontFamily: FH, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', lineHeight: 1.08, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 16px' }}>
              Cert decisions should feel like arithmetic, not guesswork.
            </p>
            <p style={{ fontFamily: FB, fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.85', margin: '0 0 14px' }}>
              Most certification advice is written for clicks, not for the person paying the fee.
              We looked at the gap between the generic internet answer and the real one, then built
              a tool that shows break-even, salary lift, and city demand in one place.
            </p>
            <p style={{ fontFamily: FB, fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.85', margin: 0 }}>
              The result is a calmer way to decide: less FOMO, more signal.
            </p>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <StatCard label="What we optimize for" value="Payback clarity" detail="If the cert cannot justify itself, we say so." accent="var(--indigo)" />
            <StatCard label="Audience" value="India-first professionals" detail="Students, switchers, and experienced professionals." accent="var(--gold)" />
          </div>
        </div>

        <div>
          <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            What we believe
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {PRINCIPLES.map((item) => (
              <GlassCard key={item.title} style={{ padding: '20px' }}>
                <div style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: '10px' }}>
                  {item.title}
                </div>
                <p style={{ fontFamily: FB, fontSize: '13px', lineHeight: '1.75', color: 'var(--text-3)', margin: 0 }}>
                  {item.body}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Data sources
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
            {DATA_SOURCES.map((item) => (
              <GlassCard key={item.source} style={{ padding: '18px' }}>
                <div style={{ fontFamily: FH, fontSize: '13px', fontWeight: '800', color: 'var(--text)', marginBottom: '6px' }}>
                  {item.source}
                </div>
                <div style={{ fontFamily: FB, fontSize: '12px', lineHeight: '1.7', color: 'var(--text-3)', marginBottom: '8px' }}>
                  {item.detail}
                </div>
                <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--indigo)', letterSpacing: '0.08em' }}>
                  Updated: {item.updated}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <GlassCard style={{ padding: 'clamp(20px, 4vw, 32px)', background: 'var(--bg)', borderColor: 'var(--border-accent)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
                The outcome
              </div>
              <p style={{ fontFamily: FH, fontSize: 'clamp(1.9rem, 4vw, 3rem)', lineHeight: 0.98, letterSpacing: '-0.03em', color: 'var(--bg)', margin: '0 0 14px' }}>
                You should know the answer before you pay the exam fee.
              </p>
              <p style={{ fontFamily: FB, fontSize: '14px', lineHeight: '1.8', color: 'var(--text-2)', margin: 0 }}>
                CertifyROI is built to make that answer visible, explainable, and fast to evaluate.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
              <PillButton href="/app" wide>
                Calculate ROI <ArrowRight size={15} />
              </PillButton>
              <a href="mailto:hello@certifyroi.in" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none' }}>
                <Mail size={14} /> hello@certifyroi.in
              </a>
            </div>
          </div>
        </GlassCard>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <ShieldCheck size={14} color="var(--indigo)" />
            <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)' }}>No affiliate links. No sponsored picks.</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <Sparkles size={14} color="var(--gold)" />
            <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)' }}>Built for clarity, not noise.</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <Database size={14} color="var(--indigo)" />
            <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)' }}>Median-based India data.</span>
          </div>
        </div>
      </motion.div>
    </MarketingPageShell>
  )
}
