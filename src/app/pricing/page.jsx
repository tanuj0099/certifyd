'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, ArrowRight, Sparkles, Lock } from 'lucide-react';
import MarketingPageShell from '@/components/MarketingPageShell.jsx';
import Link from 'next/link';

const F_HEAD = "var(--font-head)";
const F_BODY = "var(--font-body)";
const F_MONO = "var(--font-mono)";

const FREE_DIAGNOSIS_FEATURES = [
  '10-Second Quick CTC Check (no upload required)',
  'Instant Percentile Gap Diagnosis across 8 metros',
  'Shows exactly where your CTC ranks against live benchmarks',
  'Calculates annual money left on the table',
  'Loss aversion 5-year career trajectory projection',
  'DPDP Act 2023 compliant anonymous analysis',
];

const ARSENAL_FEATURES = [
  'Analyze & Auto-Delete synchronous offer letter extraction',
  'Custom copy-pasteable negotiation counter-offer email script',
  '12-point granular structural component CTC breakdown',
  'Hidden deduction, clawback & employer PF trap detection',
  'Resume context & gap analysis against target role benchmarks',
  'Zero file retention with verifiable server deletion timestamp',
];

export default function PricingPage() {
  return (
    <MarketingPageShell
      eyebrow="PRICING & TIERS"
      title="Transparent & High-ROI"
      accent="No Catch"
      subtitle="Start free with the diagnosis, or unlock the complete Counter-Offer Arsenal to negotiate your compensation with hard data."
    >
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '12px 0 36px',
      }}>
        {/* Pricing Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {/* Free Tier: The Diagnosis */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="p-7 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-mono text-[var(--text)]/70 uppercase tracking-wider mb-4">
                <span>Free Tier</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2 font-sans">
                The Diagnosis
              </h2>
              <p className="text-sm text-[var(--text)]/70 mb-6 font-medium">
                Shows the percentile gap, doesn&apos;t show the fix.
              </p>

              <div className="mb-6 pb-6 border-b border-[var(--border)]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[var(--text)] font-sans">₹0</span>
                  <span className="text-xs font-mono text-[var(--text)]/60 uppercase">/ forever</span>
                </div>
              </div>

              <ul className="space-y-3.5 mb-8">
                {FREE_DIAGNOSIS_FEATURES.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00D4A8] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--text)]/80 leading-relaxed font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link
                href="/tools/quick-check"
                className="w-full py-3.5 px-6 rounded-xl bg-[var(--bg)] hover:bg-[var(--bg)]/80 border border-[var(--border)] text-[var(--text)] font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Check My Standing Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* ₹99 Tier: The Counter-Offer Arsenal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="p-7 sm:p-8 rounded-2xl border-2 border-[#00D4A8] bg-[var(--surface)] flex flex-col justify-between shadow-2xl relative overflow-hidden"
          >
            {/* Recommended Corner Ribbon */}
            <div className="absolute top-0 right-0 bg-[#00D4A8] text-[#080A0E] text-[10px] font-mono font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl">
              High Leverage
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4A8]/10 border border-[#00D4A8]/30 text-[#00D4A8] text-xs font-mono uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>₹99 Tier</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2 font-sans">
                The Counter-Offer Arsenal
              </h2>
              <p className="text-sm text-[var(--text)]/70 mb-6 font-medium">
                Negotiation script, component breakdown, resume gap analysis.
              </p>

              <div className="mb-6 pb-6 border-b border-[var(--border)]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[var(--text)] font-sans">₹99</span>
                  <span className="text-xs font-mono text-[var(--text)]/60 uppercase">/ one-time unlock</span>
                </div>
              </div>

              <ul className="space-y-3.5 mb-8">
                {ARSENAL_FEATURES.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00D4A8] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--text)]/90 leading-relaxed font-semibold">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {/* Required Anchor Line */}
              <p className="text-xs sm:text-sm font-mono font-bold text-[#00D4A8] text-center mb-3">
                ₹99 to potentially negotiate ₹50,000 more. Do the math.
              </p>

              <Link
                href="/offer-analysis"
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#00D4A8] to-[#00bda6] hover:opacity-95 text-[#080A0E] font-extrabold text-base shadow-xl shadow-[#00D4A8]/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Unlock the Arsenal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Security / Compliance Note */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--text)]/60">
            <Lock className="w-3.5 h-3.5 text-[#00D4A8]" />
            <span>DPDP Act 2023 Compliant • All source files deleted synchronously after extraction</span>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
