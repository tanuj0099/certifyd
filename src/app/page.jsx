'use client';
import { useState, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)' }}></div>;
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <LandingPage />
    </div>
  );
}
