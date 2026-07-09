'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Lock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function AutoDeleteUpload({ onComplete }) {
  // States: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  const [state, setState] = useState('idle');
  const [file, setFile] = useState(null);
  const [uploadId, setUploadId] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [deletedAt, setDeletedAt] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  // Phase 4: Standalone DPDP Act 2023 Consent Checkbox (NOT pre-checked)
  const [dpdpConsent, setDpdpConsent] = useState(false);

  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (state !== 'processing') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setError(null);

    // Enforce explicit standalone DPDP consent before allowing upload
    if (!dpdpConsent) {
      setError('Please check the DPDP Act 2023 consent box below before selecting a document.');
      return;
    }

    setFile(selectedFile);

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pdf')) {
      setError('Please upload a valid PDF or DOCX offer letter document.');
      return;
    }

    startUploadAndAnalyze(selectedFile);
  };

  const startUploadAndAnalyze = async (selectedFile) => {
    setState('uploading');
    setCountdown(60);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('consentGranted', 'true');
    formData.append('consentVersion', 'v1.0-dpdp-2023');

    try {
      const res = await fetch('/api/offer-analysis/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.uploadId) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadId(data.uploadId);
      setState('processing');
      startPollingStatus(data.uploadId);
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
      setState('error');
    }
  };

  const startPollingStatus = (currentUploadId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/offer-analysis/status/${currentUploadId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === 'complete' && data.deletedAt) {
          clearInterval(pollingRef.current);
          setDeletedAt(data.deletedAt);
          setExtractedData(data.extractedData);
          setState('complete');
          if (onComplete) {
            onComplete(data.extractedData, data.deletedAt);
          }
        } else if (data.status === 'error') {
          clearInterval(pollingRef.current);
          setError(data.error || 'Extraction processing error.');
          setState('error');
        }
      } catch (err) {
        // Continue polling
      }
    }, 2000);
  };

  const resetFlow = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setState('idle');
    setFile(null);
    setUploadId(null);
    setDeletedAt(null);
    setExtractedData(null);
    setError(null);
  };

  const formatLPAorValue = (val, key) => {
    if (!val || val === 'Not specified' || val === 'None specified') return 'Not specified';
    if (key === 'base_salary' || key === 'variable_pay') {
      const num = Number(String(val).replace(/[^0-9]/g, ''));
      if (num && num > 0) {
        return `₹${new Intl.NumberFormat('en-IN').format(num)} (${(num / 1_00_000).toFixed(2)} LPA)`;
      }
    }
    return String(val);
  };

  const FIELD_LABELS = [
    { key: 'role_title', label: '1. Role Title' },
    { key: 'company_name', label: '2. Company Name' },
    { key: 'base_salary', label: '3. Annual Base Salary' },
    { key: 'variable_pay', label: '4. Annual Variable / Bonus' },
    { key: 'currency', label: '5. Currency' },
    { key: 'joining_date', label: '6. Joining Date' },
    { key: 'location', label: '7. Work Location' },
    { key: 'equity_esop', label: '8. Equity / ESOP Retained' },
    { key: 'signing_bonus', label: '9. Signing Bonus' },
    { key: 'notice_period', label: '10. Notice Period' },
    { key: 'relocation_allowance', label: '11. Relocation Allowance' },
    { key: 'benefits_summary', label: '12. Benefits Summary' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Security Guarantee Header Pill */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 text-xs font-mono text-[#00D4A8]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>DPDP ACT 2023 COMPLIANT • ZERO FILE RETENTION • VERIFIABLE SYNC DELETION</span>
        </div>
        <Link
          href="/trust"
          className="underline hover:text-white transition flex items-center gap-1 font-semibold"
        >
          <span>View Trust &amp; Erasure Charter</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* State: IDLE */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4"
          >
            {/* Standalone DPDP Act 2023 Checkbox (NOT bundled with Terms) */}
            <div
              onClick={() => {
                setDpdpConsent(!dpdpConsent);
                if (!dpdpConsent) setError(null);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                dpdpConsent
                  ? 'bg-[#00D4A8]/10 border-[#00D4A8]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text)]/40'
              }`}
            >
              <input
                type="checkbox"
                id="dpdpStandaloneConsent"
                checked={dpdpConsent}
                onChange={(e) => {
                  setDpdpConsent(e.target.checked);
                  if (e.target.checked) setError(null);
                }}
                className="mt-0.5 w-4 h-4 rounded border-gray-400 text-[#00D4A8] focus:ring-[#00D4A8] cursor-pointer"
              />
              <label
                htmlFor="dpdpStandaloneConsent"
                className="text-xs sm:text-sm text-[var(--text)]/90 leading-relaxed font-medium cursor-pointer"
              >
                I consent to Certifyd analyzing this document for fraud detection and salary benchmarking. I understand the source file is deleted after processing.
              </label>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFileSelect(dropped);
              }}
              onClick={() => {
                if (!dpdpConsent) {
                  setError('Please check the DPDP Act 2023 consent box above before selecting a document.');
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[#00D4A8] bg-[var(--surface)] p-8 sm:p-12 text-center transition-all duration-200 relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#00D4A8]/10 text-[#00D4A8] flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2 font-sans">
                Drop your offer letter here to extract &amp; analyze
              </h3>
              <p className="text-sm sm:text-base text-[var(--text)]/70 max-w-md mx-auto mb-6">
                Supported formats: PDF or DOCX. Source document is purged synchronously upon extraction.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-mono text-[var(--text)]/80">
                <Lock className="w-3.5 h-3.5 text-[#00D4A8]" />
                <span>Only 12 numerical &amp; structural fields retained</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* State: UPLOADING */}
        {state === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full border-2 border-[#00D4A8]/30 border-t-[#00D4A8] animate-spin mx-auto" />
            <h4 className="text-lg font-bold text-[var(--text)]">Securing document upload...</h4>
            <p className="text-xs font-mono text-[var(--text)]/60">
              Allocating ephemeral zero-retention memory buffer
            </p>
          </motion.div>
        )}

        {/* State: PROCESSING (Live Countdown) */}
        {state === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#00D4A8]/30 bg-[var(--surface)] p-8 sm:p-10 text-center space-y-6 shadow-xl"
          >
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#00D4A8]/20 animate-pulse" />
              <Clock className="w-8 h-8 text-[#00D4A8] animate-spin" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synchronous Extraction Active</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2">
                Extracting your data... deleting source file in {countdown}s.
              </h4>
              <p className="text-sm text-[var(--text)]/70 max-w-md mx-auto">
                Awaiting server-verified deletion timestamp before rendering results.
              </p>
            </div>
          </motion.div>
        )}

        {/* State: ERROR */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-red-500/30 bg-[var(--surface)] p-8 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text)]">Extraction Failed</h4>
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={resetFlow}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm font-medium hover:border-[var(--text)] transition"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* State: COMPLETE (Verified Synchronous Deletion) */}
        {state === 'complete' && extractedData && deletedAt && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-[#00D4A8]/10 border border-[#00D4A8]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D4A8] text-[#080A0E] flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#00D4A8]">
                    Source file deleted. We kept only the 12 data points below.
                  </h4>
                  <p className="text-xs font-mono text-[var(--text)]/70 mt-0.5">
                    Server verified deletion at {new Date(deletedAt).toLocaleTimeString()} • Zero file retention
                  </p>
                </div>
              </div>

              <button
                onClick={resetFlow}
                className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[#00D4A8] transition text-[var(--text)]"
              >
                Upload Another
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
                <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00D4A8]" />
                  <span>Retained Structured Data (12 Fields)</span>
                </h3>
                <span className="text-xs font-mono text-[var(--text)]/50">
                  Raw file &amp; PII scrubbed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELD_LABELS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between"
                  >
                    <span className="text-xs font-mono text-[var(--text)]/60 mb-1">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text)] break-words">
                      {formatLPAorValue(extractedData[key], key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
