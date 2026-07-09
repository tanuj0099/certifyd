'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReferralRedirectPage({ params }) {
  const router = useRouter();

  useEffect(() => {
    async function handleReferral() {
      try {
        const resolvedParams = await params;
        const code = resolvedParams?.referralCode;

        if (code && typeof window !== 'undefined') {
          localStorage.setItem('certifyd_referral_code', code);
          // Set cookie for server-side attribution
          document.cookie = `certifyd_referral_code=${code}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } catch (err) {
        // Continue to onboarding redirect
      } finally {
        router.replace('/tools/quick-check');
      }
    }

    handleReferral();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#00D4A8]/30 border-t-[#00D4A8] animate-spin mx-auto" />
        <p className="text-xs font-mono text-[var(--text)]/70">
          Applying referral reward (+50 Leverage Tokens)... Redirecting to Quick CTC Check
        </p>
      </div>
    </div>
  );
}
