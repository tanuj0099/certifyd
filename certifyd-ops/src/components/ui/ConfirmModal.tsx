'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  impact: string;
  confirmWord: string;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  impact,
  confirmWord,
  loading = false,
}: ConfirmModalProps) {
  const [input, setInput] = useState('');
  const isMatch = input.trim().toUpperCase() === confirmWord.toUpperCase();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#0F1218] border border-[#F85149]/30 rounded-2xl p-6 shadow-2xl overflow-hidden relative"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F85149]/15 border border-[#F85149]/30 flex items-center justify-center text-[#F85149]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-xs text-[#8B949E]">Irreversible Destructive Action</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-[#8B949E] hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161B22] border border-white/[0.06] mb-5">
            <p className="text-xs text-[#8B949E] mb-1 font-mono uppercase tracking-wider">Impact Warning</p>
            <p className="text-sm text-[#F0F6FC] leading-relaxed">{impact}</p>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-[#8B949E] mb-2 font-mono">
              Type <strong className="text-[#F85149] font-mono">{confirmWord}</strong> below to confirm:
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={confirmWord}
              disabled={loading}
              className="w-full bg-[#161B22] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm font-mono text-white placeholder-[#8B949E]/40 focus:outline-none focus:border-[#F85149] transition-colors uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#8B949E] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (isMatch) {
                  onConfirm();
                }
              }}
              disabled={!isMatch || loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F85149] text-white hover:bg-[#F85149]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F85149]/20 flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Confirm Action</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
