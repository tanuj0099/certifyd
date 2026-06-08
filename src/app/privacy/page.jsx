'use client';

import React from 'react';
import MarketingPageShell from '@/components/MarketingPageShell.jsx';
import SEOHead from '@/components/SEOHead.jsx';

const FH = "var(--font-head)";
const FB = "var(--font-body)";

export default function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Certify"
        description="Privacy Policy for Certify ROI Calculator."
        path="/privacy"
      />
      <MarketingPageShell
        title="Privacy Policy"
        subtitle="Last Updated: June 2026"
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: FB, color: 'var(--text-3)', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>1. Information We Collect</h2>
            <p style={{ marginBottom: '16px' }}>When you use Certify, we may collect information such as your account details (email, name), usage data (searches, calculators used, preferences), and device information (browser type, IP address) to improve our service.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>2. How We Use Your Information</h2>
            <p style={{ marginBottom: '16px' }}>We use the collected data to provide, maintain, and improve our services, including personalization of career recommendations and calculating more accurate market trends.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>3. Information Sharing</h2>
            <p style={{ marginBottom: '16px' }}>We do not sell your personal information to third parties. We may share anonymized, aggregated data with partners for industry research or to improve our market intelligence models.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>4. Data Security</h2>
            <p style={{ marginBottom: '16px' }}>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>5. DPDP Act Compliance & Data Minimization</h2>
            <p style={{ marginBottom: '16px' }}>We strictly adhere to Data Minimization. We do not store your name, email (other than for secure authentication), or phone number from uploaded documents. Our AI extracts only professional and financial metrics to calculate accurate market benchmarks. Your identity is completely anonymized in our database.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>6. Your Rights</h2>
            <p style={{ marginBottom: '16px' }}>Depending on your location, you may have the right to access, correct, or delete your personal data. You can manage your account settings or contact us directly to exercise these rights.</p>
          </section>
        </div>
      </MarketingPageShell>
    </>
  );
}
