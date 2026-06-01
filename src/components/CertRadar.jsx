import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import CertificationCard from './CertificationCard.jsx';
import SkeletonGrid from './SkeletonGrid.jsx';
import { AlertCircle } from 'lucide-react';

const PAGE_SIZE = 20;

// Filter pills - map to functional_track values in the DB
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
    <div className="w-full pb-20" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/*
         Page wrapper 
        Mobile:  p-4  (16px sides - comfortable thumb reach)
        Tablet:  p-6  (24px)
        Desktop: p-12 (48px - generous breathing room)
      */}
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-12">

        {/*  Search & Filter  */}
        <div className="mb-8 md:mb-10 space-y-4 md:space-y-6">

          {/* Search bar - underline style */}
          <div className="flex items-center gap-3 border-b pb-3 transition-colors" style={{ borderColor: 'var(--border)' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 flex-shrink-0"
              style={{ color: 'var(--text-3)' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search certifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] bg-transparent border-none text-base md:text-lg focus:outline-none focus:ring-0 px-0"
              style={{ color: 'var(--text)' }}
            />
            {/* Clear button - only visible when there's a query */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                style={{ background: 'var(--border)', color: 'var(--text-2)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/*
            Filter pills - horizontally scrollable on mobile.
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
                  className="flex-shrink-0 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                  style={{
                    background: isActive ? 'var(--text)' : 'transparent',
                    color: isActive ? 'var(--bg)' : 'var(--text-2)',
                    border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/*  Error state  */}
        {error && (
          <div className="mb-6 p-4 border rounded-xl flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Database Error</h3>
              <p className="text-sm opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/*  Grid / Loading  */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <>
            {/*
              Responsive grid:
              Mobile:  1 column  - full-width cards, easy to read
              Tablet:  2 columns - side-by-side pairs
              Desktop: 3 columns - premium density
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {certifications.length > 0 ? (
                certifications.map((cert) => (
                  <CertificationCard key={cert.slug || cert.id} data={cert} />
                ))
              ) : (
                !error && (
                  <div className="col-span-full py-20 md:py-28 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--border)' }}>
                      <svg className="w-8 h-8" style={{ color: 'var(--text-2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>No certifications found</h3>
                    <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      We couldn't find any certifications matching "{searchQuery}" in the {activeTrack || 'All'} track. Try adjusting your filters.
                    </p>
                    {searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(''); setActiveTrack(null); }}
                        className="mt-6 px-4 py-2 text-sm font-medium rounded-full transition-colors"
                        style={{ background: 'var(--border)', color: 'var(--text)' }}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {/*  Load More  */}
            {hasMore && certifications.length > 0 && (
              <div className="mt-10 md:mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-h-[44px] px-6 md:px-8 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border"
                  style={{ background: 'var(--bg-alt)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-3)', borderTopColor: 'var(--text)' }} />
                      Loading...
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
