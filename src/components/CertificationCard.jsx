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

function formatCost(cost) {
  if (!cost || cost === 0) return 'Free';
  return `$${Number(cost).toLocaleString()}`;
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
  const description = data.about_description || data.description || '';
  // Slightly longer truncation on mobile since we have full width
  const truncated = description.length > 120 ? description.slice(0, 120).trimEnd() + '...' : description;

  return (
    <Link href={`/tools/cert-radar/${data.slug}`}
      className="
        group relative flex flex-col
        p-4 md:p-5
        rounded-2xl
        backdrop-blur-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-2xl shadow-black/10
        md:hover:scale-[1.015] md:hover:shadow-black/20
        transition-all duration-200
        cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-white/20
      "
      style={{
        /* Using Tailwind for glassmorphism */
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.015)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/*  Header: vendor + difficulty + track  */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3">
        {vendor && (
          <span className="px-2 py-1 text-sm font-semibold uppercase tracking-widest rounded-md transition-colors bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            {vendor}
          </span>
        )}
        {data.difficulty_level && (
          <span className={`px-2 py-1 text-sm font-semibold uppercase tracking-widest rounded-md backdrop-blur-md border ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text}`}>
            {data.difficulty_level}
          </span>
        )}
        {data.functional_track && (
          <span className="ml-auto px-2 py-1 text-sm font-semibold uppercase tracking-widest rounded-md truncate max-w-[100px] md:max-w-[130px] bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            {data.functional_track}
          </span>
        )}
      </div>

      {/*  Title + description  */}
      <div className="flex-grow mb-4">
        <h3 className="text-sm md:text-base font-semibold mb-2 line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors text-[var(--text)]">
          {data.name}
        </h3>
        {truncated && (
          <p className="text-sm leading-relaxed line-clamp-3 text-[var(--text-2)]">
            {truncated}
          </p>
        )}
      </div>

      {/*  Divider  */}
      <div className="h-px w-full mb-3 md:mb-4 bg-[var(--border)]" />

      {/*  Footer metrics  */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wider font-semibold leading-none mb-0.5 text-[var(--text-3)]">Cost</p>
            <p className="text-sm font-semibold text-[var(--text)]">
              {formatCost(data.base_cost_usd)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wider font-semibold leading-none mb-0.5 text-[var(--text-3)]">Validity</p>
            <p className="text-sm font-semibold text-[var(--text)]">
              {formatValidity(data.validity_period_months)}
            </p>
          </div>
        </div>
      </div>

      {/*  Hover arrow - desktop only  */}
      <div className="hidden md:block absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg className="w-4 h-4 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

export default CertificationCard;
