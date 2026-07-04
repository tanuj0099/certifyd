'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Stack up to 3 visible at once
      const next = [...prev, { id, type, message }];
      if (next.length > 3) {
        return next.slice(next.length - 3);
      }
      return next;
    });

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-sm font-medium ${
                t.type === 'success'
                  ? 'bg-[#161B22]/95 border-[#22C55E]/30 text-[#22C55E] shadow-[#22C55E]/5'
                  : t.type === 'error'
                  ? 'bg-[#161B22]/95 border-[#F85149]/30 text-[#F85149] shadow-[#F85149]/5'
                  : t.type === 'warning'
                  ? 'bg-[#161B22]/95 border-[#E8C547]/30 text-[#E8C547] shadow-[#E8C547]/5'
                  : 'bg-[#161B22]/95 border-[#3B82F6]/30 text-[#3B82F6] shadow-[#3B82F6]/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                {t.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                {t.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
                <span className="text-white text-xs leading-relaxed">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#8B949E] hover:text-white transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
