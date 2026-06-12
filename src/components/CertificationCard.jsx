'use client';

import React from 'react';
import {     } from 'react-router-dom';
import Link from 'next/link';
import { Clock, DollarSign } from 'lucide-react';

//  Difficulty badge colours 
const DIFFICULTY_STYLES = {
  foundational: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  associate:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400'    },
  professional: { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400'  },
  expert:       { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400'  },
  specialty:    { bg: 'bg-pink-500/10',    border: 'border-pink-500/20',    text: 'text-pink-400'    },
};

function getDifficultyStyle(level) {
  if (!level) return DIFFICULTY_STYLES.associate;
  return DIFFICULTY_STYLES[level.toLowerCase()] || DIFFICULTY_STYLES.associate;
}

function formatDualCost(cost_inr, cost_usd) {
  if (!cost_inr && !cost_usd) return 'Free';
  const inrStr = cost_inr ? `₹${Number(cost_inr).toLocaleString('en-IN')}` : '';
  const usdStr = cost_usd ? `$${Number(cost_usd).toLocaleString()}` : '';
  if (inrStr && usdStr) return `${inrStr}/${usdStr}`;
  return inrStr || usdStr;
}

function formatValidity(months) {
  if (!months) return '-';
  if (months >= 999) return 'Lifetime';
  return `${months}mo`;
}

function vendorFromSlug(slug) {
  if (!slug) return null;
  const prefix = slug.split('-')[0].toUpperCase();
  const MAP = {
    AWS: 'AWS', GCP: 'Google', AZURE: 'Azure', AZ: 'Azure',
    CKA: 'CNCF', CKAD: 'CNCF', CKS: 'CNCF',
    CISSP: 'ISC', CISM: 'ISACA', CISA: 'ISACA',
    PMP: 'PMI', CAPM: 'PMI',
    COMPTIA: 'CompTIA',
    RHCE: 'Red Hat', RHCSA: 'Red Hat',
    CCNA: 'Cisco', CCNP: 'Cisco', CCIE: 'Cisco',
  };
  return MAP[prefix] || prefix;
}

const CertificationCard = ({ data }) => {
  if (!data) return null;

  const diffStyle = getDifficultyStyle(data.difficulty_level);
  const vendor = data.vendor || vendorFromSlug(data.slug);
  const description = data.overview || data.about_description || '';
  const truncated = description.length > 120 ? description.slice(0, 120).trimEnd() + '...' : description;

  return (
    <Link href={`/tools/cert-radar/${data.slug}`}
      className="
        group relative flex flex-col
        p-4 md:p-5
        glass
        md:hover:scale-[1.015] md:hover:shadow-black/20
        transition-all duration-200
        cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-white/20
      "
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.015)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/*  Header: vendor + difficulty + track  */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3 pr-10">
        {vendor && (
          <span className="px-2 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-widest rounded-md transition-colors glass text-[var(--text-2)]">
            {vendor}
          </span>
        )}
        {data.difficulty_level && (
          <span className={`px-2 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-widest rounded-md backdrop-blur-md border ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text}`}>
            {data.difficulty_level}
          </span>
        )}
        {data.functional_track && (
          <span className="px-2 py-1 text-[10px] md:text-xs font-semibold uppercase tracking-widest rounded-md truncate max-w-[100px] md:max-w-[130px] glass text-[var(--text-2)]">
            {data.functional_track}
          </span>
        )}
      </div>

      {/*  Title + description  */}
      <div className="flex-grow mb-4">
        <h3 className="text-sm md:text-base font-semibold mb-2 line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors text-[var(--text)]">
          {data.name}
        </h3>
        {truncated && (
          <p className="text-xs md:text-sm leading-relaxed line-clamp-3 text-[var(--text-2)]">
            {truncated}
          </p>
        )}
      </div>

      {/*  Divider  */}
      <div className="h-px w-full mb-3 md:mb-4 bg-[var(--border)]" />

      {/*  Footer metrics  */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-xl transition-colors duration-300">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Cost</p>
            <p className="text-[11px] md:text-sm font-bold text-[var(--text)] tracking-tight">
              {formatDualCost(data.cost_inr, data.cost_usd)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Validity</p>
            <p className="text-[11px] md:text-sm font-bold text-[var(--text)] tracking-tight">
              {formatValidity(data.validity_period_months)}
            </p>
          </div>
        </div>
      </div>

      {/*  Hover arrow - desktop only  */}
      <div className="hidden md:flex absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

export default CertificationCard;
