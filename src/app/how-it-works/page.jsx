'use client';

import { motion } from 'framer-motion'
import { Database, Upload, FileCheck, ArrowRight, TrendingUp } from 'lucide-react'
import MarketingPageShell from '@/components/MarketingPageShell.jsx'

const F_HEAD = "var(--font-head)";
const F_BODY = "var(--font-body)";
const F_MONO = "var(--font-mono)";

const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload your resume or set your profile',
    body: 'Tell us your current salary, city, and target certification. The more specific you are, the more accurate our analysis becomes. You can skip the resume and enter details manually if you prefer.',
    color: 'var(--indigo)',
  },
  {
    num: '02',
    icon: Database,
    title: 'We run the numbers against real India data',
    body: 'We cross-reference your salary bracket against city-specific hike data from Naukri, AmbitionBox, and LinkedIn India. We calculate break-even using your actual cert cost, not a generic estimate. We factor in market demand using live job posting counts.',
    color: '#51B1E7',
  },
  {
    num: '03',
    icon: FileCheck,
    title: 'Get a specific, bounded answer',
    body: 'Break-even to the month. 5-year net gain in rupees. Monthly salary delta from day one. An AI verdict on whether the cert makes sense for your profile. Not "it depends." An actual number.',
    color: 'var(--accent)',
  },
  {
    num: '04',
    icon: TrendingUp,
    title: "Verify your hike or pitch your boss",
    body: 'Use our Hike Verifier to check if your employer\'s offer is fair. Or generate a one-page brief to convince your manager to fund your certification. Both tools are included.',
    color: 'var(--gold)',
  },
]

function StepCard({ step, index, isLast }) {
  const Icon = step.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        paddingBottom: isLast ? '0' : '32px',
        marginBottom: isLast ? '0' : '32px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        position: 'relative',
      }}
    >
      <div style={{
        fontFamily: F_MONO,
        fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        color: step.color,
        fontWeight: '800',
        letterSpacing: '-0.04em',
        opacity: 0.4,
        flexShrink: 0,
        lineHeight: 1,
        paddingTop: '2px',
      }}>
        {step.num}
      </div>

      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: step.color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={step.color} strokeWidth={2} />
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{
          fontFamily: F_HEAD,
          fontWeight: '700',
          fontSize: '24px',
          color: 'var(--text)',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {step.title}
        </h3>
        <p style={{
          fontFamily: F_BODY,
          fontSize: '14px',
          color: 'var(--text-3)',
          lineHeight: '1.7',
          margin: 0,
        }}>
          {step.body}
        </p>
      </div>

      {!isLast && (
        <ArrowRight
          size={18}
          color="var(--text-4)"
          style={{
            position: 'absolute',
            right: '0',
            bottom: '32px',
            transform: 'rotate(90deg)',
          }}
        />
      )}
    </motion.div>
  )
}

export default function HowItWorksPage() {
  return (
    <MarketingPageShell
      eyebrow="HOW IT WORKS"
      title="From Uncertainty"
      accent="to Clarity"
      subtitle="Four steps from uncertainty to a data-backed certification decision."
    >
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 0 12px',
      }}>
        <div>
          {STEPS.map((step, i) => (
            <StepCard key={i} step={step} index={i} isLast={i === STEPS.length - 1} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass"
          style={{
            marginTop: '32px',
            padding: '24px 28px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <p style={{
            fontFamily: F_MONO,
            fontSize: '11px',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px',
          }}>
            Under the hood
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
          }}>
            {[
              { label: 'Inference', value: 'Groq LPU  llama-3.3-70b', desc: 'Sub-2-second resume analysis' },
              { label: 'Salary data', value: '40,000+ India data points', desc: 'City-specific, not national' },
              { label: 'Coverage', value: '103 certs  17 domains', desc: 'Updated when demand changes' },
              { label: 'City model', value: 'Haversine nearest-match', desc: 'Geographic distance calculation' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{
                  fontFamily: F_MONO,
                  fontSize: '9px',
                  color: 'var(--text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '5px',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: F_HEAD,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text)',
                  marginBottom: '5px',
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontFamily: F_BODY,
                  fontSize: '12px',
                  color: 'var(--text-4)',
                  lineHeight: '1.5',
                }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <a href="/" className="btn-primary">
            Start Your Analysis
          </a>
          <a
            href="/faq"
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
            FAQ
          </a>
        </motion.div>
      </div>
    </MarketingPageShell>
  )
}
