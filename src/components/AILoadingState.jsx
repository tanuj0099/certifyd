import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BarChart3, Brain, TrendingUp, FileText, Check } from 'lucide-react'

const LOADING_STEPS = [
  { icon: Search, text: 'Scanning Bangalore job market...',     delay: 0    },
  { icon: BarChart3, text: 'Pulling Naukri salary data...',        delay: 1200 },
  { icon: Brain, text: 'Analysing cert demand trends...',      delay: 2400 },
  { icon: TrendingUp, text: 'Calculating your 5-year trajectory...', delay: 3400 },
  { icon: FileText,  text: 'Writing your personalised report...',  delay: 4200 },
]

const AILoadingState = ({ certName }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])

  useEffect(() => {
    const timers = LOADING_STEPS.map((step, i) =>
      setTimeout(() => {
        setCurrentStep(i)
        setCompletedSteps(prev => i > 0 ? [...prev, i - 1] : prev)
      }, step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="glass" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div className="pulse-dot" />
        <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
          Decision Engine Processing
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-4)' }}>
          {certName ? `• ${certName}` : ''}
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {LOADING_STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive    = i === currentStep
          const isCompleted = completedSteps.includes(i)
          const isPending   = i > currentStep

          return (
            <AnimatePresence key={i}>
              {!isPending && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="type-in"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: isCompleted ? 'transparent' : isActive ? 'var(--indigo-dim)' : 'var(--border-subtle)',
                    border: `1px solid ${isCompleted ? 'transparent' : isActive ? 'var(--border-accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {isCompleted ? <Check size={13} color="var(--linear-blue)" /> : <Icon size={13} color={isActive ? 'var(--indigo-light)' : 'var(--text-4)'} />}
                  </div>
                  <span style={{
                    fontSize: '13px',
                    color: isCompleted ? 'var(--text-4)' : isActive ? 'var(--text)' : 'var(--text-4)',
                    fontWeight: isActive ? '600' : '400',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    transition: 'all 0.3s',
                    fontFamily: isActive ? 'Plus Jakarta Sans' : 'Inter',
                  }}>
                    {step.text}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--indigo)', flexShrink: 0 }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', borderRadius: '2px', background: 'var(--indigo-dim)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: '2px', background: 'transparent, var(--indigo-light))' }}
        />
      </div>

      {/* Skeleton shimmer lines */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[80, 65, 72, 55].map((w, i) => (
          <div key={i} className="shimmer" style={{ height: '12px', width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

export default AILoadingState
