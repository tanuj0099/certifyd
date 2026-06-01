'use client';

import React from 'react';
import MarketingPageShell from '@/components/MarketingPageShell.jsx';
import SEOHead from '@/components/SEOHead.jsx';

const FH = "var(--font-head)";
const FB = "var(--font-body)";

export default function TermsPage() {
  return (
    <>
      <SEOHead
        title="Terms of Service | Certify"
        description="Terms of Service for Certify ROI Calculator."
        path="/terms"
      />
      <MarketingPageShell
        title="Terms of Service"
        subtitle="Last Updated: June 2026"
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: FB, color: 'var(--text-3)', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '16px' }}>By accessing and using Certify ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>2. Use of Services</h2>
            <p style={{ marginBottom: '16px' }}>Certify provides career tools, certification ROI calculations, and market demand insights based on publicly available data and user-reported metrics. The information provided is for educational and informational purposes only and does not constitute guaranteed career outcomes or financial advice.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>3. User Accounts</h2>
            <p style={{ marginBottom: '16px' }}>To access certain features, you may need to register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>4. Data Privacy</h2>
            <p style={{ marginBottom: '16px' }}>Your use of the Platform is also governed by our Privacy Policy. By using the Platform, you consent to the collection and use of information as detailed in our Privacy Policy.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>5. Intellectual Property</h2>
            <p style={{ marginBottom: '16px' }}>All content, features, and functionality of the Platform, including but not limited to design, text, graphics, algorithms, and models, are owned by Certify and are protected by international copyright, trademark, and other intellectual property laws.</p>
          </section>
        </div>
      </MarketingPageShell>
    </>
  );
}
