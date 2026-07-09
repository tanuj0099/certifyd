'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Share2, Copy, Check, ExternalLink, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';

export default function DashboardTokensAndReferral() {
  const { user, session } = useAuth();
  const [balance, setBalance] = useState(0);
  const [earlyAccessUnlocked, setEarlyAccessUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  // Referral code generated deterministically per user ID or fallback
  const userCode = user?.id ? user.id.slice(0, 8).toUpperCase() : 'CERT2026';
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${userCode}`
    : `https://certifyd.in/r/${userCode}`;

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const token = session?.access_token || user?.token;
        const res = await fetch('/api/tokens/balance', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setBalance(data.balance || 0);
        setEarlyAccessUnlocked(Boolean(data.earlyAccessMarketPulse));
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [user, session]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out Certifyd to benchmark your CTC and analyze job offers with real Indian salary data: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRedeemEarlyAccess = async () => {
    setRedeeming(true);
    setRedeemError('');

    try {
      const token = session?.access_token || user?.token;
      const res = await fetch('/api/tokens/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reward: 'market_pulse_early' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Redemption failed');
      }

      setBalance(data.balance);
      setEarlyAccessUnlocked(true);
      setShowRedeemModal(false);
    } catch (err) {
      setRedeemError(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] my-4">
      {/* Small, Understated Balance Display (Acceptance Criteria: NO gamified widget with animations) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--text)]/80">
          <Coins className="w-4 h-4 text-[#00D4A8]" />
          <span>Leverage Tokens:</span>
          <span className="font-bold text-[var(--text)]">{loading ? '—' : balance}</span>
        </div>

        {earlyAccessUnlocked ? (
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#00D4A8]/15 text-[#00D4A8]">
            Market Pulse Early Access Active
          </span>
        ) : (
          <button
            onClick={() => setShowRedeemModal(true)}
            className="text-xs text-[var(--text-3)] hover:text-[var(--text)] underline transition font-mono"
          >
            Redeem Rewards
          </button>
        )}
      </div>

      {/* Share / Invite Colleague Action (Inside Dashboard) */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={handleCopyLink}
          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text)]/40 text-xs font-medium text-[var(--text)] flex items-center justify-center gap-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00D4A8]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Link' : 'Invite a Colleague'}</span>
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-medium flex items-center gap-1 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Understated Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-md w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text)]">Redeem Leverage Tokens</h3>
            <p className="text-xs text-[var(--text)]/70">
              Spend 500 tokens to unlock early access to weekly Market Pulse data 48 hours before public release.
            </p>

            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between text-xs font-mono">
              <span>Your Balance: {balance} tokens</span>
              <span>Cost: 500 tokens</span>
            </div>

            {redeemError && (
              <p className="text-xs text-red-400">{redeemError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRedeemModal(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemEarlyAccess}
                disabled={redeeming || balance < 500}
                className="px-4 py-2 rounded-lg bg-[#00D4A8] text-[#080A0E] font-bold text-xs disabled:opacity-50"
              >
                {redeeming ? 'Redeeming...' : 'Unlock Early Access (-500)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
