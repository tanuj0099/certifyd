import { motion } from 'framer-motion'
import { Check, Zap, Star, Linkedin, Briefcase, Route } from 'lucide-react'
import MarketingPageShell from '../components/MarketingPageShell.jsx'

const F_HEAD = "'EB Garamond','Cormorant Garamond',Georgia,serif"
const F_BODY = "'Inter','DM Sans',sans-serif"
const F_MONO = "'JetBrains Mono', monospace"

const PLANS = {
  free: {
    name: 'Free',
    price: '₹0',
    desc: 'For professionals running their first few analyses.',
    features: [
      'Live ROI calculator',
      '5 AI-powered ROI analyses per month',
      'City-specific salary data (8 metros)',
      'Market demand scores',
      'Student Mode for freshers',
    ],
    cta: 'Start for Free',
    href: '/app',
  },
  pro: {
    name: 'Pro',
    price: '₹299',
    pricePeriod: '/mo',
    desc: 'For professionals serious about their next career move.',
    features: [
      'Everything in Free, plus:',
      'Unlimited AI-powered ROI analyses',
      'Shareable LinkedIn result cards',
      'AI "Pitch Your Boss" reimbursement generator',
      'Career Path Simulator (multi-cert planning)',
      'Study journey tracker',
    ],
    cta: 'Upgrade to Pro',
    href: '/app/upgrade', // Placeholder for upgrade flow
    isPrimary: true,
  },
}

function PlanCard({ plan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass"
      style={{
        padding: '32px 32px',
        border: plan.isPrimary ? '1px solid var(--border-accent)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <h2 style={{ fontFamily: F_HEAD, fontSize: '28px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>
        {plan.name}
      </h2>
      <p style={{ fontFamily: F_BODY, fontSize: '14px', color: 'var(--text-3)', margin: '4px 0 20px' }}>
        {plan.desc}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
        <span style={{ fontFamily: F_HEAD, fontSize: '44px', fontWeight: '700', color: 'var(--text)' }}>{plan.price}</span>
        {plan.pricePeriod && <span style={{ fontFamily: F_MONO, fontSize: '13px', color: 'var(--text-4)' }}>{plan.pricePeriod}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {plan.features.map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Check size={16} color={plan.isPrimary ? 'var(--accent)' : 'var(--text-3)'} style={{ flexShrink: 0, marginTop: '3px' }} />
            <span style={{ fontFamily: F_BODY, fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      <a href={plan.href} className={plan.isPrimary ? 'btn-primary' : 'btn-ghost'} style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}>
        {plan.cta}
      </a>
    </motion.div>
  )
}

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="PRICING"
      title="Find your"
      accent="edge"
      subtitle="Start for free, then upgrade to unlock powerful tools for career planning and negotiation. Simple, transparent pricing."
    >
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 0 12px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          <PlanCard plan={PLANS.free} />
          <PlanCard plan={PLANS.pro} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'var(--picton-dim)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: 'none',
          }} />
          <div className="mono-tag" style={{ fontFamily: F_MONO, fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.06em' }}>
            Data: Q1 2026 - LinkedIn India - NASSCOM - Naukri - AmbitionBox
          </div>
        </motion.div>
      </div>
    </MarketingPageShell>
  )
}
