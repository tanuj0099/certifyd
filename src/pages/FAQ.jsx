// ─────────────────────────────────────────────────────────
// FAQ.jsx — Frequently Asked Questions
// ─────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, HelpCircle, Mail } from 'lucide-react'
import MarketingPageShell from '../components/MarketingPageShell.jsx'

const F_HEAD = "'Inter', sans-serif"
const F_BODY = "'Inter', sans-serif"
const F_MONO = "'JetBrains Mono', monospace"

const FAQS = [
  {
    q: 'How accurate are the salary projections?',
    a: 'We use median salary data from Naukri, AmbitionBox, LinkedIn India, and NASSCOM. Our projections are based on 40,000+ India-specific data points. However, actual outcomes vary based on company tier, negotiation skills, and economic conditions. We show medians, not guarantees — half of people earn more, half earn less.',
  },
  {
    q: 'Is CertifyROI free to use?',
    a: 'Yes, the core ROI calculator is completely free. You get 3 free analyses as a guest. After that, you can sign in with Google or phone OTP to continue using the tool for free. We never sell your data.',
  },
  {
    q: 'What certifications does CertifyROI cover?',
    a: 'We cover 100+ certifications across 17 domains: Cloud (AWS, Azure, GCP), Data Science, Cybersecurity, Finance (CA, CFA, FRM), Project Management (PMP, CSM), Marketing, HR, Medical, Law, Architecture, Government exams (UPSC, SSC), and more.',
  },
  {
    q: 'How do I interpret the ROI percentage?',
    a: 'ROI % = (5-year net gain / certification cost) × 100. A 300% ROI means you earn ₹3 for every ₹1 invested over 5 years. Higher is better. Generally, anything above 200% is considered a strong investment.',
  },
  {
    q: 'What is Student Mode?',
    a: 'Student Mode is for freshers or career switchers with no current salary. Instead of calculating a salary hike percentage, it shows time-to-first-offer and expected starting salary after certification. Built for where you actually are.',
  },
  {
    q: 'Does CertifyROI sell certifications or courses?',
    a: 'No. We don\'t sell courses, have no affiliate deals with Coursera/Udemy, and earn nothing if you buy a cert. Our only incentive is to give you honest numbers — including when a certification is NOT worth it for your profile.',
  },
  {
    q: 'How often is the data updated?',
    a: 'Salary data is updated quarterly. Demand scores update monthly based on live job posting counts from Naukri and LinkedIn. Certification costs are verified annually against official certification body websites.',
  },
  {
    q: 'Can I use CertifyROI to convince my boss to fund my certification?',
    a: 'Yes! Our "Pitch Your Boss" feature generates a one-page ROI brief you can send to your manager. It includes break-even timeline, expected salary delta, and market demand data — perfect for funding requests.',
  },
  {
    q: 'What if my city is not in the database?',
    a: 'We use a Haversine nearest-match algorithm. If your city isn\'t one of the 8 metros (Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai, Kolkata, Ahmedabad), we calculate geographic distance and show data for the nearest match.',
  },
  {
    q: 'Is my resume data stored?',
    a: 'No. Resume text is processed in real-time for AI analysis and is never stored on our servers. We do not sell personal data. See our Privacy Policy for full details.',
  },
]

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="glass"
      style={{
        padding: '20px 24px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: '16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left', padding: 0,
        }}
      >
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'var(--text)', color: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: '2px',
        }}>
          <HelpCircle size={14} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: F_HEAD, fontSize: '15px', fontWeight: '600',
            color: 'var(--text)', lineHeight: '1.4', marginBottom: open ? '12px' : '8px',
          }}>
            {q}
          </div>
          {open && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                fontFamily: F_BODY, fontSize: '14px', color: 'var(--text-2)',
                lineHeight: '1.75', margin: 0,
              }}
            >
                {a}
            </motion.p>
          )}
        </div>
        <ChevronDown
          size={18}
          color="var(--text-3)"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s var(--ease-out)',
          }}
        />
      </button>
    </motion.div>
  )
}

export default function FAQPage() {
  return (
    <MarketingPageShell
      eyebrow="FAQ"
      title="Frequently Asked"
      accent="Questions"
      subtitle="Everything you need to know about CertifyROI, salary data, and certification decisions."
    >
      <div style={{
        maxWidth: '800px', margin: '0 auto',
        padding: '0 0 12px',
      }}>
        {/* FAQ List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} {...faq} index={i} />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass"
          style={{
            marginTop: '48px', padding: '28px 32px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <p style={{
            fontFamily: F_BODY, fontSize: '14px', color: 'var(--text-2)',
            marginBottom: '16px',
          }}>
            Still have questions? We're here to help.
          </p>
          <a
            href="mailto:hello@certifyroi.in"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', borderRadius: 'var(--radius-md)',
              background: 'var(--text)', color: 'var(--bg)',
              fontFamily: F_HEAD, fontSize: '13px', fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <Mail size={16} /> hello@certifyroi.in
          </a>
        </motion.div>
      </div>
    </MarketingPageShell>
  )
}
