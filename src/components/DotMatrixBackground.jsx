import { motion } from 'framer-motion'
import React from 'react'

export const DotMatrixLayer = ({ size, space, opacity, duration, reverse, color }) => (
  <motion.div
    animate={{ 
      backgroundPosition: reverse ? [`0px 0px`, `-${space}px -${space}px`] : [`0px 0px`, `${space}px ${space}px`] 
    }}
    transition={{ repeat: Infinity, duration: duration, ease: "linear" }}
    style={{
      position: 'absolute',
      inset: '-100px', 
      opacity: opacity,
      backgroundImage: `radial-gradient(${color} ${size}px, transparent ${size}px)`,
      backgroundSize: `${space}px ${space}px`,
      pointerEvents: 'none'
    }}
  />
);

export function DotMatrixBackground({ children, className = '', mask = 'linear-gradient(to bottom, black 10%, transparent 100%)', mode = 'starfield' }) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Background Matrix */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{ 
          maskImage: mask,
          WebkitMaskImage: mask
        }}
      >
        {mode === 'grid' ? (
          <DotMatrixLayer size={1.5} space={40} opacity={0.3} duration={120} color="var(--text)" />
        ) : (
          <>
            <DotMatrixLayer size={1} space={12} opacity={0.06} duration={25} color="var(--text)" />
            <DotMatrixLayer size={1} space={24} opacity={0.08} duration={40} reverse color="var(--text)" />
            <DotMatrixLayer size={1.5} space={48} opacity={0.12} duration={60} color="var(--text)" />
            <DotMatrixLayer size={1.5} space={72} opacity={0.14} duration={90} reverse color="var(--text)" />
            <DotMatrixLayer size={2} space={120} opacity={0.16} duration={120} color="var(--text)" />
            <DotMatrixLayer size={2.5} space={200} opacity={0.2} duration={160} reverse color="var(--text)" />
            <DotMatrixLayer size={3} space={320} opacity={0.3} duration={200} color="var(--text)" />
          </>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
