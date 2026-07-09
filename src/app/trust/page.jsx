'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Trash2,
  Lock,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import MarketingPageShell from '@/components/MarketingPageShell.jsx';

export default function TrustPage() {
  const { user, session } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteMyData = async () => {
    if (!user && !session) {
      setDeleteError('Please sign in to delete your account data, or email privacy@certifyd.in for anonymous erasure.');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete 100% of your data from Certifyd? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const token = session?.access_token || user?.token;
      const res = await fetch('/api/account/delete-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to erase data');
      }

      setDeleteSuccess(true);
    } catch (err) {
      setDeleteError(err.message || 'Error erasing data.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MarketingPageShell
      eyebrow="DPDP ACT 2023 COMPLIANCE CHARTER"
      title="Trust & Data Erasure"
      accent="Guarantee"
      subtitle="Plain language, zero legal boilerplate. Here is exactly what we collect, why we collect it, how long we keep it, and how you can delete everything in one click."
    >
      <div className="max-w-4xl mx-auto py-4 space-y-8">
        {/* Section 1: What We Collect */}
        <div className="p-7 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00D4A8]/10 text-[#00D4A8] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
              1. What We Collect
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[var(--text)]/80 leading-relaxed mb-4">
            When you use our Counter-Offer Arsenal or Quick CTC Check, we extract only specific, structured compensation data points:
          </p>
          <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] font-mono text-xs sm:text-sm text-[#00D4A8] space-y-1">
            <p>• Base salary</p>
            <p>• Variable pay</p>
            <p>• Joining date</p>
            <p>• Employer name</p>
            <p>• Work city / location</p>
          </div>
          <p className="text-xs text-[var(--text)]/60 mt-3">
            We never extract or retain candidate personally identifiable information (PII) such as your home address, government ID numbers, personal phone numbers, or signature blocks.
          </p>
        </div>

        {/* Section 2: Why We Collect It */}
        <div className="p-7 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00D4A8]/10 text-[#00D4A8] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
              2. Why We Collect It
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[var(--text)]/80 leading-relaxed">
            We collect these structured data points for strictly two purposes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <h4 className="font-bold text-sm text-[var(--text)] mb-1">Fraud Detection</h4>
              <p className="text-xs text-[var(--text)]/70">
                To verify that salary submissions are authentic job offers rather than manipulated outlier numbers.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <h4 className="font-bold text-sm text-[var(--text)] mb-1">Salary Benchmarking</h4>
              <p className="text-xs text-[var(--text)]/70">
                To anonymously power India&apos;s most accurate real-time compensation distribution indices.
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-[var(--text)]/70 mt-4">
            Nothing else. We do not sell your data to recruiters, employers, or third-party brokers.
          </p>
        </div>

        {/* Section 3: How Long We Keep It */}
        <div className="p-7 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00D4A8]/10 text-[#00D4A8] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
              3. How Long We Keep It (Actual Retention Period)
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[var(--text)]/80 leading-relaxed mb-4">
            Our retention policy is enforced by automated server-side architecture:
          </p>
          <ul className="space-y-3 text-sm text-[var(--text)]/80">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00D4A8] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Source Documents (&lt; 5 seconds):</strong> Uploaded offer letters (PDF/DOCX) are stored in volatile ephemeral storage during extraction and are <strong>deleted synchronously the moment AI extraction completes</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00D4A8] flex-shrink-0 mt-0.5" />
              <span>
                <strong>12 Structured Data Points:</strong> Retained in our encrypted database until you request deletion.
              </span>
            </li>
          </ul>
        </div>

        {/* Section 4: One-Click Delete Everything Flow */}
        <div
          id="delete-data"
          className="p-7 sm:p-8 rounded-2xl border-2 border-red-500/40 bg-[var(--surface)] shadow-xl space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                4. How to Delete Everything (One-Click Erasure)
              </h2>
              <p className="text-xs text-[var(--text)]/60 font-mono">
                DPDP ACT 2023 • RIGHT TO ERASURE
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--text)]/80 leading-relaxed">
            Clicking the button below instantly triggers a cascading server-side deletion across all tables (<code className="text-xs text-[#00D4A8]">offer_analyses</code>, <code className="text-xs text-[#00D4A8]">offer_uploads</code>, <code className="text-xs text-[#00D4A8]">quick_checks</code>, <code className="text-xs text-[#00D4A8]">consents</code>) tied to your account and sends you an automated confirmation email.
          </p>

          {deleteSuccess ? (
            <div className="p-5 rounded-xl bg-[#00D4A8]/10 border border-[#00D4A8] text-[#00D4A8] flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm">All Your Data Has Been Deleted</h4>
                <p className="text-xs text-[var(--text)]/70 mt-0.5">
                  We have permanently erased your account and all associated data records. A confirmation email has been dispatched.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {deleteError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <button
                onClick={handleDeleteMyData}
                disabled={deleting}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Erasing 100% of Your Data...' : 'Delete All My Data Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </MarketingPageShell>
  );
}
