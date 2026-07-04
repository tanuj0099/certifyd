'use client';

import React, { useState, useEffect } from 'react';
import { loginAction } from '../../../actions/authActions';
import { Shield, Lock, User, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        setLockedUntil(null);
        setError(null);
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
        if (res.lockedUntil) {
          setLockedUntil(res.lockedUntil);
        }
      }
    } catch (err: any) {
      // If redirect happens, it will throw a NEXT_REDIRECT error which is expected
      if (!err.message?.includes('NEXT_REDIRECT') && !err.digest?.includes('NEXT_REDIRECT')) {
        setError('An unexpected network error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080A0E] text-[#F0F6FC] flex flex-col items-center justify-center p-4 selection:bg-[#00D4A8]/30 font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,212,168,0.08),rgba(255,255,255,0))] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#00D4A8]/10 border border-[#00D4A8]/20 flex items-center justify-center text-[#00D4A8]">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Certifyd Ops</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#161B22] text-[#8B949E] border border-white/5 font-mono">
            SECURE ACCESS
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-[#0F1218] border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/80 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00D4A8] to-transparent opacity-60" />

          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">Admin Authentication</h1>
            <p className="text-sm text-[#8B949E] mt-1">
              Enter your privileged credentials. All sessions are monitored and rate limited.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#F85149]/10 border border-[#F85149]/20 flex items-start gap-3 text-sm text-[#F85149]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Authentication Failed</p>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
                {lockedUntil && (
                  <p className="text-xs font-mono mt-2 pt-2 border-t border-[#F85149]/20 font-semibold">
                    Lockout expires in: {timeLeft}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5 uppercase tracking-wider font-mono">
                Admin Email / Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
                <input
                  type="text"
                  name="username"
                  required
                  disabled={!!lockedUntil || loading}
                  placeholder="admin@certifyd.in"
                  className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#00D4A8] transition-colors disabled:opacity-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5 uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
                <input
                  type="password"
                  name="password"
                  required
                  disabled={!!lockedUntil || loading}
                  placeholder="••••••••••••••••"
                  className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8B949E]/50 focus:outline-none focus:border-[#00D4A8] transition-colors disabled:opacity-50 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!!lockedUntil || loading}
              className="w-full mt-2 bg-[#00D4A8] hover:bg-[#00D4A8]/90 active:bg-[#00D4A8]/80 text-[#080A0E] font-medium py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#00D4A8]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#080A0E]/30 border-t-[#080A0E] rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize Session</span>
                </>
              )}
            </button>
          </form>

          {/* Security details footers */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Layer 1: Cloudflare Access Protected</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Layer 2: bcrypt 8-Hour Signed Session</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              <Terminal className="w-3.5 h-3.5 text-[#E8C547]" />
              <span className="font-mono text-[11px]">Upstash Rate Limit: 5 attempts / 15m</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#8B949E]/60 mt-6 font-mono">
          Certifyd Ops v1.0.0 • No connection to public domain
        </p>
      </div>
    </div>
  );
}
