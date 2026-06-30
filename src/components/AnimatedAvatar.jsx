import React from 'react';
import { motion } from 'framer-motion';
import { Check, Aperture, Command, Hexagon, Box, CircleDashed, Triangle, Zap, Layers, Globe, Cpu, Fingerprint, Target, User } from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'anim:pro-1', name: 'Nova', icon: Aperture, gradient: 'linear-gradient(135deg, #0f172a 0%, #3b82f6 100%)' },
  { id: 'anim:pro-2', name: 'Apex', icon: Command, gradient: 'linear-gradient(135deg, #334155 0%, #8b5cf6 100%)' },
  { id: 'anim:pro-3', name: 'Zenith', icon: Hexagon, gradient: 'linear-gradient(135deg, #0f172a 0%, #ec4899 100%)' },
  { id: 'anim:pro-4', name: 'Nexus', icon: Box, gradient: 'linear-gradient(135deg, #1e293b 0%, #10b981 100%)' },
  { id: 'anim:pro-5', name: 'Vertex', icon: CircleDashed, gradient: 'linear-gradient(135deg, #0f172a 0%, #f59e0b 100%)' },
  { id: 'anim:pro-6', name: 'Pulse', icon: Zap, gradient: 'linear-gradient(135deg, #334155 0%, #ef4444 100%)' },
  { id: 'anim:pro-7', name: 'Aura', icon: Globe, gradient: 'linear-gradient(135deg, #0f172a 0%, #06b6d4 100%)' },
  { id: 'anim:pro-8', name: 'Echo', icon: Layers, gradient: 'linear-gradient(135deg, #1e293b 0%, #8b5cf6 100%)' },
  { id: 'anim:pro-9', name: 'Lumen', icon: Cpu, gradient: 'linear-gradient(135deg, #0f172a 0%, #14b8a6 100%)' },
  { id: 'anim:pro-10', name: 'Onyx', icon: Fingerprint, gradient: 'linear-gradient(135deg, #334155 0%, #6366f1 100%)' },
  { id: 'anim:pro-11', name: 'Sage', icon: Target, gradient: 'linear-gradient(135deg, #0f172a 0%, #84cc16 100%)' },
  { id: 'anim:pro-12', name: 'Vanguard', icon: Triangle, gradient: 'linear-gradient(135deg, #1e293b 0%, #f43f5e 100%)' },
];

export function AnimatedAvatar({ id, size = 40 }) {
  const preset = AVATAR_PRESETS.find(p => p.id === id) || { icon: User, gradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)' };
  
  const IconComponent = preset.icon;
  const iconSize = Math.floor(size * 0.5);
  
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
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1)'
      }}
    >
      <IconComponent size={iconSize} color="#ffffff" strokeWidth={1.5} />
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
                <AnimatedAvatar id={preset.id} size={50} />
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
