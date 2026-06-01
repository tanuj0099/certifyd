import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Copy, Check, ChevronDown, RefreshCw, Zap } from 'lucide-react'
import { callGroqForPitch } from '../services/aiService.jsx'

const F_HEAD = "var(--font-head)";
const F_MONO = "var(--font-mono)";
const F_BODY = "var(--font-body)";
const T = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
const EMERALD = 'var(--linear-blue)'
const VIOLET = 'var(--linear-blue)'
const AMBER = 'var(--cool-grey)'

//  Build a structured JSON prompt 
const buildCasePrompt = ({ certName, salary, certCost, hikePercent, name, company, role }) => `
You are a concise financial analyst helping an Indian tech professional build a reimbursement business case for their manager.

Person: ${name || 'the employee'}
Current role: ${role || 'Software Engineer'}
Company: ${company || 'their company'}
Certification: ${certName}
Current salary: ₹${salary}L/yr
Cert cost: ₹${(certCost * 100000).toLocaleString('en-IN')}
Expected salary hike post-cert: ${hikePercent}%

Respond in VALID JSON only, no markdown. Exactly this shape:
{
  "cost":        "<one line: total cost including exam fee, materials, and time off if applicable>",
  "companyGain": "<one line: specific skill or capability the company gets in-house - be concrete, not generic>",
  "timeCommit":  "<one line: realistic study hours per week and total weeks, with impact on work hours>",
  "roiStatement":"<one line: hard number - monthly salary cost increase vs. capability ROI, in rupees>",
  "demandNote":  "<one line: India job market signal - Naukri/LinkedIn demand stat for this cert if you know it>"
}
`

//  Render bullet with copy-able content 
function BulletRow({ icon, label, value, color }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: color + '18', border: '1px solid ' + color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <span style={{ fontSize: '13px' }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F_MONO, fontSize: '9px', color: color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontFamily: F_BODY, fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.55' }}>{value}</div>
      </div>
      <button
        onClick={handleCopy}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: copied ? EMERALD : 'var(--text-4)', flexShrink: 0, transition: 'color 0.2s' }}
        title="Copy this point"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  )
}

//  Copy-all formatted text 
function buildCopyText(bcase, certName, name) {
  return [
    `Reimbursement request - ${certName}`,
    '',
    `Cost: ${bcase.cost}`,
    `Company benefit: ${bcase.companyGain}`,
    `Time commitment: ${bcase.timeCommit}`,
    `ROI: ${bcase.roiStatement}`,
    `Market signal: ${bcase.demandNote}`,
    '',
    `- ${name || '[Your Name]'}`,
  ].join('\n')
}

const PitchBoss = ({ certName, salary, certCost, hikePercent, name, mode }) => {
  const [open, setOpen] = useState(false)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [bcase, setBcase] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  // Only show for professional track
  if (mode === 'student') return null

  const handleGenerate = async () => {
    setLoading(true); setError(null); setBcase(null)
    try {
      const raw = await callGroqForPitch(null, buildCasePrompt({
        certName, salary, certCost, hikePercent, name, company, role,
      }))
      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse structured response.')
      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.cost || !parsed.companyGain) throw new Error('Incomplete response - try again.')
      setBcase(parsed)
    } catch (e) {
      setError(e.message || 'Generation failed. Check API connection.')
    } finally { setLoading(false) }
  }

  const handleCopyAll = () => {
    if (!bcase) return
    navigator.clipboard.writeText(buildCopyText(bcase, certName, name))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '9px 14px', borderRadius: '9px', background: open ? 'transparent' : 'transparent', border: `1px solid ${open ? 'transparent' : 'var(--border)'}`, color: open ? VIOLET : 'var(--text-3)', fontSize: '12px', cursor: 'pointer', fontFamily: F_BODY, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.18s' }}
      >
        <Briefcase size={13} />
        Reimbursement Case
        <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.55, fontFamily: F_MONO }}>get company to pay</span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={T} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px', marginTop: '8px', borderRadius: '12px', background: 'transparent', border: '1px solid transparent' }}>
              {/* Removed glass-border */}
              <div style={{ fontFamily: F_MONO, fontSize: '9px', color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={9} /> REIMBURSEMENT BUSINESS CASE  {certName?.toUpperCase()}
              </div>

              {/* Callout: what this is */}
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', marginBottom: '14px' }}>
                <div style={{ fontFamily: F_BODY, fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.55' }}>
                  This generates <strong style={{ color: 'var(--text-2)' }}>4-5 hard-hitting bullet points</strong> based on your numbers - not a generic email. Copy the points you need and write the greeting yourself.
                </div>
              </div>

              {/* Optional context inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Company</div>
                  <input
                    value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Infosys"
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', fontFamily: F_BODY, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = VIOLET + '55'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: F_MONO, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Role</div>
                  <input
                    value={role} onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Dev"
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', fontFamily: F_BODY, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = VIOLET + '55'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', fontSize: '12px', color: 'var(--cool-grey)', fontFamily: F_BODY, marginBottom: '10px' }}>
                  {error}
                </div>
              )}

              {!bcase && !loading && (
                <motion.button
                  onClick={handleGenerate}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '11px', borderRadius: '9px', background: `transparent`, border: 'none', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: F_HEAD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', letterSpacing: '-0.01em', boxShadow: 'none' }}
                >
                  <Zap size={14} /> Build Reimbursement Case
                </motion.button>
              )}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${VIOLET}`, borderTopColor: 'transparent' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: F_BODY }}>Calculating business case...</span>
                </div>
              )}

              {bcase && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={T}>

                  {/* Instruction strip */}
                  <div style={{ fontFamily: F_MONO, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                    Copy the points you need  write the greeting in your own voice
                  </div>

                  {/* Bullets */}
                  <BulletRow icon="-" label="Cost" value={bcase.cost} color={AMBER} />
                  <BulletRow icon="-" label="Company Benefit" value={bcase.companyGain} color={VIOLET} />
                  <BulletRow icon="-" label="Time Commitment" value={bcase.timeCommit} color="#94A3B8" />
                  <BulletRow icon="-" label="ROI" value={bcase.roiStatement} color={EMERALD} />
                  <BulletRow icon="-" label="Market Signal" value={bcase.demandNote} color={AMBER} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <motion.button
                      onClick={handleCopyAll}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ flex: 1, padding: '9px', borderRadius: '8px', background: copied ? 'transparent' : 'transparent', border: `1px solid ${copied ? 'transparent' : 'var(--border)'}`, color: copied ? EMERALD : 'var(--text-2)', fontSize: '12px', cursor: 'pointer', fontFamily: F_BODY, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied all points!' : 'Copy All Points'}
                    </motion.button>
                    <button
                      onClick={() => { setBcase(null); setError(null) }}
                      style={{ padding: '9px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-4)', fontSize: '12px', cursor: 'pointer', fontFamily: F_BODY, display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <RefreshCw size={11} /> Rebuild
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