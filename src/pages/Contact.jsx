import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock3, Mail, MapPin, MessageSquare, Sparkles } from 'lucide-react'
import MarketingPageShell, { GlassCard, PillButton } from '../components/MarketingPageShell.jsx'

const FB = "'Inter','DM Sans',sans-serif"
const FH = "'EB Garamond','Cormorant Garamond',Georgia,serif"
const FM = "'JetBrains Mono','IBM Plex Mono',monospace"
const T = { duration: 0.34, ease: [0.16, 1, 0.3, 1] }

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: 'General feedback', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    window.setTimeout(() => {
      setSubmitted(false)
      setFormState({ name: '', email: '', subject: 'General feedback', message: '' })
    }, 3000)
  }

  return (
    <MarketingPageShell
      eyebrow="CONTACT"
      title="Talk to"
      accent="us"
      subtitle="Questions, bug reports, data corrections, or partnership enquiries all belong here. We read every message."
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={T}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', alignItems: 'start' }}>
          <GlassCard style={{ padding: 'clamp(22px, 4vw, 34px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <MessageSquare size={18} color="var(--accent)" />
              <h2 style={{ fontFamily: FH, fontSize: 'clamp(1.3rem, 2vw, 1.7rem)', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                Send a message
              </h2>
            </div>

            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--picton-dim)',
                  border: '1px solid var(--border-accent)',
                }}
              >
                <div style={{ fontFamily: FH, fontSize: '18px', fontWeight: '800', color: 'var(--accent)', marginBottom: '8px' }}>
                  Message received
                </div>
                <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.8', margin: 0 }}>
                  Thanks. We will get back to you at the email you provided.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label htmlFor="name-input" style={{ display: 'block', fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Name
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontFamily: FB,
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.boxShadow = '0 0 0 4px var(--picton-dim)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="email-input" style={{ display: 'block', fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Email
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontFamily: FB,
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.boxShadow = '0 0 0 4px var(--picton-dim)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="subject-select" style={{ display: 'block', fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Subject
                  </label>
                  <select
                    id="subject-select"
                    value={formState.subject}
                    onChange={(e) => setFormState((prev) => ({ ...prev, subject: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontFamily: FB,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option>General feedback</option>
                    <option>Data correction</option>
                    <option>Bug report</option>
                    <option>Partnership / B2B</option>
                    <option>Press enquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message-textarea" style={{ display: 'block', fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    Message
                  </label>
                  <textarea
                    id="message-textarea"
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us what is on your mind..."
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontFamily: FB,
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '140px',
                      transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.boxShadow = '0 0 0 4px var(--picton-dim)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '4px' }}>
                  <PillButton type="submit">
                    Send Message <ArrowRight size={15} />
                  </PillButton>
                </div>
              </form>
            )}
          </GlassCard>

          <div style={{ display: 'grid', gap: '14px' }}>
            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Mail size={18} color="var(--accent)" />
                <h3 style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', margin: 0 }}>Email</h3>
              </div>
              <a href="mailto:hello@certifyroi.in" style={{ fontFamily: FB, fontSize: '15px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '700' }}>
                hello@certifyroi.in
              </a>
              <p style={{ fontFamily: FB, fontSize: '13px', lineHeight: '1.75', color: 'var(--text-3)', margin: '8px 0 0' }}>
                We usually reply within 24 business hours.
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <MapPin size={18} color="var(--gold)" />
                <h3 style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', margin: 0 }}>Location</h3>
              </div>
              <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8', margin: 0 }}>
                Bangalore, Karnataka, India
              </p>
              <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-4)', lineHeight: '1.7', margin: '8px 0 0' }}>
                Remote-first. No office visits needed.
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Clock3 size={18} color="var(--accent)" />
                <h3 style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', margin: 0 }}>Response times</h3>
              </div>
              <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8', margin: 0 }}>
                Monday to Friday: 24 hours
              </p>
              <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.8', margin: '4px 0 0' }}>
                Weekends: 48 hours
              </p>
            </GlassCard>

            <GlassCard style={{ padding: '22px', background: 'var(--text)', borderColor: 'var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Sparkles size={18} color="var(--bg)" />
                <h3 style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', color: 'var(--bg)', margin: 0 }}>Need a faster answer?</h3>
              </div>
              <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.8', margin: '0 0 16px' }}>
                If you are asking which cert to take next, the ROI calculator is usually the fastest route.
              </p>
              <PillButton href="/app">
                Open Tools <ArrowRight size={15} />
              </PillButton>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </MarketingPageShell>
  )
}
