import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, X, Filter } from 'lucide-react';

const FILTER_SECTIONS = [
  {
    id: 'vendors',
    title: 'Vendors',
    options: [
      { id: 'microsoft', label: 'Microsoft / Azure', slugs: ['m365', 'azure', 'microsoft', 'github', 'power', 'copilot'] },
      { id: 'aws', label: 'Amazon Web Services', slugs: ['aws'] },
      { id: 'gcp', label: 'Google Cloud', slugs: ['gcp', 'google'] },
      { id: 'cisco', label: 'Cisco', slugs: ['cisco'] },
      { id: 'comptia', label: 'CompTIA', slugs: ['comptia'] },
      { id: 'lpi', label: 'LPI', slugs: ['lpi'] },
      { id: 'isc2', label: 'ISC2', slugs: ['isc2'] },
      { id: 'scrum', label: 'Scrum.org', slugs: ['scrum'] },
      { id: 'offsec', label: 'OffSec', slugs: ['offsec'] },
    ]
  },
  {
    id: 'difficulties',
    title: 'Difficulty Level',
    options: [
      { id: 'Foundational', label: 'Foundational' },
      { id: 'Associate', label: 'Associate' },
      { id: 'Professional', label: 'Professional' },
    ]
  },
  {
    id: 'tracks',
    title: 'Functional Track',
    options: [
      { id: 'Cloud', label: 'Cloud & DevOps' },
      { id: 'Security', label: 'Security' },
      { id: 'Data', label: 'Data & AI' },
      { id: 'Networking', label: 'Networking' },
      { id: 'Management', label: 'Management' },
    ]
  }
];

// Reusable Accordion Component
const FilterAccordion = ({ section, selectedOptions, toggleOption }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 focus:outline-none"
      >
        <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--text)' }}>
          {section.title}
        </span>
        {isOpen ? (
          <ChevronUp size={16} color="var(--text-3)" />
        ) : (
          <ChevronDown size={16} color="var(--text-3)" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-3">
              {section.options.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      className="w-4 h-4 rounded flex items-center justify-center border transition-all duration-200"
                      style={{ 
                        borderColor: isSelected ? 'var(--text)' : 'var(--border-mid)',
                        backgroundColor: isSelected ? 'var(--text)' : 'transparent'
                      }}
                    >
                      {isSelected && <Check size={12} color="var(--bg)" strokeWidth={4} />}
                    </div>
                    <span 
                      className="text-sm transition-colors duration-200"
                      style={{ color: isSelected ? 'var(--text)' : 'var(--text-2)' }}
                    >
                      {option.label}
                    </span>
                    {/* Hidden checkbox for accessibility */}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => toggleOption(section.id, option.id)}
                    />
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FilterSidebar({ 
  filters, 
  setFilters, 
  isMobileOpen, 
  setIsMobileOpen 
}) {
  const toggleOption = (category, optionId) => {
    setFilters(prev => {
      const currentList = prev[category] || [];
      const isSelected = currentList.includes(optionId);
      
      return {
        ...prev,
        [category]: isSelected 
          ? currentList.filter(id => id !== optionId)
          : [...currentList, optionId]
      };
    });
  };

  const clearFilters = () => {
    setFilters({ vendors: [], difficulties: [], tracks: [] });
  };

  const activeFilterCount = (filters.vendors?.length || 0) + 
                            (filters.difficulties?.length || 0) + 
                            (filters.tracks?.length || 0);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-transparent md:bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Filter size={18} color="var(--text)" />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Filters</h2>
        </div>
        {activeFilterCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-xs font-medium hover:underline transition-all"
            style={{ color: 'var(--text-3)' }}
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-2" style={{ scrollbarWidth: 'thin' }}>
        {FILTER_SECTIONS.map((section) => (
          <FilterAccordion 
            key={section.id} 
            section={section} 
            selectedOptions={filters[section.id] || []}
            toggleOption={toggleOption}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-full h-[calc(100vh-140px)] sticky top-24 pr-6 border-r" style={{ borderColor: 'var(--border)' }}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay & Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm z-50 p-6 shadow-2xl lg:hidden flex flex-col"
              style={{ background: 'var(--bg)', borderRight: '1px solid var(--border)' }}
            >
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} color="var(--text)" />
                </button>
              </div>
              <SidebarContent />
              
              {/* Mobile apply button */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg"
                  style={{ background: 'var(--accent, #2563eb)' }}
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Export sections so CertRadar can lookup slugs easily
export { FILTER_SECTIONS };
