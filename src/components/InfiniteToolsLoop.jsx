'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { TOOLS } from '../data/toolsData'

const F_SANS = "var(--font-sans)";
const F_MONO = "var(--font-mono)";

export function InfiniteToolsLoop() {
  const router = useRouter()
  // Duplicate array several times to ensure a very long scroll area
  // We need enough content to cover the screen and then loop
  const loopTools = [...TOOLS, ...TOOLS, ...TOOLS]

  return (
    <div className="relative w-full h-[600px] sm:h-[800px] overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}>
      <motion.div
        animate={{ y: [0, `-${(100 / 3)}%`] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 40,
        }}
        className="flex flex-col gap-6 px-4 absolute top-0 w-full"
      >
        {loopTools.map((tool, index) => {
          const Icon = tool.icon
          return (
            <div
              key={`${tool.id}-${index}`}
              onClick={() => router.push(tool.path)}
              className="group relative flex flex-col p-6 rounded-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                borderColor: 'var(--border-strong)',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* Animated subtle glow on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 70%)' }} />
              
              {/* Subtle top glare */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/10" style={{ maskImage: 'linear-gradient(to bottom, white, transparent)' }} />
              
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-inner relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Inner highlight for icon box */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
                    {Icon && <Icon size={22} />}
                  </div>
                  <div className="text-[11px] tracking-[0.2em] font-bold" style={{ fontFamily: F_MONO, color: 'var(--text-4)' }}>
                    // {tool.tag.toUpperCase()}
                  </div>
                </div>
                {tool.badge && (
                  <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border" style={{ backgroundColor: `${tool.badgeColor}15`, color: tool.badgeColor, borderColor: `${tool.badgeColor}30`, fontFamily: F_MONO }}>
                    {tool.badge}
                  </div>
                )}
              </div>
              
              <h3 className="text-[22px] font-bold mb-2 tracking-tight relative z-10 transition-colors duration-300 group-hover:text-white" style={{ fontFamily: F_SANS, color: 'var(--text)' }}>
                {tool.label}
              </h3>
              
              <p className="text-[15px] leading-relaxed relative z-10" style={{ fontFamily: F_SANS, color: 'var(--text-3)' }}>
                {tool.desc}
              </p>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
