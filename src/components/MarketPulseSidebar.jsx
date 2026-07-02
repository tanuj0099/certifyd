import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, X, Filter, ArrowUpDown } from 'lucide-react';

const MARKET_FILTER_SECTIONS = [
  {
    id: 'category',
    title: 'Functional Track',
    type: 'checkbox',
    options: [
      { id: 'cloud', label: 'Cloud & DevOps', keywords: ['Cloud', 'DevOps', 'SRE', 'GCP', 'Azure', 'AWS', 'Kubernetes'] },
      { id: 'data', label: 'Data & AI', keywords: ['Data', 'Machine Learning', 'AI', 'NLP', 'Computer Vision', 'Big Data', 'Business Intelligence'] },
      { id: 'security', label: 'Security', keywords: ['Cybersecurity', 'Security', 'Hacker', 'Penetration', 'SOC', 'CISA', 'CISSP'] },
      { id: 'software', label: 'Engineering', keywords: ['Full Stack', 'Backend', 'Frontend', 'Mobile', 'iOS', 'Android', 'Blockchain', 'QA', 'Software'] },
      { id: 'product', label: 'Product & PM', keywords: ['Product Manager', 'Project Manager', 'Scrum', 'Agile', 'Business Analyst', 'Program Manager', 'PMP', 'TOGAF'] },
      { id: 'finance', label: 'Finance', keywords: ['Financial', 'Investment', 'Risk', 'Actuarial', 'Equity', 'Tax', 'Audit', 'CFA', 'FRM'] },
      { id: 'marketing', label: 'Marketing & Sales', keywords: ['Marketing', 'SEO', 'Growth', 'Content', 'Sales', 'HubSpot', 'Google Ads'] },
    ]
  },
  {
    id: 'salaryTier',
    title: 'Entry Salary Tier',
    type: 'checkbox',
    options: [
      { id: 'entry', label: '< ₹10L Entry Level', min: 0, max: 1000000 },
      { id: 'mid', label: '₹10L – ₹20L Mid-Senior', min: 1000000, max: 2000000 },
      { id: 'senior', label: '> ₹20L Leadership', min: 2000000, max: Infinity },
    ]
  },
  {
    id: 'payback',
    title: 'ROI Payback Speed',
    type: 'checkbox',
    options: [
      { id: 'fast', label: '< 6 Months Fast ROI', maxMonths: 6 },
      { id: 'medium', label: '6 – 12 Months Standard', minMonths: 6, maxMonths: 12 },
      { id: 'long', label: '> 12 Months Long Term', minMonths: 13, maxMonths: Infinity },
    ]
  },
  {
    id: 'sortBy',
    title: 'Sort Market Data',
    type: 'radio',
    options: [
      { id: 'ceiling_desc', label: 'Highest Ceiling Salary' },
      { id: 'entry_desc', label: 'Highest Entry Salary' },
      { id: 'jobs_desc', label: 'Highest Job Volume' },
      { id: 'payback_asc', label: 'Fastest ROI Payback' },
      { id: 'name_asc', label: 'Alphabetical Role Name' },
    ]
  }
];

const FilterAccordion = ({ section, selectedOptions, toggleOption, selectRadio }) => {
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
                const isSelected = section.type === 'radio'
                  ? selectedOptions === option.id
                  : Array.isArray(selectedOptions) && selectedOptions.includes(option.id);

                return (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                    {section.type === 'radio' ? (
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-200"
                        style={{ 
                          borderColor: isSelected ? 'var(--text)' : 'var(--border-mid)',
                          backgroundColor: isSelected ? 'var(--text)' : 'transparent'
                        }}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--bg)' }} />}
                      </div>
                    ) : (
                      <div 
                        className="w-4 h-4 rounded flex items-center justify-center border transition-all duration-200"
                        style={{ 
                          borderColor: isSelected ? 'var(--text)' : 'var(--border-mid)',
                          backgroundColor: isSelected ? 'var(--text)' : 'transparent'
                        }}
                      >
                        {isSelected && <Check size={12} color="var(--bg)" strokeWidth={4} />}
                      </div>
                    )}
                    <span 
                      className="text-sm transition-colors duration-200"
                      style={{ color: isSelected ? 'var(--text)' : 'var(--text-2)' }}
                    >
                      {option.label}
                    </span>
                    <input 
                      type={section.type === 'radio' ? 'radio' : 'checkbox'} 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => {
                        if (section.type === 'radio') {
                          selectRadio(section.id, option.id);
                        } else {
                          toggleOption(section.id, option.id);
                        }
                      }}
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

export default function MarketPulseSidebar({ 
  filters, 
  setFilters, 
  isMobileOpen, 
  setIsMobileOpen 
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

  const selectRadio = (category, optionId) => {
    setLocalFilters(prev => ({
      ...prev,
      [category]: optionId
    }));
  };

  const clearFilters = () => {
    setLocalFilters({ category: [], salaryTier: [], payback: [], sortBy: 'ceiling_desc' });
  };

  const handleApply = () => {
    setFilters(localFilters);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const localFilterCount = (localFilters.category?.length || 0) + 
                           (localFilters.salaryTier?.length || 0) + 
                           (localFilters.payback?.length || 0);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-transparent md:bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Filter size={18} color="var(--text)" />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Filters & Sort</h2>
        </div>
        {localFilterCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-xs font-medium hover:underline transition-all"
            style={{ color: 'var(--text-3)' }}
          >
            Clear ({localFilterCount})
          </button>
        )}
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-2" style={{ scrollbarWidth: 'thin' }}>
        {MARKET_FILTER_SECTIONS.map((section) => (
          <FilterAccordion 
            key={section.id} 
            section={section} 
            selectedOptions={localFilters[section.id]}
            toggleOption={toggleOption}
            selectRadio={selectRadio}
          />
        ))}
      </div>

      {/* Desktop apply button */}
      <div className="hidden lg:block mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleApply}
          className="w-full py-2.5 rounded-xl font-semibold text-[var(--bg)] transition-all duration-300 shadow-sm hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          {localFilterCount > 0 ? `Apply Filters (${localFilterCount})` : 'Apply All'}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
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
              
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={handleApply}
                  className="w-full py-3 rounded-xl font-semibold text-[var(--bg)] transition-all duration-300 shadow-lg hover:opacity-90"
                  style={{ background: 'var(--accent)' }}
                >
                  {localFilterCount > 0 ? `Apply Filters (${localFilterCount})` : 'Apply All'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export { MARKET_FILTER_SECTIONS };
