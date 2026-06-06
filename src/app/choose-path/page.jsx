'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, TrendingUp, Compass } from 'lucide-react';
import { useJourneyStore } from '@/store/useJourneyStore';

export default function ChoosePathPage() {
  const router = useRouter();
  const setTargetDomain = useJourneyStore(s => s.setTargetDomain);
  const setMode = useJourneyStore(s => s.setMode);

  const handleSelect = (intent) => {
    // Clear any previous target domain since they are starting fresh
    setTargetDomain('');
    
    if (intent === 'level_up') {
      setMode('professional');
    } else if (intent === 'pivot') {
      setMode('switcher');
    } else if (intent === 'breaking_in') {
      setMode('student');
    }

    router.push(`/tools/cert-radar?intent=${intent}`);
  }

  return (
    <div data-theme="dark" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '32px', marginBottom: '12px', textAlign: 'center' }}>Choose Your Path</h1>
          <p style={{ color: 'var(--text-3)', textAlign: 'center', marginBottom: '40px' }}>Tell us where you are in your career journey.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <PathOption 
              icon={<TrendingUp />} 
              title="Level Up" 
              desc="I want to advance in my current domain." 
              onClick={() => handleSelect('level_up')} 
            />
            <PathOption 
              icon={<Compass />} 
              title="Domain Pivot" 
              desc="I want to switch to a new tech or corporate domain." 
              onClick={() => handleSelect('pivot')} 
            />
            <PathOption 
              icon={<Briefcase />} 
              title="Breaking In" 
              desc="I am a student or looking for my first job." 
              onClick={() => handleSelect('breaking_in')} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function PathOption({ icon, title, desc, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        gap: '16px',
        color: 'var(--text)'
      }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
        <div style={{ color: 'var(--text-2)', fontSize: '14px' }}>{desc}</div>
      </div>
      <ArrowRight size={20} color="var(--text-3)" />
    </motion.button>
  )
}
