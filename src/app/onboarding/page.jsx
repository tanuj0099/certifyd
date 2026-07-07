'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Briefcase, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { upsertUserProfile } from '@/services/userProfileService.js';
import { supabase } from '@/lib/supabase.js';

const careerStages = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Student / Final Year',
    desc: 'Looking for first role'
  },
  {
    id: 'early_career',
    icon: Briefcase,
    title: 'Early Career (0-3 years)',
    desc: 'First major career move'
  },
  {
    id: 'mid_level',
    icon: TrendingUp,
    title: 'Mid-Level (3-8 years)',
    desc: 'Upskilling or moving up'
  },
  {
    id: 'career_switcher',
    icon: RefreshCw,
    title: 'Career Switcher',
    desc: 'Changing domain'
  }
];

const topCities = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Delhi NCR',
  'Chennai',
  'Noida',
  'Gurugram'
];

const intentCards = [
  {
    id: 'cert_decision',
    title: 'Deciding which certification to get next',
    dest: 'Show me ROI Calculator',
    path: '/tools/roi'
  },
  {
    id: 'offer_negotiation',
    title: 'I have an offer letter and want to know if I should negotiate',
    dest: 'Show me Offer Letter Analyzer',
    path: '/offer-analysis'
  },
  {
    id: 'market_research',
    title: 'I want to see what certs are in demand in my city',
    dest: 'Show me Market Pulse',
    path: '/tools/market'
  }
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [careerStage, setCareerStage] = useState('');
  const [city, setCity] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // 2-second welcome banner
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Geo IP Pre-fill
  useEffect(() => {
    async function fetchGeo() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.city && data.region && !city) {
            setCity(`${data.city}, ${data.region}`);
            setCitySearch(`${data.city}, ${data.region}`);
          }
        }
      } catch {
        // Fallback or ignore
      }
    }
    fetchGeo();
  }, [city]);

  // Protect route & check onboarding complete
  useEffect(() => {
    const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
    if (authLoading) return;
    if (!user && !isDemo) {
      router.replace('/login');
      return;
    }
    if (user && !isDemo) {
      let cancelled = false;
      async function checkOnboarded() {
        try {
          const userId = user.id || user.uid;
          if (!supabase || !userId) return;
          const [{ data: userProfile }, { data: profile }] = await Promise.all([
            supabase.from('user_profiles').select('onboarding_complete').eq('user_id', userId).maybeSingle(),
            supabase.from('profiles').select('onboarding_complete').eq('id', userId).maybeSingle()
          ]);
          if (!cancelled && (userProfile?.onboarding_complete || profile?.onboarding_complete)) {
            router.replace('/dashboard');
          }
        } catch (err) {
          console.error('Onboarding check err:', err);
        }
      }
      checkOnboarded();
      return () => { cancelled = true; };
    }
  }, [user, authLoading, router]);

  function handleStageSelect(stageId) {
    setCareerStage(stageId);
    setStep(2);
  }

  function handleCityPillSelect(cityName) {
    setIsRemote(false);
    setCity(cityName);
    setCitySearch(cityName);
  }

  function handleRemoteSelect() {
    setIsRemote(true);
    setCity('Remote / Pan-India');
    setCitySearch('Remote / Pan-India');
  }

  function handleCityContinue() {
    if (!city && !citySearch && !isRemote) return;
    if (!city && citySearch) {
      setCity(citySearch.trim());
    }
    setStep(3);
  }

  async function handleIntentSelect(intentItem) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const finalCity = isRemote ? 'Remote / Pan-India' : (city || citySearch.trim() || 'Bengaluru');
      if (user) {
        await upsertUserProfile(user, {
          career_stage: careerStage || 'early_career',
          job_role: careerStage || 'early_career',
          city: finalCity,
          is_remote: isRemote,
          primary_intent: intentItem.id,
          onboarding_complete: true,
          profile_completion_pct: 30
        });
      }
      const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
      const destUrl = `${intentItem.path}${isDemo ? '?demo=true' : ''}`;
      router.push(destUrl, { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to save profile. Please try again.');
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#080A0E', alignItems: 'center', justifyContent: 'center', color: '#8B949E', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
        Loading your workspace...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#080A0E', color: '#F0F6FC', fontFamily: 'Inter, sans-serif', flexDirection: 'column', position: 'relative' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#00D4A8', letterSpacing: '0.12em' }}>
            CERTIFYD
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {step > 1 && !busy && !showWelcome && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#8B949E', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              onMouseOver={(e) => e.target.style.color = '#F0F6FC'}
              onMouseOut={(e) => e.target.style.color = '#8B949E'}
            >
              ← Back
            </button>
          )}
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#8B949E', fontFamily: 'JetBrains Mono, monospace' }}>
            {step} of 3
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        <AnimatePresence mode="wait">
          
          {/* Welcome Banner Before Step 1 */}
          {showWelcome ? (
            <motion.div
              key="welcome-banner"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', textAlign: 'center', padding: '60px 0' }}
            >
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '14px', color: '#00D4A8' }}>
                Account verified. Let&apos;s set up your profile.
              </div>
            </motion.div>
          ) : (
            <>
              {/* STEP 1: CAREER STAGE */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ width: '100%' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#F0F6FC', margin: '0 0 8px 0' }}>
                      First, who are you right now?
                    </h1>
                    <p style={{ fontSize: '15px', color: '#8B949E', margin: 0 }}>
                      This personalizes your cert recommendations immediately.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ width: '100%' }}>
                    {careerStages.map((stage) => {
                      const isSelected = careerStage === stage.id;
                      const IconComponent = stage.icon;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => handleStageSelect(stage.id)}
                          style={{
                            background: isSelected ? 'rgba(0,212,168,0.06)' : '#0F1218',
                            border: `1px solid ${isSelected ? '#00D4A8' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '10px',
                            padding: '24px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            transition: 'all 200ms ease-out',
                            outline: 'none',
                            width: '100%'
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = '#00D4A8';
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          }}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0,212,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconComponent size={22} color="#00D4A8" />
                          </div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#F0F6FC', marginBottom: '4px' }}>
                              {stage.title}
                            </div>
                            <div style={{ fontSize: '13px', color: '#8B949E' }}>
                              {stage.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CITY & LOCATION */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ width: '100%', maxWidth: '540px' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#F0F6FC', margin: '0 0 8px 0' }}>
                      Which city are you in?
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8B949E', margin: 0, lineHeight: '1.6' }}>
                      Cert demand varies significantly by city. Bengaluru data is very different from Pune data.
                    </p>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <input
                      type="text"
                      placeholder="Type your city..."
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setCity(e.target.value);
                        setIsRemote(false);
                      }}
                      style={{
                        width: '100%',
                        height: '48px',
                        background: '#0F1218',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        padding: '0 16px',
                        color: '#F0F6FC',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 150ms ease-out',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00D4A8'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#8B949E', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quick select top tech markets:
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {topCities.map((cityName) => {
                      const isSel = city === cityName && !isRemote;
                      return (
                        <button
                          key={cityName}
                          type="button"
                          onClick={() => handleCityPillSelect(cityName)}
                          style={{
                            background: isSel ? 'rgba(0,212,168,0.1)' : 'transparent',
                            border: `1px solid ${isSel ? '#00D4A8' : 'rgba(255,255,255,0.12)'}`,
                            color: isSel ? '#00D4A8' : '#8B949E',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 150ms ease-out'
                          }}
                        >
                          {cityName}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <button
                      type="button"
                      onClick={handleRemoteSelect}
                      style={{
                        background: isRemote ? 'rgba(0,212,168,0.1)' : 'transparent',
                        border: `1px solid ${isRemote ? '#00D4A8' : 'rgba(255,255,255,0.12)'}`,
                        color: isRemote ? '#00D4A8' : '#8B949E',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 150ms ease-out',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>+</span>
                      <span>I work remotely / Pan-India</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!city && !citySearch && !isRemote}
                    onClick={handleCityContinue}
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#00D4A8',
                      color: '#080A0E',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '14px',
                      letterSpacing: '0.04em',
                      cursor: (!city && !citySearch && !isRemote) ? 'not-allowed' : 'pointer',
                      opacity: (!city && !citySearch && !isRemote) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms ease-out'
                    }}
                  >
                    Continue →
                  </button>
                </motion.div>
              )}

              {/* STEP 3: PRIMARY INTENT & VALUE ROUTING */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ width: '100%', maxWidth: '580px' }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#F0F6FC', margin: '0 0 8px 0' }}>
                      What brings you to Certifyd?
                    </h1>
                    <p style={{ fontSize: '15px', color: '#8B949E', margin: 0 }}>
                      We&apos;ll show you the most relevant tool first.
                    </p>
                  </div>

                  {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(248,81,73,0.1)', border: '1px solid #F85149', borderRadius: '8px', color: '#F85149', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    {intentCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        disabled={busy}
                        onClick={() => handleIntentSelect(card)}
                        style={{
                          background: '#0F1218',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '10px',
                          padding: '24px',
                          textAlign: 'left',
                          cursor: busy ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          transition: 'all 200ms ease-out',
                          outline: 'none',
                          width: '100%'
                        }}
                        onMouseOver={(e) => {
                          if (!busy) e.currentTarget.style.borderColor = '#00D4A8';
                        }}
                        onMouseOut={(e) => {
                          if (!busy) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '500', color: '#F0F6FC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#00D4A8' }}>→</span>
                            <span>{card.title}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#8B949E', fontFamily: 'JetBrains Mono, monospace', paddingLeft: '20px' }}>
                            &ldquo;{card.dest}&rdquo;
                          </div>
                        </div>
                        {busy ? (
                          <span style={{ width: '18px', height: '18px', border: '2px solid #00D4A8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        ) : (
                          <span style={{ fontSize: '18px', color: '#8B949E' }}>›</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

        </AnimatePresence>
      </main>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
