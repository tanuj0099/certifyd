'use client';

import React from 'react';
import MarketingPageShell from '@/components/MarketingPageShell.jsx';
import SEOHead from '@/components/SEOHead.jsx';

const FH = "var(--font-head)";
const FB = "var(--font-body)";

export default function CookiesPage() {
  return (
    <>
      <SEOHead
        title="Cookie Policy | Certifyd"
        description="Cookie Policy for Certifyd."
        path="/cookies"
      />
      <MarketingPageShell
        title="Cookie Policy"
        subtitle="Last Updated: June 2026"
        eyebrow="POLICY"
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: FB, color: 'var(--text-3)', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>1. What Are Cookies?</h2>
            <p style={{ marginBottom: '16px' }}>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They allow the website to remember your actions and preferences (such as login, language, font size and other display preferences) over a period of time.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>2. How We Use Cookies</h2>
            <p style={{ marginBottom: '16px' }}>We use cookies to enhance your browsing experience, provide secure login, and save your preferences. We do NOT use tracking cookies or sell your data to third parties.</p>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>3. Types of Cookies We Use</h2>
            <ul style={{ marginBottom: '16px', listStyleType: 'disc', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as logging in or filling in forms.</li>
              <li style={{ marginBottom: '8px' }}><strong>Functional Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: FH, color: 'var(--text)', fontSize: '24px', marginBottom: '16px' }}>4. Managing Cookies</h2>
            <p style={{ marginBottom: '16px' }}>You can control and/or delete cookies as you wish – for details, see aboutcookies.org. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.</p>
          </section>
        </div>
      </MarketingPageShell>
    </>
  );
}
