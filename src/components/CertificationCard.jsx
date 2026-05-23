import React from 'react';
import { Link } from 'react-router-dom';

const CertificationCard = ({ data }) => {
  if (!data) return null;

  return (
    <Link 
      to={`/cert-radar/${data.slug}`}
      className="group flex flex-col p-5 -mx-5 rounded-2xl bg-transparent border-none hover:bg-white/[0.03] transition-all duration-300 cursor-pointer outline-none"
    >
      
      {/* Header: Badges (Sleek, transparent tags) */}
      <div className="flex flex-wrap gap-2 mb-3">
        {data.provider && (
          <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-white/5 text-zinc-400 rounded-md group-hover:text-zinc-300 transition-colors">
            {data.provider}
          </span>
        )}
        {data.difficulty && (
          <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-white/5 text-zinc-400 rounded-md">
            {data.difficulty}
          </span>
        )}
      </div>

      {/* Body: Title & Domain */}
      <div className="flex-grow mb-5">
        <h3 className="text-xl font-medium text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
          {data.name}
        </h3>
        <p className="text-sm text-zinc-500">
          {data.domains?.domain_name || 'Uncategorized'}
        </p>
      </div>

      {/* Footer: Metrics (Clean text, no lines) */}
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-600 mb-1">Target Salary</p>
          <p className="text-sm text-zinc-300">
            {data.salary_floor ? `$${data.salary_floor.toLocaleString()}+` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-600 mb-1">Market Demand</p>
          <p className="text-sm text-zinc-300">
            {data.job_count ? `${data.job_count.toLocaleString()} jobs` : '—'}
          </p>
        </div>
      </div>

    </Link>
  );
};

export default CertificationCard;
