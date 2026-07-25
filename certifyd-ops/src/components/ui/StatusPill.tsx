'use client';

import React from 'react';
import { STATUS_STYLES } from '../../lib/constants/tokens';

interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'sm' }: StatusPillProps) {
  const style = STATUS_STYLES[status] || {
    label: status,
    className: 'bg-white/10 text-[#8B949E] border border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wider font-mono ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${style.className}`}
    >
      {style.dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {style.label}
    </span>
  );
}
