import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase.js';
import CertificationCard from './CertificationCard.jsx';
import SkeletonGrid from './SkeletonGrid.jsx';
import { AlertCircle, ArrowRight, X, TrendingUp, Compass, Filter } from 'lucide-react';
import { useJourneyStore } from '../store/useJourneyStore.js';
import FilterSidebar, { FILTER_SECTIONS } from './FilterSidebar.jsx';

const PAGE_SIZE = 20;

// ── Active Journey Capsule ─────────────────────────────────────────────────
function ActiveJourneyCapsule({ currentRole, targetDomain, intent, onDismiss }) {
  if (!targetDomain) return null;

  const isLevelUp = intent === 'Level_Up';
  const accentColor = isLevelUp ? 'var(--gold, #C9A84C)' : 'var(--accent)';
  const IconComponent = isLevelUp ? TrendingUp : Compass;
  const intentLabel = isLevelUp ? 'Level Up' : 'Domain Pivot';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '100px',
          background: 'var(--surface)',
          border: `1px solid ${accentColor}30`,
          marginBottom: '20px',
          width: 'fit-content',
          maxWidth: '100%',
          flexWrap: 'wrap',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '100px',
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
        }}>
          <IconComponent size={11} color={accentColor} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: '700', color: accentColor, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            {intentLabel.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {currentRole && (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                {currentRole}
              </span>
              <ArrowRight size={12} color="var(--text-4)" style={{ flexShrink: 0 }} />
            </>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--text)',
            whiteSpace: 'nowrap',
          }}>
            {targetDomain}
          </span>
        </div>

        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-4)', display: 'flex', alignItems: 'center', marginLeft: '4px', flexShrink: 0 }}
          title="Clear journey context"
        >
          <X size={13} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ── CertRadar ──────────────────────────────────────────────────────────────
const CertRadar = () => {
  const searchParams = useSearchParams();
  const targetDomain = useJourneyStore(s => s.targetDomain);
  const resumeDomain = useJourneyStore(s => s.resumeDomain);
  const setTargetDomain = useJourneyStore(s => s.setTargetDomain);

  const urlIntent = searchParams?.get('intent') || '';
  const urlTarget = searchParams?.get('target') || '';

  const activeTarget = urlTarget || targetDomain || '';
  const activeIntent = urlIntent || 'Domain_Pivot';
  const currentRole = resumeDomain || '';

  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showCapsule, setShowCapsule] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Filter States
  const [filters, setFilters] = useState({ vendors: [], difficulties: [], tracks: [] });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  }, [debouncedQuery, filters]);

  // Fetch data
  useEffect(() => {
    let isMounted = true;

    const fetchCerts = async () => {
      try {
        page === 0 ? setIsLoading(true) : setIsLoadingMore(true);
        setError(null);

        if (!supabase) {
          throw new Error('Database not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local, then restart the dev server.');
        }

        const start = page * PAGE_SIZE;
        const end   = start + PAGE_SIZE - 1;

        let query = supabase
          .from('certifications')
          .select('id, slug, name, difficulty_level, functional_track, cost_inr, cost_usd, validity_period_months, overview')
          .range(start, end)
          .order('name', { ascending: true });

        if (debouncedQuery) query = query.ilike('name', `%${debouncedQuery}%`);
        
        // Strict domain pivot filter: only show certs for the target domain
        if (activeIntent === 'Domain_Pivot' && activeTarget) {
          query = query.ilike('functional_track', `%${activeTarget}%`);
        }

        if (filters.tracks?.length > 0) {
          query = query.in('functional_track', filters.tracks);
        }
        
        if (filters.difficulties?.length > 0) {
          query = query.in('difficulty_level', filters.difficulties);
        }
        
        if (filters.vendors?.length > 0) {
          const vendorSection = FILTER_SECTIONS.find(s => s.id === 'vendors');
          let slugPatterns = [];
          filters.vendors.forEach(vId => {
            const opt = vendorSection.options.find(o => o.id === vId);
            if (opt) slugPatterns.push(...opt.slugs.map(slug => `slug.ilike.%${slug}%`));
          });
          if (slugPatterns.length > 0) {
            query = query.or(slugPatterns.join(','));
          }
        }

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
  }, [debouncedQuery, page, filters]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) setPage((prev) => prev + 1);
  };

  const handleDismissCapsule = () => {
    setShowCapsule(false);
    setTargetDomain('');
  };

  const activeFilterCount = (filters.vendors?.length || 0) + 
                            (filters.difficulties?.length || 0) + 
                            (filters.tracks?.length || 0);

  return (
    <div className="w-full pb-32 md:pb-20 relative" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Column */}
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            isMobileOpen={isMobileSidebarOpen} 
            setIsMobileOpen={setIsMobileSidebarOpen} 
          />

          {/* Main Content Column */}
          <div className="lg:col-span-3">
            
            {showCapsule && activeTarget && (
              <ActiveJourneyCapsule
                currentRole={currentRole}
                targetDomain={activeTarget}
                intent={activeIntent}
                onDismiss={handleDismissCapsule}
              />
            )}

            {/* Search Bar */}
            <div className="mb-8 border-b pb-3 transition-colors flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
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
                placeholder={activeTarget ? `Searching for ${activeTarget} certs...` : "Search certifications..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] bg-transparent border-none text-base md:text-lg focus:outline-none focus:ring-0 px-0"
                style={{ color: 'var(--text)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full"
                  style={{ background: 'var(--border)', color: 'var(--text-2)' }}
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="mb-6 p-4 border rounded-xl flex items-start gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Database Error</h3>
                  <p className="text-sm opacity-90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Grid / Loading */}
            {isLoading ? (
              <SkeletonGrid />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {certifications.length > 0 ? (
                    certifications.map((cert) => (
                      <CertificationCard key={cert.slug || cert.id} data={cert} />
                    ))
                  ) : (
                    !error && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--border)' }}>
                          <X className="w-8 h-8" style={{ color: 'var(--text-2)' }} />
                        </div>
                        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>No certifications found</h3>
                        <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                          We couldn't find any certifications matching your criteria. Try loosening your filters.
                        </p>
                        {(searchQuery || activeFilterCount > 0) && (
                          <button
                            onClick={() => { setSearchQuery(''); setFilters({ vendors: [], difficulties: [], tracks: [] }); }}
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

                {hasMore && certifications.length > 0 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="min-h-[44px] px-8 py-3 rounded-full text-sm font-medium border"
                      style={{ background: 'var(--bg-alt)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      {isLoadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Filter FAB */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'var(--accent, #2563eb)' }}
        >
          <Filter size={18} />
          Filters {activeFilterCount > 0 && <span className="ml-1 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">{activeFilterCount}</span>}
        </button>
      </div>

    </div>
  );
};

export default CertRadar;
