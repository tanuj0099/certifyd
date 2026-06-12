import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Repeat, Briefcase, RotateCcw, ArrowRight } from 'lucide-react'

const MODES = [
  { id: 'student',      label: 'Breaking In',  sub: 'No current salary',         color: '#4A8C6A', icon: GraduationCap, desc: 'Path to your first ₹4.8L+ offer' },
  { id: 'switcher',     label: 'Domain Pivot', sub: 'Changing fields',            color: 'var(--cool-grey)', icon: Repeat,        desc: 'Switch domains in 5-8 months' },
  { id: 'professional', label: 'Level Up',     sub: 'Upskilling for a promotion', color: 'var(--linear-blue)', icon: Briefcase, desc: 'Max ROI on your next cert' },
]

const SWITCH_DOMAINS = [
  { id: 'tech',        label: 'Cloud / Tech',        short: 'CLD'  },
  { id: 'data',        label: 'Data & AI',            short: 'DATA' },
  { id: 'cybersecurity',label: 'Cybersecurity',       short: 'SEC'  },
  { id: 'finance',     label: 'Finance',              short: 'FIN'  },
  { id: 'management',  label: 'Management / PMP',     short: 'PM'   },
  { id: 'marketing',   label: 'Marketing / Digital',  short: 'MKT'  },
  { id: 'hr',          label: 'HR & People',          short: 'HR'   },
  { id: 'government',  label: 'Govt / PSU',           short: 'GOV'  },
  { id: 'medical',     label: 'Medical / Pharma',     short: 'MED'  },
  { id: 'product',     label: 'Product Management',   short: 'PROD' },
]

const FM = "var(--font-mono)";
const FH = "var(--font-head)";
const FB = "var(--font-body)";
const F_SERIF = "var(--font-serif)";

//  Hook: isMobile 
function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    setM(window.innerWidth < 768)
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

//  ModePill (for inside the ROI tool) 
export function ModePill({ mode, onReset }) {
  const current = MODES.find((item) => item.id === mode)
  if (!current) return null
  const Icon = current.icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px 5px 8px', borderRadius: '20px',
        background: current.color + '12', border: '1px solid ' + current.color + '35',
        marginBottom: '20px', cursor: 'default', userSelect: 'none',
      }}
    >
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: current.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={11} color={current.color} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: '700', color: current.color, fontFamily: FM, letterSpacing: '0.03em' }}>
        {current.label}
      </span>
      <button
        onClick={onReset}
        style={{ background: 'none', border: 'none', padding: '0 0 0 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.45, transition: 'opacity 0.15s', color: current.color }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.45' }}
      >
        <RotateCcw size={11} />
      </button>
    </motion.div>
  )
}

//  Mobile Card Row (stacked, compact) 
function MobileCards({ hovered, setHovered, onPick }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: '12px', width: '100%',
      padding: '0 16px',
    }}>
      {MODES.map((mode, index) => {
        const Icon = mode.icon
        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onPick(mode.id)}
            style={{
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: '16px',
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '18px 20px',
              textAlign: 'left',
              outline: 'none',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* color accent stripe */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', borderRadius: '16px 0 0 16px', background: mode.color }} />

            {/* icon */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: mode.color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} color={mode.color} />
            </div>

            {/* text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: F_SERIF, fontWeight: '400', fontSize: '22px',
                letterSpacing: '-0.01em', lineHeight: 1.1,
                color: 'var(--text)', marginBottom: '4px',
              }}>
                {mode.label}
              </div>
              <div style={{
                fontFamily: FB, fontSize: '12px', color: 'var(--text-4)',
                lineHeight: 1.4,
              }}>
                {mode.desc}
              </div>
            </div>

            {/* arrow */}
            <ArrowRight size={16} color={mode.color} style={{ flexShrink: 0, opacity: 0.7 }} />
          </motion.button>
        )
      })}
    </div>
  )
}

