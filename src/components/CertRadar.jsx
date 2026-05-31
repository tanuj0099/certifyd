import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import CertificationCard from './CertificationCard.jsx';
import SkeletonGrid from './SkeletonGrid.jsx';
import { AlertCircle } from 'lucide-react';

const PAGE_SIZE = 20;

// Filter pills — map to functional_track values in the DB
const TRACK_FILTERS = [
  { label: 'All',            value: null },
  { label: 'Cloud & DevOps', value: 'Cloud' },
  { label: 'Security',       value: 'Security' },
  { label: 'Data & AI',      value: 'Data' },
  { label: 'Networking',     value: 'Networking' },
  { label: 'Management',     value: 'Management' },
];

const CertRadar = () => {
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTrack, setActiveTrack] = useState(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    setCertifications([]);
    setHasMore(true);
  }, [debouncedQuery, activeTrack]);

  // Fetch data
  useEffect(() => {
    let isMounted = true;

    const fetchCerts = async () => {
      try {
        page === 0 ? setIsLoading(true) : setIsLoadingMore(true);
        setError(null);

        const start = page * PAGE_SIZE;
        const end   = start + PAGE_SIZE - 1;

        let query = supabase
          .from('certifications')
          .select('id, slug, name, difficulty_level, functional_track, base_cost_usd, validity_period_months, about_description')
          .range(start, end)
          .order('name', { ascending: true });

        if (debouncedQuery) query = query.ilike('name', `%${debouncedQuery}%`);
        if (activeTrack)    query = query.ilike('functional_track', `%${activeTrack}%`);

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        if (isMounted) {
          if (data.length < PAGE_SIZE) setHasMore(false);
          if (page === 0) {
            setCertifications(data || []);
          } else {
            setCertifications((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              return [...prev, ...(data || []).filter((c) => !existingIds.has(c.id))];
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching certifications:', err);
          setError(err.message || 'Failed to load certifications.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    fetchCerts();
    return () => { isMounted = false; };
  }, [debouncedQuery, page, activeTrack]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) setPage((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black w-full text-white pb-20">
      {/*
        ── Page wrapper ──────────────────────────────────────────
        Mobile:  p-4  (16px sides — comfortable thumb reach)
        Tablet:  p-6  (24px)
        Desktop: p-12 (48px — generous breathing room)
      */}
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-12">

        {/* ── Page header ── */}
        <header className="mb-6 md:mb-8">
          {/*
            Mobile:  text-2xl — prevents wrapping on 375px screens
            Tablet:  text-3xl
            Desktop: text-4xl
          */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-1.5 md:mb-2">
            Certification Radar
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Discover and analyze premium credentials to accelerate your career growth.
          </p>
        </header>

        {/* ── Search & Filter ── */}
        <div className="mb-8 md:mb-10 space-y-4 md:space-y-6">

          {/* Search bar — underline style */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-3 transition-colors focus-within:border-white/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-zinc-500 flex-shrink-0"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {/*
              min-h-[44px] ensures the input row meets Apple/Google's
              44px minimum touch-target recommendation.
            */}
            <input
              type="text"
              placeholder="Search certifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] bg-transparent border-none text-white text-base md:text-lg placeholder-zinc-600 focus:outline-none focus:ring-0 px-0"
            />
            {/* Clear button — only visible when there's a query */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/*
            Filter pills — horizontally scrollable on mobile.
            Each pill has min-h-[44px] so fat fingers don't misfire.
            `no-scrollbar` hides the scrollbar on WebKit/Firefox.
          */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TRACK_FILTERS.map((filter) => {
              const isActive = activeTrack === filter.value;
              return (
                <button
                  key={filter.label}
                  onClick={() => setActiveTrack(filter.value)}
                  className={`
                    flex-shrink-0 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium
                    transition-colors whitespace-nowrap
                    ${isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white active:text-white'
                    }
                  `}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300 text-sm">Database Error</h3>
              <p className="text-sm opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Grid / Loading ── */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <>
            {/*
              Responsive grid:
              Mobile:  1 column  — full-width cards, easy to read
              Tablet:  2 columns — side-by-side pairs
              Desktop: 3 columns — premium density
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {certifications.length > 0 ? (
                certifications.map((cert) => (
                  <CertificationCard key={cert.slug || cert.id} data={cert} />
                ))
              ) : (
                !error && (
                  <div className="col-span-full py-16 md:py-20 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-sm">No certifications match your search.</p>
                  </div>
                )
              )}
            </div>

            {/* ── Load More ── */}
            {hasMore && certifications.length > 0 && (
              <div className="mt-10 md:mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="
                    min-h-[44px] px-6 md:px-8 py-3
                    bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700
                    border border-white/10 rounded-full
                    text-white text-sm font-medium
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CertRadar;
