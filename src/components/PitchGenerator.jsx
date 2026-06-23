import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, X, Sparkles, Copy, Check } from 'lucide-react'
import { callGroqForPitch } from '../services/aiService.jsx'

const PICTON  = 'var(--linear-blue)'
const ORANGE = 'var(--linear-blue)'
const AMBER   = 'var(--cool-grey)'
const SPRING  = { type: 'spring', stiffness: 400, damping: 30 }

const buildPrompt = ({ certName, certCost, currentSalary, hikePercent, recipientType }) => {
  const annualGain   = currentSalary * 100000 * hikePercent / 100
  const fiveYearGain = (annualGain * 5 - certCost * 100000) / 100000
  const breakEven    = annualGain > 0 ? Math.ceil((certCost * 100000) / (annualGain / 12)) : 8

  return `You are a professional career coach helping an Indian tech employee write a reimbursement request.
Cert: ${certName}
Cost: Rs.${certCost}L
Current salary: Rs.${currentSalary}L/yr
Expected hike: ${hikePercent}%
5yr gain: Rs.${fiveYearGain.toFixed(1)}L
Break-even: ${breakEven} months
Format: ${recipientType}

Write a ${recipientType === 'email' ? 'professional email with Subject line 150-200 words' : recipientType === 'slack' ? 'Slack message 80-100 words casual but professional' : 'WhatsApp message 60-80 words friendly'} requesting company sponsorship.
Frame around company benefit. Mention 3 team benefits. End with: Would you be open to sponsoring Rs.${certCost}L? Sign as [Your Name]. Return ONLY the message.`
}

const TYPE_OPTIONS = [
  { id: 'email',    icon: Mail,          label: 'Email to Manager' },
  { id: 'slack',    icon: MessageSquare, label: 'Slack Message'    },
  { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp to Boss' },
]

const PitchGenerator = ({ certName, certCost, currentSalary, hikePercent, onClose }) => {
  const [type,    setType]    = useState('email')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [copied,  setCopied]  = useState(false)
  const [error,   setError]   = useState(null)

  const generate = async () => {
    setLoading(true); setResult(null); setError(null)
    try {
      const text = await callGroqForPitch(null, buildPrompt({ certName, certCost, currentSalary, hikePercent, recipientType: type }))
      if (!text) throw new Error('Empty response')
      setResult(text)
    } catch (e) {
      console.error('PitchGenerator error:', e)
      if (e.message?.includes('not configured') || e.message?.includes('500') || e.message?.includes('404') || e.message === 'NO_KEY') {
        const breakEven = currentSalary > 0 ? Math.ceil((certCost * 100000) / (currentSalary * 100000 * hikePercent / 100 / 12)) : 8
        setResult(type === 'email'
          ? `Subject: Training Sponsorship Request - ${certName}\n\nHi [Manager's Name],\n\nI'd like to request company sponsorship for the ${certName} certification (Rs.${certCost}L).\n\nHere's why this makes sense for the team:\n\n1. We can handle ${certName.includes('AWS') ? 'cloud infrastructure' : certName.includes('Data') ? 'data analytics' : 'this domain'} in-house, reducing external consulting costs\n2. Certified professionals deliver 30-40% faster on relevant projects per industry benchmarks\n3. Keeps our skills current with what clients are actively requesting in 2026\n\nThe investment pays for itself within ${breakEven} months. Total ask: Rs.${certCost}L.\n\nWould you be open to sponsoring Rs.${certCost}L?\n\nThanks,\n[Your Name]`
          : type === 'slack'
          ? `Hey [Manager] - quick ask. Would the company consider sponsoring my ${certName} cert (Rs.${certCost}L)? Pays back in ${breakEven} months through productivity gains. Happy to share the full ROI breakdown. Would you be open to sponsoring Rs.${certCost}L? `
          : `Hi [Manager]! Any chance the company could sponsor my ${certName} cert? It's Rs.${certCost}L and pays back in ${breakEven} months. Direct benefit to the team. Would you be open to sponsoring Rs.${certCost}L? Thanks! `)
      } else {
        setError('Generation failed: ' + e.message)
      }
    } finally { setLoading(false) }
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={SPRING}
      style={{ background: '#121826', border: '1px solid ' + PICTON + '22', borderRadius: '14px', overflow: 'hidden', marginTop: '14px', boxShadow: 'none' }}
    >
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 28, height: 28, borderRadius: '8px', background: PICTON + '14', border: '1px solid ' + PICTON + '28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={13} color={PICTON} />
        </div>
        <div>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '800', fontSize: '12px', color: PICTON, letterSpacing: '0.04em' }}>PITCH YOUR BOSS</div>
          <div style={{ fontSize: '11px', color: '#1E293B', fontFamily: 'var(--font-sans)' }}>Get your company to pay for this cert</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#334155', cursor: 'pointer' }}><X size={14} /></button>
      </div>

      <div style={{ padding: '16px 18px' }}>
        <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', marginBottom: '14px', fontSize: '12px', color: '#475569', fontFamily: 'var(--font-sans)', lineHeight: '1.5' }}>
           Most Indian companies have unused L&D budgets every year. Most employees never ask.
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>FORMAT</div>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {TYPE_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => { setType(opt.id); setResult(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', background: type === opt.id ? PICTON + '14' : '#0D1117', border: '1px solid ' + (type === opt.id ? PICTON + '44' : 'var(--border-subtle)'), color: type === opt.id ? PICTON : '#475569', transition: 'all 0.15s' }}>
                <opt.icon size={11} />{opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '9px 12px', borderRadius: '8px', background: '#0D1117', border: '1px solid var(--border-subtle)', marginBottom: '14px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[{ label: 'CERT', value: certName, color: '#F8FAFC' }, { label: 'COST', value: 'Rs.' + certCost + 'L', color: AMBER }, { label: 'HIKE', value: '+' + hikePercent + '%', color: ORANGE }].map((item, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: item.color, fontWeight: '600' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <button onClick={generate} disabled={loading} className="btn-primary" style={{ width: '100%', fontSize: '13px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginBottom: result || error ? '14px' : '0' }}>
          {loading ? <><div className="pulse-dot" />Writing...</> : <><Sparkles size={13} />Generate {type === 'email' ? 'Email' : type === 'slack' ? 'Slack Message' : 'WhatsApp'}</>}
        </button>

        {error && <div style={{ padding: '9px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid transparent', fontSize: '12px', color: '#FCA5A5', fontFamily: 'var(--font-sans)' }}>{error}</div>}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div style={{ position: 'relative' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '14px', borderRadius: '9px', background: '#0D1117', border: '1px solid var(--border-subtle)', fontSize: '12px', color: '#94A3B8', lineHeight: '1.7', fontFamily: 'var(--font-sans)', maxHeight: '300px', overflowY: 'auto' }}>
                  {result}
                </pre>
                <button onClick={copy} style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '6px', background: copied ? 'transparent' : '#121826', border: '1px solid ' + (copied ? 'transparent' : 'var(--border-subtle)'), color: copied ? ORANGE : '#475569', fontSize: '11px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.18s' }}>
                  {copied ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#1E293B', marginTop: '7px', fontFamily: 'var(--font-sans)' }}>Replace [Your Name] and [Manager's Name] before sending.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default PitchGenerator