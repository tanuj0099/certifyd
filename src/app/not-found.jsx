'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function NotFound({ isDark }) {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#010102',
        color: '#FFFFFF',
        fontFamily: 'var(--font-body)',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--accent-10)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <AlertCircle size={32} />
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '800',
            fontFamily: 'var(--font-head)',
            letterSpacing: '-0.04em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}
        >
          404 - Signal Lost
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '40px',
            lineHeight: 1.6,
          }}
        >
          We couldn't find the page you were looking for. It might have been moved or the URL could be incorrect.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            borderRadius: '100px',
            backgroundColor: '#FFFFFF',
            color: '#010102',
            fontSize: '16px',
            fontWeight: '800',
            fontFamily: 'var(--font-head)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: 'none',
          }}
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}
