import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, DollarSign } from 'lucide-react';

// ── Difficulty badge colours ──────────────────────────────
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
  if (!months) return '—';
  if (months >= 999) return 'Lifetime';
  return `${months}mo`;
}

function vendorFromSlug(slug) {
  if (!slug) return null;
  const prefix = slug.split('-')[0].toUpperCase();
  const MAP = {
    AWS: 'AWS', GCP: 'Google', AZURE: 'Azure', AZ: 'Azure',
    CKA: 'CNCF', CKAD: 'CNCF', CKS: 'CNCF',
    CISSP: 'ISC²', CISM: 'ISACA', CISA: 'ISACA',
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
  const truncated = description.length > 120 ? description.slice(0, 120).trimEnd() + '…' : description;

  return (
    /*
      The entire card is the touch target.
      min-h-[44px] is satisfied by the card's natural height (always > 44px).

      hover:scale — disabled on mobile (md: prefix) to prevent jarring
      layout shifts when users scroll past cards on touch screens.
    */
    <Link
      to={`/cert-radar/${data.slug}`}
      className="
        group relative flex flex-col
        p-4 md:p-5
        rounded-2xl
        bg-zinc-900/30 border border-white/[0.06]
        active:bg-zinc-800/60
        md:hover:bg-zinc-800/50 md:hover:border-white/[0.12]
        md:hover:scale-[1.015] md:hover:shadow-xl md:hover:shadow-black/40
        transition-all duration-200
        cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-white/30
      "
    >
      {/* ── Header: vendor + difficulty + track ── */}
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3">
        {vendor && (
          <span className="px-2 py-1 text-[10px] uppercase tracking-widest font-semibold bg-white/5 text-zinc-400 rounded-md group-hover:text-zinc-300 transition-colors">
            {vendor}
          </span>
        )}
        {data.difficulty_level && (
          <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded-md border ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text}`}>
            {data.difficulty_level}
          </span>
        )}
        {data.functional_track && (
          /*
            On mobile, the track pill sits on its own line if needed (flex-wrap).
            max-w is relaxed to prevent aggressive truncation on narrow screens.
          */
          <span className="ml-auto px-2 py-1 text-[10px] uppercase tracking-widest font-semibold bg-white/5 text-zinc-500 rounded-md truncate max-w-[100px] md:max-w-[130px]">
            {data.functional_track}
          </span>
        )}
      </div>

      {/* ── Title + description ── */}
      <div className="flex-grow mb-4">
        <h3 className="text-sm md:text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">
          {data.name}
        </h3>
        {truncated && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
            {truncated}
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px w-full bg-white/[0.05] mb-3 md:mb-4" />

      {/* ── Footer metrics ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600 leading-none mb-0.5">Cost</p>
            <p className={`text-sm font-semibold ${!data.base_cost_usd || data.base_cost_usd === 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
              {formatCost(data.base_cost_usd)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-600 leading-none mb-0.5">Validity</p>
            <p className="text-sm font-semibold text-zinc-200">
              {formatValidity(data.validity_period_months)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Hover arrow — desktop only ── */}
      <div className="hidden md:block absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

export default CertificationCard;
