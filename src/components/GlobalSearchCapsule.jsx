'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useJourneyStore } from '@/store/useJourneyStore';
import { performGlobalSearch } from '@/lib/searchIndex';
import { supabase } from '@/lib/supabase';
import { FILTER_SECTIONS } from '@/components/FilterSidebar';

export function GlobalSearchCapsule() {
  const isOpen = useJourneyStore((s) => s.isSearchOpen);
  const setIsOpen = useJourneyStore((s) => s.setSearchOpen);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const router = useRouter();
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      // Slight delay to ensure element is mounted before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global keyboard shortcut to open search (CMD/CTRL + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setIsOpen]);

  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Search execution
  useEffect(() => {
    let isMounted = true;

    const runSearch = async () => {
      if (query.trim().length >= 2) {
        // 1. Get fast local hits
        const localHits = performGlobalSearch(query);
        if (isMounted) setResults(localHits);

        // 2. Fetch from Supabase (the source of truth for 500+ certs)
        if (supabase) {
          setIsSearchingDb(true);
          try {
            const { data, error } = await supabase
              .from('certifications')
              .select('id, slug, name, vendor, functional_track')
              .or(`name.ilike.%${query.trim()}%,vendor.ilike.%${query.trim()}%`)
              .limit(15);

            if (!error && data && isMounted) {
              const dbHits = data.map(cert => ({
                id: `supabase-${cert.id}`,
                path: `/tools/cert-radar?search=${encodeURIComponent(cert.slug)}`,
                label: cert.name,
                tag: 'CERT',
                desc: cert.vendor || cert.functional_track || 'Certification',
                icon: null
              }));

              setResults(prev => {
                // Avoid duplicating local hits that match Supabase hits
                const existingLabels = new Set(prev.map(r => r.label.toLowerCase()));
                const newHits = dbHits.filter(h => !existingLabels.has(h.label.toLowerCase()));
                return [...prev, ...newHits];
              });
            }
          } catch (err) {
            console.error('Supabase search error:', err);
          } finally {
            if (isMounted) setIsSearchingDb(false);
          }
        }
        
        // 3. Inject Vendor Shortcut if query matches a vendor slug
        if (isMounted) {
          const matchedVendor = FILTER_SECTIONS.find(s => s.id === 'vendors')?.options.find(opt => 
            opt.slugs.some(slug => slug.toLowerCase().includes(query.trim().toLowerCase()) || query.trim().toLowerCase().includes(slug.toLowerCase()))
          );

          if (matchedVendor) {
            setResults(prev => [
              {
                id: `vendor-shortcut-${matchedVendor.id}`,
                path: `/tools/cert-radar?vendor=${encodeURIComponent(matchedVendor.id)}`,
                label: `See all ${matchedVendor.label} certifications`,
                tag: 'VENDOR',
                desc: 'View in Cert Radar with filters applied',
                icon: ArrowRight
              },
              ...prev.filter(r => r.id !== `vendor-shortcut-${matchedVendor.id}`)
            ]);
          }
        }
        
        if (isMounted) setSelectedIndex(0);
      } else {
        if (isMounted) setResults([]);
      }
    };

    runSearch();

    return () => { isMounted = false; };
  }, [query]);

  // Handle navigation/keyboard inside modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  const handleSelect = (result) => {
    setIsOpen(false);
    router.push(result.path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '12vh',
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Capsule Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '600px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input Area */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: results.length > 0 || isSearchingDb ? '1px solid var(--border)' : 'none',
            }}>
              {isSearchingDb ? (
                <Loader2 size={20} color="var(--accent)" className="animate-spin" style={{ flexShrink: 0 }} />
              ) : (
                <Search size={20} color="var(--text-3)" style={{ flexShrink: 0 }} />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tools, certifications, or pages..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-sans)',
                  padding: '0 16px',
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Results List */}
            {results.length > 0 && (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '8px',
              }}>
                {results.map((result, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = result.icon;
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--hover-bg)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'var(--bg-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border)',
                      }}>
                        {Icon ? <Icon size={16} /> : <Search size={16} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {result.label}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '13px',
                          color: 'var(--text-3)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}>
                          {result.desc}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--text-4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                      }}>
                        {result.tag}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty State */}
            {query.length >= 2 && results.length === 0 && !isSearchingDb && (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
              }}>
                No results found for "{query}"
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
