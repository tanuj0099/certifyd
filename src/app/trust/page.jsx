'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Database,
  Clock,
  CheckCircle2,
  Sparkles,
  Server,
  FileCheck,
} from 'lucide-react';
import MarketingPageShell, { GlassCard } from '@/components/MarketingPageShell.jsx';
import SEOHead from '@/components/SEOHead.jsx';

const FB = "var(--font-body)";
const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const T = { duration: 0.34, ease: [0.16, 1, 0.3, 1] };

export default function TrustPage() {
  return (
    <>
      <SEOHead
        title="Trust & Security | Certifyd"
        description="DPDP Act 2023 Compliance & Data Minimization Charter for Certifyd."
        path="/trust"
      />
      <MarketingPageShell
        title="Trust & Security"
        subtitle="DPDP Act 2023 Compliance & Data Minimization Charter. Last Updated: June 2026"
      >
        <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        {/* Section 1: What We Collect */}
        <GlassCard style={{ padding: 'clamp(24px, 4vw, 36px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(0, 212, 168, 0.12)',
                border: '1px solid rgba(0, 212, 168, 0.28)',
                color: '#00D4A8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <div style={{ fontFamily: FM, fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                DATA MINIMIZATION PRINCIPLE
              </div>
              <h2 style={{ fontFamily: FH, fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
                1. What We Collect
              </h2>
            </div>
          </div>

          <p style={{ fontFamily: FB, fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.8', margin: '0 0 18px' }}>
            When you use our Counter-Offer Arsenal or Quick CTC Check, our AI extraction engine processes only specific, structured compensation metrics:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {[
              'Base salary & variable structure',
              'Joining date & timeline',
              'Employer name & industry',
              'Work city & job role',
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontFamily: FB,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D4A8' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <ShieldCheck size={18} style={{ color: '#00D4A8', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontFamily: FB, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: '1.7', margin: 0 }}>
              <strong style={{ color: 'var(--text)' }}>Strict Candidate PII Exclusion:</strong> We never extract or retain personally identifiable information (PII) such as your home address, government ID numbers, personal contact details, or signature blocks.
            </p>
          </div>
        </GlassCard>

        {/* Section 2: Why We Collect It */}
        <GlassCard style={{ padding: 'clamp(24px, 4vw, 36px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(232, 197, 71, 0.12)',
                border: '1px solid rgba(232, 197, 71, 0.28)',
                color: '#E8C547',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontFamily: FM, fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                PURPOSE SPECIFICATION
              </div>
              <h2 style={{ fontFamily: FH, fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
                2. Why We Collect It
              </h2>
            </div>
          </div>

          <p style={{ fontFamily: FB, fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.8', margin: '0 0 20px' }}>
            We collect and process these structured data points for strictly two purposes:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontFamily: FH, fontSize: '16px', fontWeight: '800', color: 'var(--text)', margin: '0 0 8px' }}>
                Fraud Detection & Verification
              </h4>
              <p style={{ fontFamily: FB, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: '1.7', margin: 0 }}>
                To verify that salary submissions represent authentic job offers rather than manipulated outlier numbers, maintaining high-fidelity benchmarks.
              </p>
            </div>
            <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontFamily: FH, fontSize: '16px', fontWeight: '800', color: 'var(--text)', margin: '0 0 8px' }}>
                Real-Time Salary Benchmarking
              </h4>
              <p style={{ fontFamily: FB, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: '1.7', margin: 0 }}>
                To anonymously power India&apos;s most accurate real-time compensation indices across experience bands and tier-1/tier-2 tech hubs.
              </p>
            </div>
          </div>

          <div style={{ fontFamily: FB, fontSize: '14px', fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} style={{ color: '#E8C547' }} />
            <span>We never sell, rent, or broker your compensation data to recruiters, employers, or third parties.</span>
          </div>
        </GlassCard>

        {/* Section 3: How Long We Keep It */}
        <GlassCard style={{ padding: 'clamp(24px, 4vw, 36px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.28)',
                color: '#818CF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontFamily: FM, fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                AUTOMATED PURGE ARCHITECTURE
              </div>
              <h2 style={{ fontFamily: FH, fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
                3. How Long We Keep It (Retention Policy)
              </h2>
            </div>
          </div>

          <p style={{ fontFamily: FB, fontSize: '15px', color: 'var(--text-2)', lineHeight: '1.8', margin: '0 0 20px' }}>
            Our retention enforcement is hardcoded directly into our serverless infrastructure:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '18px 20px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 212, 168, 0.12)', color: '#00D4A8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Server size={18} />
              </div>
              <div>
                <h4 style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', color: 'var(--text)', margin: '0 0 6px' }}>
                  Source Documents (&lt; 5 Seconds Ephemeral Storage)
                </h4>
                <p style={{ fontFamily: FB, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: '1.7', margin: 0 }}>
                  Uploaded offer letters (PDF/DOCX) are loaded exclusively into volatile memory during parsing and extraction. They are <strong style={{ color: 'var(--text)' }}>deleted synchronously the moment AI extraction completes</strong> without ever hitting permanent cloud storage buckets.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '18px 20px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileCheck size={18} />
              </div>
              <div>
                <h4 style={{ fontFamily: FH, fontSize: '15px', fontWeight: '800', color: 'var(--text)', margin: '0 0 6px' }}>
                  Anonymized Structured Benchmarks
                </h4>
                <p style={{ fontFamily: FB, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: '1.7', margin: 0 }}>
                  Extracted compensation records (salary bands, roles, cities) are stripped of candidate identifiers and retained within our encrypted database to power aggregate compensation trends.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
      </MarketingPageShell>
    </>
  );
}
