'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {     } from 'react-router-dom';
import Link from 'next/link';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('certifyroi_cookie_consent');
    if (!hasAccepted) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('certifyroi_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            right: '24px',
            maxWidth: '480px',
            margin: '0 auto',
            backgroundColor: 'var(--bg-elevated, #18181b)',
            border: '1px solid var(--border, #3f3f46)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 9999,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: '700', color: 'var(--text, #fff)' }}>
              We respect your privacy
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-4, #a1a1aa)',
                cursor: 'pointer',
                padding: '4px',
                margin: '-4px'
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', fontFamily: "'Inter', sans-serif", color: 'var(--text-3, #d4d4d8)' }}>
            We use essential cookies and local storage to save your preferences and keep you logged in. We don't use tracking cookies or sell your data.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
            <button
              onClick={handleAccept}
              style={{
                backgroundColor: 'var(--text, #fff)',
                color: 'var(--bg, #000)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              Got it
            </button>
            <Link href="/cookies"
              onClick={() => setIsVisible(false)}
              style={{
                color: 'var(--text-4, #a1a1aa)',
                fontSize: '13px',
                textDecoration: 'underline',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Learn more
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
