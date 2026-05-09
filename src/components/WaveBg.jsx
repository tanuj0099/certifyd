import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const W1 = "M0,420 C200,375 400,465 600,415 C800,365 1000,450 1200,405 C1320,378 1380,395 1440,385 L1440,900 L0,900 Z"
const W2 = "M0,565 C180,530 360,600 540,562 C720,524 900,592 1080,552 C1220,522 1340,550 1440,538 L1440,900 L0,900 Z"
const W3 = "M0,695 C200,668 400,722 600,692 C800,662 1000,708 1200,675 C1320,658 1380,672 1440,665 L1440,900 L0,900 Z"

// Nordic theme wave configs
const NORDIC = {
  landing: [
    { path: W1, c1: '#2D6A4F', c2: '#9A7235', c3: '#4A8C6A', o: 0.050, dur: 20, dy: 22, delay: 0   },
    { path: W2, c1: '#9A7235', c2: '#2D6A4F', c3: '#B89050', o: 0.038, dur: 25, dy: 16, delay: 1.5 },
    { path: W3, c1: '#4A8C6A', c2: '#2D6A4F', c3: '#9A7235', o: 0.028, dur: 16, dy: 12, delay: 0.8 },
  ],
  app: [
    { path: W1, c1: '#2D6A4F', c2: '#9A7235', c3: '#4A8C6A', o: 0.090, dur: 18, dy: 22, delay: 0   },
    { path: W2, c1: '#9A7235', c2: '#B89050', c3: '#2D6A4F', o: 0.070, dur: 22, dy: 16, delay: 1.5 },
    { path: W3, c1: '#4A8C6A', c2: '#2D6A4F', c3: '#9A7235', o: 0.060, dur: 14, dy: 12, delay: 0.8 },
  ],
}

// Ash theme wave configs
const ASH = {
  landing: [
    { path: W1, c1: '#2D6A4F', c2: '#9A7235', c3: '#4A8C6A', o: 0.105, dur: 20, dy: 22, delay: 0   },
    { path: W2, c1: '#9A7235', c2: '#2D6A4F', c3: '#B89050', o: 0.082, dur: 25, dy: 16, delay: 1.5 },
    { path: W3, c1: '#4A8C6A', c2: '#2D6A4F', c3: '#9A7235', o: 0.062, dur: 16, dy: 12, delay: 0.8 },
  ],
  app: [
    { path: W1, c1: '#2D6A4F', c2: '#9A7235', c3: '#4A8C6A', o: 0.160, dur: 18, dy: 22, delay: 0   },
    { path: W2, c1: '#9A7235', c2: '#B89050', c3: '#2D6A4F', o: 0.124, dur: 22, dy: 16, delay: 1.5 },
    { path: W3, c1: '#4A8C6A', c2: '#2D6A4F', c3: '#9A7235', o: 0.104, dur: 14, dy: 12, delay: 0.8 },
  ],
}

const WaveBg = ({ variant = 'landing' }) => {
  const [isNordic, setIsNordic] = useState(
    () => document.documentElement.getAttribute('data-theme') !== 'ash'
  )

  // Watch data-theme changes
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsNordic(document.documentElement.getAttribute('data-theme') !== 'ash')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const waves = isNordic ? NORDIC[variant] : ASH[variant]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        <defs>
          {waves.map((w, i) => (
            <linearGradient key={i} id={`wg-${variant}-${isNordic ? 'n' : 'a'}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={w.c1} stopOpacity={w.o} />
              <stop offset="45%"  stopColor={w.c2} stopOpacity={w.o * 1.3} />
              <stop offset="100%" stopColor={w.c3} stopOpacity={w.o * 0.7} />
            </linearGradient>
          ))}
        </defs>
        {waves.map((w, i) => (
          <motion.path
            key={`${isNordic}-${i}`}
            d={w.path}
            fill={`url(#wg-${variant}-${isNordic ? 'n' : 'a'}-${i})`}
            animate={{ y: [-w.dy / 2, w.dy / 2] }}
            transition={{ duration: w.dur, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror', delay: w.delay }}
          />
        ))}
      </svg>
    </div>
  )
}

export default WaveBg
