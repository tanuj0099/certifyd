"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const faqs = [
  {
    question: "Where does the salary data come from?",
    answer: "Our data is aggregated and verified from multiple professional sources including AmbitionBox, Payscale India, and Naukri. We cross-reference this with anonymous user submissions to ensure accuracy."
  },
  {
    question: "How is ROI actually calculated?",
    answer: "We use a proprietary formula: Cert ROI = (ΔSalary × Market Heat Factor − Total Cost) ÷ Opportunity Cost. This gives you a realistic percentage of how much value the certification adds relative to what you spend in money and time."
  },
  {
    question: "Is this free?",
    answer: "Yes, joining the waitlist and using the core calculator will be 100% free. We may introduce premium features later for personalized negotiation coaching."
  },
  {
    question: "Do you store my resume or offer letter?",
    answer: "No. If you choose to upload documents for verification in the future, they are processed locally or immediately scrubbed of PII (Personally Identifiable Information) and deleted from our servers."
  },
  {
    question: "How often is the data updated?",
    answer: "Our market data is refreshed monthly to reflect the latest hiring trends and salary bands across major Indian tech hubs."
  }
];

export default function FAQ({ limit }: { limit?: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const displayedFaqs = limit ? faqs.slice(0, limit) : faqs;

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-text-secondary text-lg">
            Everything you need to know about the data and the platform.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="space-y-4"
        >
          {displayedFaqs.map((faq, index) => (
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
              }}
              key={index} 
              className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
                openIndex === index ? "border-brand/30 bg-elevated/30" : "border-border bg-card hover:border-border-strong"
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none cursor-target"
              >
                <span className="font-medium text-text-primary pr-8">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-text-secondary transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? "rotate-180 text-brand" : ""
                  }`} 
                />
              </button>
              
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="p-5 pt-0 text-text-secondary text-sm leading-relaxed border-t border-border/50 mt-1">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {limit && (
          <div className="mt-10 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 text-brand hover:text-brand/80 font-medium transition-colors cursor-target">
              View all FAQs <span>→</span>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
