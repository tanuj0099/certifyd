import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Copy, Check, Zap, ChevronDown, RefreshCw } from 'lucide-react'
import { callGroqForPitch } from '../services/aiService.jsx'

const F_HEAD = "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif"
const F_MONO = "'Commit Mono', 'JetBrains Mono', monospace"
const F_BODY = "'Inter', sans-serif"
const T = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

// ── Tone definitions ──────────────────────────────────────
const TONES = [
  {
    id:    'formal',
    label: 'Formal',
    desc:  'Professional, polished',
    color: '#6366F1',
    prefix: `Write a formal, professional email. Use measured language, no contractions. Lead with the business case first, then personal request. Sign off formally.`,
  },
  {
    id:    'direct',
    label: 'Direct',
    desc:  'No fluff, straight ask',
    color: '#10B981',
    prefix: `Write a direct, confident email. Get to the point in the first line. No pleasantries, no padding. The ask is in sentence two. Short paragraphs, punchy.`,
  },
  {
    id:    'data',
    label: 'Data-Heavy',
    desc:  'Numbers & ROI first',
    color: '#F59E0B',
    prefix: `Write a data-driven email. Open with hard numbers (cost, expected ROI, India job market stats). Every paragraph should have at least one quantified claim. The manager should feel the financial logic is undeniable.`,
  },
]

const buildPitchPrompt = ({ certName, salary, certCost, hikePercent, name, company, role, tonePrefix }) => `
You are a professional email writer helping an Indian tech professional pitch their certification to their manager.

${tonePrefix}

Person: ${name || 'Professional'}
Current role: ${role || 'Software Engineer'}
Company: ${company || 'their company'}
Certification: ${certName}
Current salary: ₹${salary}L/yr
Cert cost: ₹${(certCost * 100000).toLocaleString('en-IN')}
Expected hike after cert: ${hikePercent}%

Rules:
- Subject line first, then email body
- India-specific: mention Naukri/LinkedIn demand signal, staying with company post-cert
- Length: under 200 words total
- Format: Subject: [subject line] then blank line then email body
- No "I hope this email finds you well"
- End with: Best regards, ${name || '[Your Name]'}
`

const PitchBoss = ({ certName, salary, certCost, hikePercent, name, mode }) => {
  const [open,     setOpen]     = useState(false)
  const [company,  setCompany]  = useState('')
  const [role,     setRole]     = useState('')
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [error,    setError]    = useState(null)
  const [tone,     setTone]     = useState('formal')

  // Only show for professional and switcher
  if (mode === 'student') return null

  const activeTone = TONES.find(t => t.id === tone) || TONES[0]

  const handleGenerate = async () => {
    setLoading(true); setError(null); setEmail('')
    try {
      const text = await callGroqForPitch(null, buildPitchPrompt({
        certName, salary, certCost, hikePercent, name, company, role,
        tonePrefix: activeTone.prefix,
      }))
      setEmail(text)
    } catch (e) {
      setError(e.message || 'Failed to generate. Check API connection.')
    } finally { setLoading(false) }
  }

  // Change tone + auto-regenerate if email already exists
  const handleTone = async (newTone) => {
    setTone(newTone)
    if (email) {
      setLoading(true); setError(null); setEmail('')
      const selected = TONES.find(t => t.id === newTone) || TONES[0]
      try {
        const text = await callGroqForPitch(null, buildPitchPrompt({
          certName, salary, certCost, hikePercent, name, company, role,
          tonePrefix: selected.prefix,
        }))
        setEmail(text)
      } catch (e) {
        setError(e.message || 'Failed to generate.')
      } finally { setLoading(false) }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [subject, ...bodyLines] = email.split('\n')
  const body = bodyLines.join('\n').trim()

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '9px 14px', borderRadius: '9px', background: open ? 'rgba(129,140,248,0.1)' : 'var(--surface)', border: `1px solid ${open ? 'rgba(129,140,248,0.3)' : 'var(--border)'}`, color: open ? '#818CF8' : 'var(--text-3)', fontSize: '12px', cursor: 'pointer', fontFamily: F_BODY, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.18s' }}
      >
        <Mail size={13} />
        Pitch My Boss
        <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6, fontFamily: F_MONO }}>get company to pay</span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={T} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px', marginTop: '8px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid rgba(129,140,248,0.2)' }}>

              <div style={{ fontFamily: F_MONO, fontSize: '9px', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={10} /> AI EMAIL GENERATOR · {certName?.toUpperCase()}
              </div>

              {/* Tone toggles */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  Email Tone
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TONES.map(t => {
                    const active = tone === t.id
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => handleTone(t.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: '9px', cursor: 'pointer',
                          background: active ? t.color + '14' : 'transparent',
                          border: '1px solid ' + (active ? t.color + '40' : 'var(--border)'),
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                          gap: '2px', transition: 'all 0.16s',
                        }}
                      >
                        <span style={{ fontFamily: F_HEAD, fontWeight: '700', fontSize: '12px', color: active ? t.color : 'var(--text-3)' }}>
                          {t.label}
                        </span>
                        <span style={{ fontFamily: F_MONO, fontSize: '9px', color: active ? t.color + 'AA' : 'var(--text-4)', letterSpacing: '0.04em' }}>
                          {t.desc}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Optional inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Company (optional)</div>
                  <input
                    value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Infosys"
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', fontFamily: F_BODY, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#818CF855'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Role (optional)</div>
                  <input
                    value={role} onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Dev"
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', fontFamily: F_BODY, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#818CF855'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px', color: '#EF4444', fontFamily: F_BODY, marginBottom: '10px' }}>
                  {error}
                </div>
              )}

              {!email && !loading && (
                <motion.button
                  onClick={handleGenerate}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '11px', borderRadius: '9px', background: 'linear-gradient(135deg,' + activeTone.color + ',hsl(from ' + activeTone.color + ' h s 35%))', border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: F_HEAD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', letterSpacing: '-0.01em' }}
                >
                  <Zap size={14} /> Generate {activeTone.label} Pitch Email
                </motion.button>
              )}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + activeTone.color, borderTopColor: 'transparent' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: F_BODY }}>Writing your {activeTone.label.toLowerCase()} pitch...</span>
                </div>
              )}

              {email && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={T}>
                  {/* Subject */}
                  {subject?.startsWith('Subject:') && (
                    <div style={{ padding: '9px 12px', borderRadius: '8px', background: activeTone.color + '12', border: '1px solid ' + activeTone.color + '28', marginBottom: '10px' }}>
                      <div style={{ fontSize: '9px', color: activeTone.color, fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Subject</div>
                      <div style={{ fontSize: '13px', color: 'var(--text)', fontFamily: F_HEAD, fontWeight: '700' }}>{subject.replace('Subject:', '').trim()}</div>
                    </div>
                  )}

                  {/* Body */}
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: '10px' }}>
                    <pre style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: F_BODY, lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {body || email}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      onClick={handleCopy}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, padding: '9px', borderRadius: '8px', background: copied ? 'rgba(16,185,129,0.1)' : 'var(--surface)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, color: copied ? '#10B981' : 'var(--text-2)', fontSize: '12px', cursor: 'pointer', fontFamily: F_BODY, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy Email'}
                    </motion.button>
                    <button
                      onClick={() => { setEmail(''); setError(null) }}
                      style={{ padding: '9px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-4)', fontSize: '12px', cursor: 'pointer', fontFamily: F_BODY, display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PitchBoss