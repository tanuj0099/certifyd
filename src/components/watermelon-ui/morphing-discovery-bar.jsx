"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Search, X } from 'lucide-react';

/* ---------- Motion Settings ---------- */
const transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 1
};

export const MorphingDiscoveryBar = ({
  categories,
  className = ""
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState(categories[0]?.id);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  return (
    <div className={`w-full flex flex-col items-center justify-center transition-colors duration-500 bg-transparent ${className}`}>
      {/* Container height adjusted for mobile flow */}
      <div className="flex items-center justify-center h-16 w-full max-w-full">
        <LayoutGroup>
            {/* SEARCH COMPONENT */}
            <motion.div
              layout
              transition={transition}
              className={`relative flex items-center shadow-sm border overflow-hidden transition-colors rounded-full ${isSearching
                ? 'w-[calc(100vw-80px)] sm:w-64 h-9 sm:h-10'
                : 'w-9 h-9 sm:w-10 sm:h-10'
                }`}
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center justify-center w-full px-3 h-full">
                <motion.div layout="position" transition={transition}>
                  <Search
                    size={16}
                    strokeWidth={2.5}
                    style={{ color: 'var(--text-3)' }}
                    className="shrink-0 transition-colors"
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  {isSearching && (
                    <motion.input
                      key="search-input"
                      ref={inputRef}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      placeholder="Search..."
                      style={{ color: 'var(--text)' }}
                      className="bg-transparent border-none outline-none w-full text-sm font-medium ml-2 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  )}
                </AnimatePresence>

                {!isSearching && (
                  <motion.button
                    layoutId="search-click-overlay"
                    className="absolute inset-0 z-10 w-full h-full"
                    onClick={() => setIsSearching(true)}
                  />
                )}
                
                {isSearching && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setIsSearching(false);
                      setSearchValue("");
                    }}
                    className="ml-auto"
                    style={{ color: 'var(--text-4)' }}
                  >
                    <X size={14} strokeWidth={2} />
                  </motion.button>
                )}
              </div>
            </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
};
