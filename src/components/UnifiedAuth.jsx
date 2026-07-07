'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function SvgCheck12() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="#00D4A8" strokeWidth="1.5" />
      <path d="M5 8.5L7 10.5L11 6" stroke="#00D4A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgCheck16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="#00D4A8" strokeWidth="1.5" />
      <path d="M5 8.5L7 10.5L11 6" stroke="#00D4A8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgArrow({ color = '#080A0E' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="arrow-icon" style={{ flexShrink: 0 }}>
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgCheckSmall({ color = '#00D4A8' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3.5 8L6.5 11L12.5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgDotSmall({ color = '#8B949E' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="2.5" fill={color} />
    </svg>
  );
}

export default function UnifiedAuth({ initialMode = 'login' }) {
  const { checkEmailExists, signInEmail, signUpEmail, signInGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next') || '/dashboard';

  const [step, setStep] = useState('email'); // 'email' | 'password-signin' | 'password-signup' | 'verify-email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [shakeError, setShakeError] = useState(false);

  // Verification state cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const triggerError = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  async function handleEmailSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !email.includes('@')) {
      triggerError('Please enter a valid work or college email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setStep('password-signin');
      } else {
        setStep('password-signup');
      }
    } catch (err) {
      setStep(initialMode === 'signup' ? 'password-signup' : 'password-signin');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignInSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!password) {
      triggerError('Please enter your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signInEmail(email.trim(), password);
      router.push(nextPath, { replace: true });
    } catch (err) {
      const msg = err?.message || 'Sign in failed.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setStep('verify-email');
        setResendCooldown(60);
      } else {
        triggerError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUpSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!password || getPasswordStrength(password).score < 3) {
      triggerError('Please create a stronger password to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUpEmail(email.trim(), password);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/onboarding', { replace: true });
      } else {
        setStep('verify-email');
        setResendCooldown(60);
      }
    } catch (err) {
      const msg = err?.message || 'Account creation failed.';
      if (msg.toLowerCase().includes('already registered')) {
        setStep('password-signin');
        triggerError('This account already exists. Please enter your password to sign in.');
      } else {
        triggerError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (supabase) {
        await supabase.auth.resend({
          type: 'signup',
          email: email.trim()
        });
      }
      setResendCooldown(60);
    } catch (err) {
      triggerError('Could not resend verification email. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleOAuth() {
    setBusy(true);
    setError(null);
    try {
      await signInGoogle({ redirectTo: `${window.location.origin}/onboarding` });
    } catch (err) {
      triggerError(err?.message || 'Google OAuth failed.');
      setBusy(false);
    }
  }

  // Password strength calculation
  function getPasswordStrength(pwd) {
    const hasLen = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpec = /[!@#$%^&*(),.?":{}|<>\-_+=\/\\]/.test(pwd);

    let criteriaCount = (hasLen ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
    let score = 0;
    if (pwd.length > 0) {
      if (criteriaCount === 0) score = 1;
      else if (criteriaCount === 1) score = 2;
      else if (criteriaCount === 2) score = 3;
      else if (criteriaCount === 3) score = 4;
    }

    const labels = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['rgba(255,255,255,0.06)', '#F85149', '#F59E0B', '#E8C547', '#00D4A8'];
    return {
      score,
      label: labels[score],
      color: colors[score],
      hasLen,
      hasNum,
      hasSpec
    };
  }

  const strength = getPasswordStrength(password);
  const allCriteriaMet = strength.hasLen && strength.hasNum && strength.hasSpec;
  const showRequirements = passwordFocused || (password.length > 0 && !allCriteriaMet);

  const trustSignals = [
    'DPDP Act 2023 Compliant',
    'Offer letters never stored',
    'Your data is never sold'
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#080A0E', color: '#F0F6FC', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LEFT PANEL (Desktop >= 1024px) */}
      <div className="hidden lg:flex" style={{
        width: '40%',
        minWidth: '380px',
        maxWidth: '480px',
        background: '#080A0E',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '40px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* Top Section */}
        <div>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#00D4A8', letterSpacing: '0.15em' }}>
              CERTIFYD
            </div>
          </Link>
          <div style={{ marginTop: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '14px', color: '#8B949E', lineHeight: 1.6 }}>
            The only platform that tracks whether Indian IT certifications actually work.
          </div>
        </div>

        {/* Middle Section: 3 Stat Cards Stacked Vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: 'auto 0' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#4B5563', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 600 }}>
              CERTIFICATIONS TRACKED
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '22px', color: '#F0F6FC', marginBottom: '2px' }}>
              4,200+
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '11px', color: '#8B949E' }}>
              across 8 Indian cities
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#4B5563', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 600 }}>
              OFFER LETTERS ANALYZED
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '22px', color: '#F0F6FC', marginBottom: '2px' }}>
              ₹1.2Cr+
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '11px', color: '#8B949E' }}>
              in salary negotiations supported
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '14px 16px'
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#4B5563', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 600 }}>
              AVG BREAK-EVEN PERIOD
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '22px', color: '#F0F6FC', marginBottom: '2px' }}>
              &lt; 2 months
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '11px', color: '#8B949E' }}>
              for top-rated certifications in Bengaluru
            </div>
          </div>
        </div>

        {/* Bottom Section: 3 Trust Signals Stacked Vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          {trustSignals.map((signal, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SvgCheck12 />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '11px', color: '#6B7280' }}>
                {signal}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1,
        background: '#0F1218',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 24px',
        position: 'relative'
      }}>
        
        {/* Mobile top header (< 1024px) */}
        <div className="flex lg:hidden" style={{ width: '100%', maxWidth: '380px', marginBottom: '32px', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#00D4A8', letterSpacing: '0.15em' }}>
              CERTIFYD
            </div>
          </Link>
          <div style={{ marginTop: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '13px', color: '#8B949E', lineHeight: 1.5 }}>
            The only platform that tracks whether Indian IT certifications actually work.
          </div>
        </div>

        {/* Form Container */}
        <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
          
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '22px', color: '#F0F6FC', margin: '0 0 6px 0' }}>
                  {initialMode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h1>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '14px', color: '#8B949E', margin: '0 0 24px 0' }}>
                  {initialMode === 'signup' ? 'Enter your email to set up your workspace' : 'Sign in to your Certifyd workspace'}
                </p>

                <form onSubmit={handleEmailSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="email"
                      required
                      placeholder="Work or college email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#161B22',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        padding: '0 14px',
                        color: '#F0F6FC',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 150ms ease-out',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00D4A8'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                  </div>

                  {error && (
                    <motion.div
                      animate={shakeError ? { x: [-3, 3, -3, 3, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      style={{ padding: '10px 14px', background: 'rgba(248,81,73,0.1)', border: '1px solid #F85149', borderRadius: '6px', color: '#F85149', fontSize: '13px', marginBottom: '16px' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="submit-btn group"
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#00D4A8',
                      color: '#080A0E',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '14px',
                      letterSpacing: '0.04em',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 150ms ease-out'
                    }}
                  >
                    {busy ? (
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: '#080A0E', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    ) : (
                      <>
                        <span>Continue</span>
                        <SvgArrow color="#080A0E" />
                      </>
                    )}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: '#8B949E', fontSize: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ padding: '0 12px' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  disabled={busy}
                  style={{
                    width: '100%',
                    height: '44px',
                    background: '#FFFFFF',
                    color: '#080A0E',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    fontWeight: 500,
                    fontSize: '14px',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 150ms ease-out'
                  }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              </motion.div>
            )}

            {step === 'password-signin' && (
              <motion.div
                key="step-signin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Confirmed Email Display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0,212,168,0.06)',
                  border: '1px solid rgba(0,212,168,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <SvgCheck16 />
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#F0F6FC',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setError(null); setStep('email'); }}
                    style={{
                      fontSize: '12px',
                      color: '#00D4A8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      flexShrink: 0
                    }}
                  >Edit</button>
                </div>

                <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '22px', color: '#F0F6FC', margin: '0 0 6px 0' }}>
                  Welcome back
                </h1>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '14px', color: '#8B949E', margin: '0 0 24px 0' }}>
                  Enter your password to sign in
                </p>

                <form onSubmit={handleSignInSubmit}>
                  <div style={{ marginBottom: '8px', position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#161B22',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        padding: '0 40px 0 14px',
                        color: '#F0F6FC',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 150ms ease-out',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00D4A8'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#8B949E', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <Link href="/forgot-password" style={{ fontSize: '12px', color: '#8B949E', textDecoration: 'none' }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                      Forgot password?
                    </Link>
                  </div>

                  {error && (
                    <motion.div
                      animate={shakeError ? { x: [-3, 3, -3, 3, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      style={{ padding: '10px 14px', background: 'rgba(248,81,73,0.1)', border: '1px solid #F85149', borderRadius: '6px', color: '#F85149', fontSize: '13px', marginBottom: '16px' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="submit-btn group"
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#00D4A8',
                      color: '#080A0E',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '14px',
                      letterSpacing: '0.04em',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 150ms ease-out'
                    }}
                  >
                    {busy ? (
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: '#080A0E', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    ) : (
                      <>
                        <span>Sign in</span>
                        <SvgArrow color="#080A0E" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'password-signup' && (
              <motion.div
                key="step-signup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Confirmed Email Display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0,212,168,0.06)',
                  border: '1px solid rgba(0,212,168,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <SvgCheck16 />
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#F0F6FC',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setError(null); setStep('email'); }}
                    style={{
                      fontSize: '12px',
                      color: '#00D4A8',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      flexShrink: 0
                    }}
                  >Edit</button>
                </div>

                <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '22px', color: '#F0F6FC', margin: '0 0 24px 0' }}>
                  Create your account
                </h1>

                <form onSubmit={handleSignUpSubmit}>
                  <div style={{ marginBottom: '12px', position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create a password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={(e) => { setPasswordFocused(true); e.target.style.borderColor = '#00D4A8'; }}
                      onBlur={(e) => { setPasswordFocused(false); e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#161B22',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        padding: '0 40px 0 14px',
                        color: '#F0F6FC',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 150ms ease-out',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#8B949E', fontSize: '12px', cursor: 'pointer' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {/* Password Strength Bar: 4 segments */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {[1, 2, 3, 4].map((idx) => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: idx <= strength.score && password.length > 0 ? strength.color : 'rgba(255,255,255,0.06)',
                            transition: 'background 200ms ease-out'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ color: strength.color, fontWeight: 400 }}>{strength.label}</span>
                    </div>
                  </div>

                  {/* Focus Requirements Checklist */}
                  <AnimatePresence>
                    {showRequirements && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', fontSize: '12px', overflow: 'hidden' }}
                      >
                        <div style={{ color: strength.hasLen ? '#00D4A8' : '#8B949E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {strength.hasLen ? <SvgCheckSmall color="#00D4A8" /> : <SvgDotSmall color="#8B949E" />}
                          <span>8+ characters</span>
                        </div>
                        <div style={{ color: strength.hasNum ? '#00D4A8' : '#8B949E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {strength.hasNum ? <SvgCheckSmall color="#00D4A8" /> : <SvgDotSmall color="#8B949E" />}
                          <span>One number</span>
                        </div>
                        <div style={{ color: strength.hasSpec ? '#00D4A8' : '#8B949E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {strength.hasSpec ? <SvgCheckSmall color="#00D4A8" /> : <SvgDotSmall color="#8B949E" />}
                          <span>One special character</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <motion.div
                      animate={shakeError ? { x: [-3, 3, -3, 3, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      style={{ padding: '10px 14px', background: 'rgba(248,81,73,0.1)', border: '1px solid #F85149', borderRadius: '6px', color: '#F85149', fontSize: '13px', marginBottom: '16px' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={busy || strength.score < 3}
                    className="submit-btn group"
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#00D4A8',
                      color: '#080A0E',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '14px',
                      letterSpacing: '0.04em',
                      cursor: (busy || strength.score < 3) ? 'not-allowed' : 'pointer',
                      opacity: (busy || strength.score < 3) ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '16px',
                      transition: 'all 150ms ease-out'
                    }}
                  >
                    {busy ? (
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: '#080A0E', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    ) : (
                      <>
                        <span>Create account</span>
                        <SvgArrow color="#080A0E" />
                      </>
                    )}
                  </button>

                  <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: 1.5, textAlign: 'center' }}>
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" style={{ color: '#8B949E', textDecoration: 'underline' }}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" style={{ color: '#8B949E', textDecoration: 'underline' }}>Privacy Policy</Link>.
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'verify-email' && (
              <motion.div
                key="step-verify"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ width: '100%', textAlign: 'center' }}
              >
                {/* Top Icon: SVG envelope built from scratch */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <rect x="4" y="12" width="40" height="28" rx="4" fill="none" stroke="#00D4A8" strokeWidth="2" />
                    <path d="M4 16 L24 28 L44 16" fill="none" stroke="#00D4A8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '24px', color: '#F0F6FC', textAlign: 'center', margin: '0 0 16px 0' }}>
                  Check your inbox
                </h1>

                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '14px', color: '#8B949E', lineHeight: 1.5 }}>
                    We sent a verification link to
                  </div>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#F0F6FC',
                    maxWidth: '280px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    margin: '2px auto 0 auto'
                  }}>
                    {email}
                  </span>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '14px', color: '#8B949E', marginTop: '8px' }}>
                    Click it to activate your account.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || busy}
                    className={resendCooldown <= 0 && !busy ? 'resend-btn-active' : ''}
                    style={{
                      width: '100%',
                      height: '44px',
                      background: 'transparent',
                      border: `1px solid ${resendCooldown > 0 || busy ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                      color: resendCooldown > 0 || busy ? '#4B5563' : '#F0F6FC',
                      borderRadius: '6px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      cursor: resendCooldown > 0 || busy ? 'not-allowed' : 'pointer',
                      transition: 'all 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {busy ? (
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: '#F0F6FC', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    ) : (
                      resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setError(null); setStep('email'); }}
                    className="change-email-link group"
                    style={{
                      marginTop: '16px',
                      background: 'transparent',
                      border: 'none',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '13px',
                      color: '#8B949E',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                      transition: 'color 150ms ease'
                    }}
                  >
                    <span className="link-text">Use a different email</span>
                    <SvgArrow color="currentColor" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Mobile Trust Signals (< 1024px) */}
        <div className="flex lg:hidden" style={{ marginTop: '48px', width: '100%', maxWidth: '380px', flexDirection: 'column', gap: '8px', alignItems: 'center', fontSize: '11px', color: '#6B7280', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
          {trustSignals.map((signal, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SvgCheck12 />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '11px', color: '#6B7280' }}>
                {signal}
              </span>
            </div>
          ))}
        </div>

      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .submit-btn:hover .arrow-icon {
          transform: translateX(3px);
        }
        .arrow-icon {
          transition: transform 200ms ease;
        }
        .resend-btn-active:hover {
          background: rgba(255,255,255,0.04) !important;
        }
        .change-email-link:hover {
          color: #F0F6FC !important;
        }
        .change-email-link:hover .link-text {
          text-decoration: underline;
        }
        .change-email-link:hover .arrow-icon {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  );
}
