import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'anim:bot-1', name: 'Sparky', seed: 'Felix', collection: 'bottts' },
  { id: 'anim:bot-2', name: 'Buster', seed: 'Buster', collection: 'bottts' },
  { id: 'anim:bot-3', name: 'Gizmo', seed: 'Gizmo', collection: 'bottts' },
  { id: 'anim:bot-4', name: 'Whiz', seed: 'Whiz', collection: 'bottts' },
  { id: 'anim:adv-1', name: 'Finn', seed: 'Finn', collection: 'adventurer' },
  { id: 'anim:adv-2', name: 'Mia', seed: 'Mia', collection: 'adventurer' },
  { id: 'anim:adv-3', name: 'Leo', seed: 'Leo', collection: 'adventurer' },
  { id: 'anim:adv-4', name: 'Zoe', seed: 'Zoe', collection: 'adventurer' },
  { id: 'anim:fun-1', name: 'Happy', seed: 'Happy', collection: 'fun-emoji' },
  { id: 'anim:fun-2', name: 'Silly', seed: 'Silly', collection: 'fun-emoji' },
  { id: 'anim:fun-3', name: 'Wink', seed: 'Wink', collection: 'fun-emoji' },
  { id: 'anim:fun-4', name: 'Cool', seed: 'Cool', collection: 'fun-emoji' },
];

export function AnimatedAvatar({ id, size = 40 }) {
  const preset = AVATAR_PRESETS.find(p => p.id === id);
  
  if (!preset) {
    // Check if it's an old animated one, just fallback to a generic avatar
    return (
      <img 
        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${id || 'default'}`}
        alt="Avatar"
        style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border)' }}
      />
    );
  }
  
  return (
    <img 
      src={`https://api.dicebear.com/7.x/${preset.collection}/svg?seed=${preset.seed}&backgroundColor=transparent`}
      alt={preset.name}
      style={{ width: size, height: size, borderRadius: '50%', background: 'var(--brand-subtle)', objectFit: 'contain' }}
    />
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
