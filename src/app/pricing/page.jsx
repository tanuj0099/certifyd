'use client';

import { motion } from 'framer-motion'
import { Check, Zap, Shield, Headphones } from 'lucide-react'
import MarketingPageShell from '@/components/MarketingPageShell.jsx'

const F_HEAD = "var(--font-head)";
const F_BODY = "var(--font-body)";
const F_MONO = "var(--font-mono)";

const FREE_FEATURES = [
  'Live ROI calculator with break-even timelines',
  '3 free analyses as guest (unlimited after sign-in)',
  'AI-powered resume analysis',
  'City-specific salary data (8 metros)',
  'Market demand scores from Naukri + LinkedIn',
  'Loss aversion charts (5-year projection)',
  'Student Mode for freshers',
  'Hike Verifier tool',
  'Pitch Your Boss generator',
  'No credit card required',
  'We never sell your data',
]

const WHY_FREE = [
  {
    icon: Shield,
    title: 'No affiliate deals',
    desc: "We don't earn commissions from certification sales. Our only incentive is honest numbers.",
  },
  {
    icon: Zap,
    title: 'Built from frustration',
    desc: 'I wasted 2 months building a spreadsheet because no one gave me straight answers. This tool is that spreadsheet, scaled.',
  },
  {
    icon: Headphones,
    title: 'Free because it should be',
    desc: 'Career decisions are too important to gatekeep behind paywalls. Everyone deserves access to real data.',
  },
]

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="PRICING"
      title="Free Forever"
      accent="No Catch"
      subtitle="Certify is completely free. Sign in with Google or phone OTP after 3 guest analyses to continue using all features at no cost."
    >
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 0 12px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass"
          style={{
            padding: '32px 40px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '48px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={20} color="var(--bg)" strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{
                fontFamily: F_HEAD,
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text)',
                margin: 0,
                lineHeight: 1.1,
              }}>
                Everything is free
              </h2>
              <p style={{
                fontFamily: F_MONO,
                fontSize: '11px',
                color: 'var(--text-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: 0,
              }}>
                All features - Unlimited use after sign-in
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
          }}>
            {FREE_FEATURES.map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Check
                  size={18}
                  color="var(--accent)"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <span style={{
                  fontFamily: F_BODY,
                  fontSize: '14px',
                  color: 'var(--text-2)',
                  lineHeight: 1.5,
                }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <a href="/" className="btn-primary">
              Start Free Analysis
            </a>
            <a
              href="/features"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-2)',
                fontFamily: F_BODY,
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              See All Features
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ marginBottom: '32px' }}
        >
          <p style={{
            fontFamily: F_MONO,
            fontSize: '11px',
            color: 'var(--text-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            Why is this free?
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {WHY_FREE.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="glass"
                  style={{
                    padding: '24px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Icon size={18} color="var(--text-2)" strokeWidth={2} />
                  </div>
                  <h3 style={{
                    fontFamily: F_HEAD,
                    fontSize: '22px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    marginBottom: '8px',
                    lineHeight: 1.2,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: F_BODY,
                    fontSize: '13px',
                    color: 'var(--text-3)',
                    lineHeight: '1.65',
                    margin: 0,
                  }}>
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
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
