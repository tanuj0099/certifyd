"use client";

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function ConsentManager() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  useEffect(() => {
    // Check initial state
    const checkConsent = () => {
      try {
        const saved = localStorage.getItem('certifyd_cookie_preferences');
        if (saved) {
          const prefs = JSON.parse(saved);
          setHasAnalyticsConsent(!!prefs.analytics);
        } else {
          setHasAnalyticsConsent(false);
        }
      } catch (e) {
        setHasAnalyticsConsent(false);
      }
    };

    checkConsent();

    // Listen for custom event from CookieBanner
    const handleConsentUpdate = () => {
      checkConsent();
    };

    window.addEventListener('certifydConsentUpdated', handleConsentUpdate);
    
    return () => {
      window.removeEventListener('certifydConsentUpdated', handleConsentUpdate);
    };
  }, []);

  if (!hasAnalyticsConsent) {
    return null; // Don't load GA if no consent
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-VMZZP1RZYC`}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-VMZZP1RZYC', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
