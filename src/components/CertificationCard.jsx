'use client';

import React from 'react';
import {     } from 'react-router-dom';
import Link from 'next/link';
import { Clock, DollarSign, Bookmark, Check } from 'lucide-react';
import { useJourneyStore } from '../store/useJourneyStore.js';
import { useRouter } from 'next/navigation';

//  Difficulty badge colours 
const DIFFICULTY_STYLES = {
  foundational: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
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
  const numInr = Number(cost_inr);
  const numUsd = Number(cost_usd);
  if (!numInr && !numUsd) return 'Varies';
  
  const inrStr = numInr ? `₹${numInr.toLocaleString('en-IN')}` : '';
  const usdStr = numUsd ? `$${numUsd.toLocaleString()}` : '';
  
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

const CertificationCard = ({ data, ...props }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  if (!data) return null;

  const vendor = vendorFromSlug(data.slug);
  const diffStyle = getDifficultyStyle(data.difficulty_level);
  const description = data.overview || data.about_description || '';
  const truncated = description.length > 120 ? description.slice(0, 120).trimEnd() + '...' : description;
  const savedCerts = useJourneyStore(s => s.savedCerts || []);
  const toggleSavedCert = useJourneyStore(s => s.toggleSavedCert);
  const compareMode = useJourneyStore(s => s.compareMode);
  const compareCertA = useJourneyStore(s => s.compareCertA);

  const isSaved = mounted && savedCerts.includes(data.slug);
  const isCompareA = mounted && compareCertA?.slug === data.slug;
  const activeCompareMode = mounted && compareMode;
  const isSelected = props.isSelected || false;

  const handleCardClick = (e) => {
    if (activeCompareMode) {
      e.preventDefault();
      if (isCompareA) return;
      if (props.onClick) props.onClick(data);
    } else if (props.onClick) {
      // Allow custom onClick to prevent navigation if needed
      props.onClick(e);
    }
  };

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSavedCert(data.slug);
  };

  return (
    <Link href={`/tools/cert-radar/${data.slug}`}
      onClick={handleCardClick}
      className={`
        group relative flex flex-col
        p-3 md:p-5
        glass
        md:hover:scale-[1.015] md:hover:shadow-black/20
        transition-all duration-200
        cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-white/20
        ${isCompareA ? 'opacity-50 grayscale pointer-events-none' : ''}
        ${isSelected ? 'ring-2 ring-[var(--accent)] bg-[var(--bg-alt)]' : ''}
      `}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.015)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/*  Header: vendor + difficulty + track (Desktop only)  */}
      <div className="hidden md:flex flex-wrap items-center gap-1 md:gap-2 mb-2 md:mb-3 pr-8 md:pr-10">
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
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 text-[9px] md:text-xs font-semibold uppercase tracking-widest rounded-md truncate max-w-[80px] md:max-w-[130px] glass text-[var(--text-2)]">
            {data.functional_track}
          </span>
        )}
      </div>

      {/* Bookmark / Checkbox */}
      <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10 flex items-center justify-center">
        {activeCompareMode ? (
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-3)] bg-transparent'}`}>
            {isSelected && <Check size={14} className="text-[var(--bg)]" strokeWidth={3} />}
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={handleBookmarkClick}
            className="p-1.5 rounded-full hover:bg-[var(--bg-alt)] transition-colors text-[var(--text-3)] hover:text-[var(--accent)] cursor-pointer"
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-[var(--accent)]" : ""} />
          </div>
        )}
      </div>

      {/*  Title + description  */}
      <div className="flex-grow mb-2 md:mb-4">
        <h3 className="text-xs md:text-base font-semibold mb-1 md:mb-2 line-clamp-2 md:line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition-colors text-[var(--text)]">
          {data.name}
        </h3>
        {truncated && (
          <p className="hidden md:block text-xs md:text-sm leading-relaxed line-clamp-3 text-[var(--text-2)]">
            {truncated}
          </p>
        )}
      </div>

      {/*  Divider  */}
      <div className="h-px w-full mb-3 md:mb-4 bg-[var(--border)]" />

      {/*  Footer metrics  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-3">
        <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-xl transition-colors duration-300">
          <div className="w-5 h-5 md:w-8 md:h-8 flex-shrink-0 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
            <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="truncate">
            <p className="hidden md:block text-[10px] md:text-xs font-semibold text-[color:var(--text-4)] uppercase tracking-widest leading-none mb-1">Cost</p>
            <p className="text-[10px] md:text-sm font-bold text-[var(--text)] tracking-tight truncate">
              {formatDualCost(data.cost_inr, data.cost_usd)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2">
          <div className="w-5 h-5 md:w-8 md:h-8 flex-shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
          </div>
          <div className="truncate">
            <p className="hidden md:block text-[10px] md:text-xs font-semibold text-[color:var(--text-4)] uppercase tracking-widest leading-none mb-1">Validity</p>
            <p className="text-[10px] md:text-sm font-bold text-[var(--text)] tracking-tight truncate">
              {formatValidity(data.validity_period_months)}
            </p>
          </div>
        </div>
      </div>

      {/*  Hover arrow - desktop only (hidden in compare mode)  */}
      {!activeCompareMode && (
        <div className="hidden md:flex absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </Link>
  );
};

export default CertificationCard;
