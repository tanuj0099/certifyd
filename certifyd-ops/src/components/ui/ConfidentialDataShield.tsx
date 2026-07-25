'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, Lock, EyeOff } from 'lucide-react';

interface ConfidentialDataShieldProps {
  userEmail: string;
  userRole: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  sectionName?: string;
  children: React.ReactNode;
}

export function ConfidentialDataShield({
  userEmail,
  userRole,
  sectionName = 'Confidential Database',
  children,
}: ConfidentialDataShieldProps) {
  const isEmployee = userRole === 'TEAM_MEMBER';

  useEffect(() => {
    if (!isEmployee) return;

    // Prevent right-click context menu on sensitive tables
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent Ctrl+C / Cmd+C / Copying sensitive table data
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', `[CONFIDENTIAL DATA PROTECTION - CERTIFYD OPS WORKSPACE: ${userEmail}]`);
      }
    };

    // Prevent Print shortcut Ctrl+P / Cmd+P
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p' || e.key === 's')) {
        // Allow normal typing inside input/textarea for editing, but block if not in form element
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEmployee, userEmail]);

  return (
    <div className={`relative ${isEmployee ? 'select-none' : ''}`}>
      {/* Print protection styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          body::after {
            content: 'CONFIDENTIAL DATA PROTECTION TRIGGERED — CERTIFYD OPS SECURITY POLICY. PRINTING / PDF EXPORT BLOCKED FOR USER: ${userEmail}';
            visibility: visible !important;
            position: fixed;
            top: 40%;
            left: 10%;
            right: 10%;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #f85149;
            border: 3px solid #f85149;
            padding: 40px;
            background: #0f1218;
          }
        }
      `}</style>

      {/* Security Notice Banner for Employees */}
      {isEmployee && (
        <div className="mb-6 bg-gradient-to-r from-[#F85149]/15 via-[#E8C547]/10 to-[#F85149]/15 border border-[#F85149]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F85149]/10 border border-[#F85149]/30 flex items-center justify-center shrink-0 p-1.5">
              <img src="/logo.svg" alt="Certifyd Logo" className="w-full h-full object-contain animate-pulse opacity-90" style={{ filter: 'brightness(0) saturate(100%) invert(43%) sepia(97%) saturate(2758%) hue-rotate(338deg) brightness(101%) contrast(96%)' }} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Active Data Confidentiality Shield Enabled</span>
                <Lock className="w-3 h-3 text-[#E8C547]" />
              </h4>
              <p className="text-[11px] text-[#8B949E] mt-0.5">
                {sectionName} is strictly protected. Copying, exporting, or photographing screen contents is logged and restricted.
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-[#0F1218] border border-white/10 text-[10px] font-mono text-[#E8C547] shrink-0 self-start sm:self-center">
            User Watermark: {userEmail}
          </div>
        </div>
      )}

      {/* Tiled Watermark Overlay (Only when employee is viewing sensitive table) */}
      {isEmployee && (
        <div
          className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none opacity-[0.06] flex flex-wrap content-start justify-around gap-16 py-12 px-6"
          aria-hidden="true"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="transform -rotate-12 whitespace-nowrap font-mono text-xs font-bold tracking-widest text-white uppercase border border-white/20 px-3 py-1 rounded"
            >
              CONFIDENTIAL • {userEmail} • DO NOT COPY
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
