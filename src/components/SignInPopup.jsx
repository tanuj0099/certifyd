import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';

export default function SignInPopup({ isOpen, onClose }) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden' }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={20} />
            </button>
            
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--brand-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Lock size={24} style={{ color: 'var(--brand-primary)' }} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '24px', fontWeight: '800', color: 'var(--text)', marginBottom: '12px', lineHeight: '1.2' }}>
              You've hit your free limit
            </h3>
            
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.6', marginBottom: '32px' }}>
              You've calculated ROI 3 times. Sign in or create a free account to unlock unlimited ROI calculations, market insights, and offer letter analysis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => router.push('/signup')}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--brand-primary)', color: '#000', fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer' }}
              >
                Create Free Account
              </button>
              
              <button 
                onClick={() => router.push('/login')}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'transparent', color: 'var(--text)', fontWeight: '600', fontSize: '15px', border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                Sign in to existing account
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
