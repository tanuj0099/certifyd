'use client';

import { motion } from 'framer-motion'
import {
  TrendingUp, FileText, MapPin, Shield, Zap,
  BarChart3, Users, Clock, CheckCircle2, Target
} from 'lucide-react'
import MarketingPageShell from '@/components/MarketingPageShell.jsx'

const F_HEAD = "var(--font-head)";
const F_BODY = "var(--font-body)";
const F_MONO = "var(--font-mono)";

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Live ROI Calculator',
    desc: 'Real-time salary hike projections based on your current salary, certification cost, and expected hike percentage. See break-even timelines to the month.',
    color: 'var(--accent)',
  },
  {
    icon: MapPin,
    title: 'City-Specific Data',
    desc: "Salary data tailored to Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai, Kolkata, and Ahmedabad. Not national averages, your actual market.",
    color: 'var(--gold)',
  },
  {
    icon: Shield,
    title: 'Loss Aversion Chart',
    desc: 'Visualize "With Certification" vs "Inaction" scenarios over 5 years. See exactly how much you lose by not acting, not just what you gain.',
    color: 'var(--err)',
  },
  {
    icon: Zap,
    title: 'Student Mode',
    desc: 'No current salary? Student Mode calculates time-to-first-offer and expected starting salary after certification. Built for freshers and career switchers.',
    color: 'var(--gold)',
  },
  {
    icon: BarChart3,
    title: 'Market Demand Scores',
    desc: 'Live job posting counts from Naukri and LinkedIn. See which certifications employers are actively hiring for right now.',
    color: 'var(--accent)',
  },
  {
    icon: Users,
    title: 'Pitch Your Boss',
    desc: 'Generate a one-page ROI brief to convince your manager to fund your certification. Includes break-even, salary delta, and market demand data.',
    color: 'var(--gold-light)',
  },
  {
    icon: Clock,
    title: 'Hike Verifier',
    desc: "Compare your expected hike against actual market data. Know if your employer's offer is fair before you sign.",
    color: 'var(--accent-light)',
  },
  {
    icon: CheckCircle2,
    title: '100+ Certifications',
    desc: 'Across 17 domains: Cloud, Data Science, Cybersecurity, Finance, Project Management, Marketing, HR, Medical, Law, and more.',
    color: 'var(--accent)',
  },
  {
    icon: Target,
    title: 'Goal-Based Filtering',
    desc: 'Filter certifications by your goal: salary hike, job switch, career pivot, first job, promotion, or going abroad.',
    color: 'var(--gold)',
  },
]

function FeatureCard({ feature, index }) {
  const Icon = feature.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass"
      style={{
        padding: '24px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: feature.color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={feature.color} strokeWidth={2} />
      </div>
      <div>
        <h3 style={{
          fontFamily: F_HEAD, fontSize: '20px', fontWeight: '700',
          color: 'var(--text)', marginBottom: '8px', lineHeight: 1.2,
        }}>
          {feature.title}
        </h3>
        <p style={{
          fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-2)',
          lineHeight: '1.65', margin: 0,
        }}>
          {feature.desc}
        </p>
      </div>
    </motion.div>
  )
}

export default function FeaturesPage() {
  return (
    <MarketingPageShell
      eyebrow="FEATURES"
      title="Everything You Need"
      accent="To Decide"
      subtitle='Certifyd combines real India salary data with AI analysis to give you bounded, specific answers, not "it depends."'
    >
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '0 0 12px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {FEATURES.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            marginTop: '48px',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '8px',
            background: 'var(--picton-dim)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: 'none',
          }} />
          <span className="mono-tag" style={{
            fontFamily: F_MONO, fontSize: '11px',
            color: 'var(--accent)', letterSpacing: '0.06em',
          }}>
            Data: Q1 2026 - LinkedIn India - NASSCOM - Naukri - AmbitionBox
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{
            marginTop: '40px',
            display: 'flex', gap: '12px', flexWrap: 'wrap',
          }}
        >
          <a
            href="/"
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Start Your Analysis
          </a>
          <a
            href="/how-it-works"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-2)', fontFamily: F_BODY,
              fontSize: '13px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            How It Works
          </a>
        </motion.div>
      </div>
    </MarketingPageShell>
  )
}
