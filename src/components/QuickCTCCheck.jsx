'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const CITIES = [
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Mumbai',
  'Delhi NCR',
  'Remote',
];

const POPULAR_ROLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Full Stack Engineer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
];

export default function QuickCTCCheck() {
  const [currentBase, setCurrentBase] = useState('');
  const [variablePay, setVariablePay] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [role, setRole] = useState('Software Engineer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const baseNum = Number(currentBase.replace(/,/g, ''));
    const varNum = Number((variablePay || '0').replace(/,/g, ''));

    if (isNaN(baseNum) || baseNum <= 0) {
      setError('Please enter your valid current base salary in INR.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBase: baseNum,
          variablePay: varNum,
          city,
          role: role.trim() || 'Software Engineer',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze CTC');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatLPA = (val) => {
    const num = Number(val || 0);
    if (!num) return '₹0';
    return `₹${(num / 1_00_000).toFixed(2)} LPA`;
  };

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Header Copy */}
      <div className="text-center mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D4A8]/10 border border-[#00D4A8]/20 text-[#00D4A8] text-xs font-mono font-medium tracking-wider uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>10-Second Compensation Check</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text)] font-sans mb-3">
          Are you underpaid? Find out in 10 seconds.
        </h1>
        <p className="text-base sm:text-lg text-[var(--text)]/70 max-w-xl mx-auto">
          Compare your current CTC instantly against live verified market compensation benchmarks across Indian tech hubs.
        </p>
      </div>

      {/* Main Interactive Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl relative overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role & City Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text)]/70 mb-2">
                Your Current Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text)]/40 focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/50 transition text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text)]/70 mb-2">
                City / Location
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/50 transition text-sm font-medium"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-[var(--surface)] text-[var(--text)]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text)]/70 mb-2">
                Current Base Salary (INR / Annum)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text)]/50 font-mono text-sm">₹</span>
                <input
                  type="number"
                  value={currentBase}
                  onChange={(e) => setCurrentBase(e.target.value)}
                  placeholder="1800000"
                  required
                  min="10000"
                  step="1000"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text)]/40 focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/50 transition text-sm font-mono font-medium"
                />
              </div>
              <span className="text-[11px] font-mono text-[var(--text)]/50 mt-1 block">
                {currentBase ? formatLPA(currentBase) : 'e.g., 18,00,000 (18 LPA)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text)]/70 mb-2">
                Variable / Bonus Pay (INR / Annum)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text)]/50 font-mono text-sm">₹</span>
                <input
                  type="number"
                  value={variablePay}
                  onChange={(e) => setVariablePay(e.target.value)}
                  placeholder="200000"
                  min="0"
                  step="1000"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text)]/40 focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/50 transition text-sm font-mono font-medium"
                />
              </div>
              <span className="text-[11px] font-mono text-[var(--text)]/50 mt-1 block">
                {variablePay ? formatLPA(variablePay) : 'Optional (0 if none)'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-[#00D4A8] hover:bg-[#00c29a] text-[#080A0E] font-semibold text-base shadow-lg shadow-[#00D4A8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#080A0E]/30 border-t-[#080A0E] rounded-full animate-spin" />
                Analyzing Market Benchmarks...
              </span>
            ) : (
              <>
                <span>Check My Market Standing</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Dynamic Results Display Area */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="pt-6 border-t border-[var(--border)]"
            >
              {/* Dynamic Result Headline */}
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2 font-sans">
                  You&apos;re in the <span className="text-[#00D4A8]">{result.percentile}th percentile</span> for {result.role} in {result.city}.
                </h2>
                {result.percentile < 50 && result.estimatedGap && (
                  <p className="text-sm sm:text-base text-[var(--text)]/80 mt-1.5 font-medium">
                    That likely means you&apos;re leaving <span className="font-mono font-semibold text-amber-500">₹{result.estimatedGap}</span> on the table. Upload your offer letter to find out exactly where.
                  </p>
                )}
              </div>

              {/* Visual Percentile Bar */}
              <div className="bg-[var(--bg)] p-4 sm:p-5 rounded-xl border border-[var(--border)] mb-6">
                <div className="flex justify-between text-xs font-mono text-[var(--text)]/60 mb-2">
                  <span>Entry (10th)</span>
                  <span>Market Median (50th)</span>
                  <span>Top Tier (90th)</span>
                </div>
                <div className="relative h-4 w-full rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(5, Math.min(95, result.percentile))}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-[#00D4A8]"
                  />
                  {/* Median marker line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[var(--text)]/30" title="50th Percentile Median" />
                </div>
                <div className="mt-2.5 flex justify-between items-center text-xs font-mono text-[var(--text)]/70">
                  <span>Your CTC: <strong className="text-[var(--text)]">{formatLPA(result.totalCTC)}</strong></span>
                  <span className="text-[#00D4A8] font-bold">Percentile: {result.percentile}%</span>
                </div>
              </div>

              {/* Single Call To Action */}
              <div className="text-center">
                <Link
                  href="/offer-analysis"
                  className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#00bda6] text-[#080A0E] font-bold text-sm sm:text-base shadow-xl shadow-[#00D4A8]/25 hover:scale-[1.01] transition-transform"
                >
                  <span>Upload your offer letter to see exactly where you&apos;re losing money</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