//  Desktop Card Grid 
function DesktopCards({ hovered, setHovered, onPick }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px', width: '100%', maxWidth: '1000px',
      padding: '0 24px', margin: '0 auto',
    }}>
      {MODES.map((mode, index) => {
        const isHovered = hovered === mode.id
        const Icon = mode.icon
        return (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6, ease: [0.34, 1.1, 0.64, 1] }}
          >
            <button
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onPick(mode.id)}
              style={{
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                width: '100%', height: '100%',
                background: isHovered ? mode.color + '0C' : 'transparent',
                border: isHovered ? '1px solid ' + mode.color + '40' : '1px solid var(--border)',
                borderRadius: '24px', padding: '28px 24px', textAlign: 'left',
                opacity: hovered && !isHovered ? 0.4 : 1, outline: 'none',
                boxShadow: isHovered ? '0 12px 32px ' + mode.color + '15' : 'none',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: mode.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px', transition: 'transform 0.3s',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}>
                <Icon size={18} color={mode.color} />
              </div>
              <div style={{
                fontFamily: F_SERIF, fontWeight: '400', fontSize: 'clamp(22px, 2.8vw, 36px)',
                letterSpacing: '-0.02em', lineHeight: 1.1, color: isHovered ? mode.color : 'var(--text)',
                marginBottom: '10px', transition: 'color 0.3s',
              }}>
                {mode.label}
              </div>
              <div style={{
                fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6,
                transition: 'opacity 0.3s', flex: 1,
              }}>
                {mode.desc}
              </div>
              <div style={{ marginTop: '20px', paddingTop: '0', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: FM, fontSize: '10px', color: mode.color, letterSpacing: '0.1em', fontWeight: '700' }}>SELECT PATH</span>
                <motion.div
                  initial={false}
                  animate={{ flex: isHovered ? 1 : 0, opacity: isHovered ? 0.3 : 0 }}
                  style={{ height: '1px', background: mode.color }}
                />
              </div>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}

//  Domain Picker 
function DomainPicker({ onConfirm, color, isMobile }) {
  const [selected, setSelected] = useState(null)
  const [customValue, setCustomValue] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%', maxWidth: isMobile ? '100%' : '700px', padding: isMobile ? '0 16px' : '0 clamp(14px, 4vw, 40px)' }}
    >
      <div style={{
        fontFamily: FM, fontSize: isMobile ? '10px' : 'clamp(10px, 1.2vw, 13px)',
        color: color, letterSpacing: '0.22em', textTransform: 'uppercase',
        textAlign: 'center', marginBottom: '20px', opacity: 0.85,
      }}>
        WHERE ARE YOU SWITCHING TO?
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))',
        gap: '8px',
      }}>
        {SWITCH_DOMAINS.map((domain, index) => {
          const isSelected = selected === domain.id
          return (
            <motion.button
              key={domain.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.025, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => { setSelected(domain.id); setCustomValue('') }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: isMobile ? '12px 10px' : '13px 11px',
                borderRadius: '11px',
                border: '1px solid ' + (isSelected ? color + '65' : 'var(--border)'),
                background: isSelected ? color + '18' : 'transparent',
                color: isSelected ? color : 'var(--text-2)',
                fontSize: isMobile ? '12px' : 'clamp(11px, 1.2vw, 13px)',
                fontFamily: FH, fontWeight: isSelected ? '700' : '500',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'border-color 0.16s, background 0.16s, color 0.16s',
                textAlign: 'left',
                boxShadow: isSelected ? '0 0 18px ' + color + '18' : 'none',
              }}
            >
              <span style={{ fontSize: '9px', flexShrink: 0, fontFamily: FM, letterSpacing: '0.08em', opacity: 0.7 }}>{domain.short}</span>
              <span style={{ lineHeight: 1.3 }}>{domain.label}</span>
            </motion.button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 12px', opacity: 0.35 }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--text)' }} />
        <span style={{ fontFamily: FM, fontSize: '9px', letterSpacing: '0.12em' }}>OR TYPE CUSTOM</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--text)' }} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <input
          type="text"
          placeholder="e.g. Sports Analytics, Healthcare Admin..."
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value)
            if (e.target.value.trim()) setSelected('custom')
            else if (selected === 'custom') setSelected(null)
          }}
          onFocus={(e) => e.target.style.borderColor = color + '80'}
          onBlur={(e) => e.target.style.borderColor = selected === 'custom' ? color + '65' : 'var(--border)'}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px',
            border: '1px solid ' + (selected === 'custom' ? color + '65' : 'var(--border)'),
            background: selected === 'custom' ? color + '12' : 'var(--bg)',
            color: selected === 'custom' ? color : 'var(--text)',
            fontSize: isMobile ? '13px' : 'clamp(12px, 1.2vw, 14px)',
            fontFamily: FB, outline: 'none', transition: 'all 0.2s', textAlign: 'center',
            boxSizing: 'border-box',
          }}
        />
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
        <motion.button
          onClick={() => {
            if (selected === 'custom' && customValue.trim()) onConfirm(customValue.trim())
            else if (selected && selected !== 'custom') onConfirm(selected)
          }}
          animate={{ opacity: selected ? 1 : 0.28 }}
          whileHover={selected ? { scale: 1.04, y: -1 } : {}}
          whileTap={selected ? { scale: 0.97 } : {}}
          style={{
            padding: isMobile ? '13px 36px' : '14px 44px',
            borderRadius: '40px', border: '1px solid ' + (selected ? color + '55' : 'var(--border)'),
            background: selected ? color + '15' : 'transparent',
            color: selected ? color : 'var(--text-4)',
            fontSize: '14px', fontFamily: FH, fontWeight: '800',
            cursor: selected ? 'pointer' : 'not-allowed',
            letterSpacing: '-0.02em', width: isMobile ? '100%' : 'auto',
            transition: 'box-shadow 0.2s, background 0.2s',
          }}
        >
          {selected ? 'Start switching ' : 'Pick a domain first'}
        </motion.button>

        <button
          onClick={() => onConfirm('auto')}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-4)', fontSize: '12px',
            fontFamily: FB, cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: '3px', opacity: 0.8,
          }}
        >
          let AI decide from my resume
        </button>
      </div>
    </motion.div>
  )
}

