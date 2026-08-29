'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "Where does the salary data come from?",
    a: "We source data from verified compensation datasets, including AmbitionBox, Payscale India, and Naukri, and apply market calibration based on regional demand factors."
  },
  {
    q: "How is ROI actually calculated?",
    a: "We use a standard formula: (Expected Salary Increase × Market Heat Factor − Total Cost of Certification) ÷ Opportunity Cost. This produces a single, comparable percentage representing the financial return."
  },
  {
    q: "Is this free?",
    a: "The ROI Calculator and basic Market Pulse tools are completely free. Early waitlist members will also receive a lifetime free tier for the Offer Letter Analyzer."
  },
  {
    q: "Do you store my resume or offer letter?",
    a: "No. We do not persistently store raw documents. Data extracted for analysis is held only in memory during the session and discarded immediately after producing the report."
  },
  {
    q: "How often is the data updated?",
    a: "Salary aggregates and certification costs are refreshed on a weekly basis, while the Market Pulse (hiring trends) is updated monthly."
  }
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden transition-colors">
              <button 
                type="button" 
                onClick={() => toggle(idx)}
                className="w-full px-6 py-4 text-left font-semibold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-4 focus:outline-none transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`px-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 pb-5' : 'max-h-0 opacity-0 overflow-hidden'}`}
              >
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
