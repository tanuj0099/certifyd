import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const AVATAR_PRESETS = [
  {
    id: 'anim:neon-pulse',
    name: 'Neon Pulse',
    render: (size) => (
      <motion.div
        style={{ width: size, height: size, borderRadius: '50%', background: 'conic-gradient(from 0deg, #ff007f, #7928ca, #ff007f)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid rgba(0,0,0,0.8)', boxSizing: 'border-box' }} />
      </motion.div>
    ),
  },
  {
    id: 'anim:cyber-grid',
    name: 'Cyber Grid',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#00f0ff', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          style={{ position: 'absolute', top: 0, left: 0, width: '200%', height: '200%', backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)', backgroundSize: '10px 10px' }}
          animate={{ x: -10, y: -10 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    ),
  },
  {
    id: 'anim:cosmic-spin',
    name: 'Cosmic Spin',
    render: (size) => (
      <motion.div
        style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at center, #1a0b2e, #4c1d95, #000)', position: 'relative', overflow: 'hidden' }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          style={{ position: 'absolute', top: '20%', left: '20%', width: '10%', height: '10%', background: '#fff', borderRadius: '50%', filter: 'blur(2px)' }}
          animate={{ rotate: 360, x: [0, size/2, 0], y: [0, size/2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    ),
  },
  {
    id: 'anim:plasma-orb',
    name: 'Plasma Orb',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#ff3366', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          style={{ position: 'absolute', inset: -size/2, background: 'radial-gradient(circle at center, #ff9933 0%, transparent 60%)', filter: 'blur(8px)' }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    ),
  },
  {
    id: 'anim:matrix-rain',
    name: 'Matrix Rain',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#0d1117', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          style={{ width: '100%', height: '200%', background: 'linear-gradient(180deg, transparent, #00ff41, transparent)', filter: 'blur(2px)' }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    ),
  },
  {
    id: 'anim:aurora-wave',
    name: 'Aurora Wave',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(45deg, #00c6ff, #0072ff)', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          style={{ position: 'absolute', inset: '-50%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'rotate(45deg)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    ),
  },
  {
    id: 'anim:golden-ratio',
    name: 'Golden Ratio',
    render: (size) => (
      <motion.div
        style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)', borderRadius: '50%' }} />
      </motion.div>
    ),
  },
  {
    id: 'anim:dark-matter',
    name: 'Dark Matter',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          style={{ position: 'absolute', inset: 0, border: '2px solid rgba(138, 43, 226, 0.5)', borderRadius: '50%' }}
          animate={{ scale: [1, 1.2], opacity: [1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          style={{ position: 'absolute', inset: 0, border: '2px solid rgba(138, 43, 226, 0.8)', borderRadius: '50%' }}
          animate={{ scale: [1, 1.2], opacity: [1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.75 }}
        />
      </div>
    ),
  },
  {
    id: 'anim:quantum-flux',
    name: 'Quantum Flux',
    render: (size) => (
      <motion.div
        style={{ width: size, height: size, borderRadius: '50%', background: 'conic-gradient(from 180deg, #00f2fe, #4facfe, #00f2fe)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <div style={{ width: size * 0.6, height: size * 0.6, background: '#0a0a0b', borderRadius: '50%' }} />
      </motion.div>
    ),
  },
  {
    id: 'anim:lava-lamp',
    name: 'Lava Lamp',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(to bottom, #ff4e50, #f9d423)', position: 'relative', overflow: 'hidden' }}>
        <motion.div
          style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(4px)' }}
          animate={{ y: [size, -size], x: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    ),
  },
  {
    id: 'anim:glitch-core',
    name: 'Glitch Core',
    render: (size) => (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          style={{ position: 'absolute', width: '100%', height: '5px', background: '#000' }}
          animate={{ y: [-size/2, size/2], opacity: [0, 1, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1 }}
        />
        <motion.div
          style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(255, 0, 255, 0.4)', mixBlendMode: 'difference' }}
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
      </div>
    ),
  },
  {
    id: 'anim:void-walker',
    name: 'Void Walker',
    render: (size) => (
      <motion.div
        style={{ width: size, height: size, borderRadius: '50%', background: 'conic-gradient(#fff, #000, #fff)' }}
        animate={{ rotate: 360, filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    ),
  },
];

export function AnimatedAvatar({ id, size = 40 }) {
  const preset = AVATAR_PRESETS.find(p => p.id === id);
  if (!preset) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border)' }} />;
  return preset.render(size);
}

export function AvatarSelector({ selectedId, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '16px' }}>
      {AVATAR_PRESETS.map((preset) => {
        const isSelected = selectedId === preset.id;
        return (
          <div
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <motion.div
              style={{
                padding: '4px',
                borderRadius: '50%',
                border: isSelected ? '2px solid var(--brand-primary)' : '2px solid transparent',
                background: isSelected ? 'var(--brand-subtle)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div style={{ pointerEvents: 'none' }}>
                {preset.render(50)}
              </div>
            </motion.div>
            <span style={{ fontSize: '11px', color: isSelected ? 'var(--text)' : 'var(--text-3)', fontWeight: isSelected ? 700 : 500, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
              {preset.name}
            </span>
            {isSelected && (
              <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={10} color="#000" strokeWidth={3} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const getAnimAvatarId = (url) => {
  if (url && url.startsWith('anim:')) return url;
  return null;
}