//  Main ModeSelector 
function ModeSelector({ onSelect }) {
  const [step, setStep] = useState('pick')
  const [hovered, setHovered] = useState(null)
  const [ready, setReady] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 120)
    return () => clearTimeout(timer)
  }, [])

  function handleWordPick(id) {
    if (step !== 'pick') return
    if (id === 'switcher') { setStep('domain'); return }
    setStep('exiting')
    setTimeout(() => onSelect(id), 600)
  }

  function handleDomainConfirm(domainId) {
    if (domainId && domainId !== 'auto') {
      try { localStorage.setItem('certifyd_switch_domain', domainId) } catch (e) {}
    } else {
      try { localStorage.removeItem('certifyd_switch_domain') } catch (e) {}
    }
    setStep('exiting')
    setTimeout(() => onSelect('switcher'), 500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: step === 'exiting' ? 0 : 1 }}
      transition={{ duration: step === 'exiting' ? 0.4 : 0.3 }}
      style={{
        position: 'fixed',
        // On mobile: cover from top (no dynamic island) with bottom bar offset
        // On desktop: offset below the nav island
        top: isMobile ? 0 : 'calc(var(--nav-h, 64px) + 72px)',
        left: 0, right: 0, bottom: 0,
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        overflowY: 'auto',
        // Bottom padding on mobile to avoid bottom tab bar
        paddingBottom: isMobile ? '80px' : '0',
        paddingTop: isMobile ? '24px' : '0',
      }}
    >
      <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          {step === 'pick' && ready ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -24, transition: { duration: 0.3 } }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '20px' : '36px' }}
            >
              {/* Header prompt */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 0.55, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                style={{
                  fontFamily: FM, fontSize: isMobile ? '10px' : '11px',
                  color: 'var(--text-4)', letterSpacing: '0.22em',
                  textTransform: 'uppercase', textAlign: 'center',
                  padding: '0 16px',
                }}
              >
                WHAT'S YOUR GOAL RIGHT NOW?
              </motion.div>

              {/* Cards - compact on mobile, 3-col grid on desktop */}
              {isMobile
                ? <MobileCards hovered={hovered} setHovered={setHovered} onPick={handleWordPick} />
                : <DesktopCards hovered={hovered} setHovered={setHovered} onPick={handleWordPick} />
              }

              {/* Hint text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered ? 0 : 0.6 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                style={{
                  fontFamily: FB, fontSize: isMobile ? '11px' : '13px',
                  color: 'var(--text-4)', textAlign: 'center',
                  padding: '0 24px',
                }}
              >
                pick one - it shapes every recommendation and filter
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 'domain' ? (
            <motion.div
              key="domain"
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <DomainPicker onConfirm={handleDomainConfirm} color="var(--cool-grey)" isMobile={isMobile} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default ModeSelector
