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

const VALID_PIVOTS = {
  tech: ['Cloud', 'Security', 'Data', 'Networking', 'Management'],
  data: ['Cloud', 'Security', 'Management'],
  cybersecurity: ['Cloud', 'Networking', 'Management'],
  finance: ['Data', 'Management'],
  management: ['Data', 'Management'],
  marketing: ['Data', 'Management'],
  hr: ['Data', 'Management'],
  business: ['Data', 'Management'],
  government: ['Data', 'Management', 'Security'],
  medical: ['Data', 'Management'],
};

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
  setIsMobileOpen,
  activeIntent,
  activeTarget,
  resumeDomain
}) {
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleOption = (category, optionId) => {
    setLocalFilters(prev => {
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
    setLocalFilters({ vendors: [], difficulties: [], tracks: [] });
  };

  const handleApply = () => {
    setFilters(localFilters);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const localFilterCount = (localFilters.vendors?.length || 0) + 
                           (localFilters.difficulties?.length || 0) + 
                           (localFilters.tracks?.length || 0);

  const dynamicSections = React.useMemo(() => {
    return FILTER_SECTIONS.map(section => {
      if (section.id === 'tracks' && activeIntent === 'Domain_Pivot') {
        // If they already chose a target domain, hide the 'tracks' filter
        // because it is strictly filtered at the database level.
        if (activeTarget) {
          return null;
        }
        // Otherwise, only show realistic pivot destinations based on their current domain.
        if (resumeDomain && VALID_PIVOTS[resumeDomain]) {
          const allowed = VALID_PIVOTS[resumeDomain];
          return {
            ...section,
            options: section.options.filter(o => allowed.includes(o.id))
          };
        }
      }
      return section;
    }).filter(Boolean);
  }, [activeIntent, activeTarget, resumeDomain]);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-transparent md:bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Filter size={18} color="var(--text)" />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Filters</h2>
        </div>
        {localFilterCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-xs font-medium hover:underline transition-all"
            style={{ color: 'var(--text-3)' }}
          >
            Clear all ({localFilterCount})
          </button>
        )}
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-2" style={{ scrollbarWidth: 'thin' }}>
        {dynamicSections.map((section) => (
          <FilterAccordion 
            key={section.id} 
            section={section} 
            selectedOptions={localFilters[section.id] || []}
            toggleOption={toggleOption}
          />
        ))}
      </div>

      {/* Desktop apply button (hidden on mobile drawer because we have a sticky bottom button there) */}
      <div className="hidden lg:block mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleApply}
          className="w-full py-2.5 rounded-xl font-semibold text-[var(--bg)] transition-all duration-300 shadow-sm hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          {localFilterCount > 0 ? `Apply Filters` : 'Apply All'}
        </button>
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
                  onClick={handleApply}
                  className="w-full py-3 rounded-xl font-semibold text-[var(--bg)] transition-all duration-300 shadow-lg hover:opacity-90"
                  style={{ background: 'var(--accent)' }}
                >
                  {localFilterCount > 0 ? `Apply Filters` : 'Apply All'}
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
