import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import CertificationCard from './CertificationCard.jsx';
import SkeletonGrid from './SkeletonGrid.jsx';
import { Search, AlertCircle } from 'lucide-react';

const PAGE_SIZE = 20;

const CertRadar = () => {
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page and data when search changes
  useEffect(() => {
    setPage(0);
    setCertifications([]);
    setHasMore(true);
  }, [debouncedQuery]);

  // Fetch data
  useEffect(() => {
    let isMounted = true;
    const fetchCerts = async () => {
      try {
        if (page === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const start = page * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;

        let query = supabase
          .from('certifications')
          .select('*, domains(domain_name, family_group)')
          .range(start, end);

        if (debouncedQuery) {
          query = query.ilike('name', `%${debouncedQuery}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (isMounted) {
          if (data.length < PAGE_SIZE) {
            setHasMore(false);
          }
          if (page === 0) {
            setCertifications(data || []);
          } else {
            setCertifications((prev) => {
              // Quick deduplication in case of strict mode double mounts
              const existingIds = new Set(prev.map(c => c.id));
              const newItems = (data || []).filter(c => !existingIds.has(c.id));
              return [...prev, ...newItems];
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
    
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, page]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-black w-full text-white pb-20">
      
      <div className="max-w-[1400px] mx-auto p-6 lg:p-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">
            Certification Radar
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Discover and analyze premium credentials to accelerate your career growth.
          </p>
        </header>

        {/* Minimalist Search & Filter Section */}
        <div className="mb-10 space-y-6">
          
          {/* The Search Bar (No Box, Just an underline) */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-3 transition-colors focus-within:border-white/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search for certifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-white text-lg placeholder-zinc-600 focus:outline-none focus:ring-0 px-0"
            />
          </div>

          {/* The Filter Pills (Matching your screenshot) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-black shadow-sm">
              All
            </button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Cloud & DevOps
            </button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Security
            </button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Data & AI
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300">Database Error</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* The Loading Latch */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {certifications.length > 0 ? (
                certifications.map((cert) => (
                  <CertificationCard key={cert.id} data={cert} />
                ))
              ) : (
                !error && (
                  <div className="col-span-full py-20 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                    <p>No certifications match your search query.</p>
                  </div>
                )
              )}
            </div>
            
            {/* Load More Pagination */}
            {hasMore && certifications.length > 0 && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-full text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
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
