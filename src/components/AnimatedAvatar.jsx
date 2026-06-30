import React from 'react';
import { motion } from 'framer-motion';
import { Check, User } from 'lucide-react';
import Image from 'next/image';

const AVATAR_PRESETS = [
  { id: 'anim:1', id_alias: 'anim:pro-1', name: 'Advay', seed: 'Nova', gradient: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)' },
  { id: 'anim:2', id_alias: 'anim:pro-2', name: 'Reyansh', seed: 'Apex', gradient: 'linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)' },
  { id: 'anim:3', id_alias: 'anim:pro-3', name: 'Zikra', seed: 'Zenith', gradient: 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)' },
  { id: 'anim:4', id_alias: 'anim:pro-4', name: 'Tvarita', seed: 'Nexus', gradient: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)' },
  { id: 'anim:5', id_alias: 'anim:pro-5', name: 'Ojas', seed: 'Vertex', gradient: 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)' },
  { id: 'anim:6', id_alias: 'anim:pro-6', name: 'Vanya', seed: 'Pulse', gradient: 'linear-gradient(135deg, #fecaca 0%, #ef4444 100%)' },
  { id: 'anim:7', id_alias: 'anim:pro-7', name: 'Ahil', seed: 'Aura', gradient: 'linear-gradient(135deg, #bae6fd 0%, #06b6d4 100%)' },
  { id: 'anim:8', id_alias: 'anim:pro-8', name: 'Nivin', seed: 'Echo', gradient: 'linear-gradient(135deg, #e9d5ff 0%, #8b5cf6 100%)' },
  { id: 'anim:9', id_alias: 'anim:pro-9', name: 'Myra', seed: 'Lumen', gradient: 'linear-gradient(135deg, #ccfbf1 0%, #14b8a6 100%)' },
  { id: 'anim:10', id_alias: 'anim:pro-10', name: 'Kairav', seed: 'Onyx', gradient: 'linear-gradient(135deg, #ddd6fe 0%, #6366f1 100%)' },
  { id: 'anim:11', id_alias: 'anim:pro-11', name: 'Anika', seed: 'Sage', gradient: 'linear-gradient(135deg, #d9f99d 0%, #84cc16 100%)' },
  { id: 'anim:12', id_alias: 'anim:pro-12', name: 'Ivaan', seed: 'Vanguard', gradient: 'linear-gradient(135deg, #fecdd3 0%, #f43f5e 100%)' },
];

export function AnimatedAvatar({ id, size = 40 }) {
  const preset = AVATAR_PRESETS.find(p => p.id === id || p.id_alias === id);
  
  if (!preset) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <User size={Math.floor(size * 0.5)} color="#ffffff" strokeWidth={1.5} />
      </div>
    );
  }
  
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        background: preset.gradient, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <img 
        src={`/avatars/${preset.seed}.svg`} 
        alt={`${preset.name} Avatar`}
        style={{
          width: '85%',
          height: '85%',
          objectFit: 'contain',
          transform: 'translateY(5%)' // Push character slightly down so they fit perfectly in circle
        }}
      />
    </div>
  );
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
                <AnimatedAvatar id={preset.id} size={55} />
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
