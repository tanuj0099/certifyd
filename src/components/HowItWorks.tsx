"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: 1,
    title: "Pick your certification",
    desc: "Select the certification you're considering and enter your current salary.",
  },
  {
    id: 2,
    title: "Get your ROI number",
    desc: "We analyze verified market data to project your exact ROI and salary bump.",
  },
  {
    id: 3,
    title: "Negotiate with data",
    desc: "Walk into your interview with real city-calibrated offer data in hand.",
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  // Auto-advance or scroll-trigger can be added here.
  // For simplicity and accessibility, let's use an auto-advancing interval that pauses on hover.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev === 3 ? 1 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 bg-elevated/30 border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Get clarity on your IT career moves in under 60 seconds.
          </p>
        </div>

        {/* Browser Window Mockup */}
        <div className="relative w-full aspect-video md:aspect-[16/9] max-w-4xl mx-auto bg-card rounded-t-xl rounded-b-md border border-border shadow-sm overflow-hidden mb-12">
          {/* Browser Chrome */}
          <div className="h-10 border-b border-border bg-elevated flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-border-strong/50" />
              <div className="w-3 h-3 rounded-full bg-border-strong/50" />
              <div className="w-3 h-3 rounded-full bg-border-strong/50" />
            </div>
            <div className="mx-auto w-1/3 h-5 bg-background border border-border rounded text-[10px] text-center text-text-secondary leading-tight flex items-center justify-center">
              certifyd.in
            </div>
          </div>
          
          {/* Content Area */}
          <div className="relative w-full h-[calc(100%-2.5rem)] bg-background flex items-center justify-center p-8 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md space-y-4"
                >
                  <div className="h-12 w-full bg-elevated border border-border rounded-md animate-pulse" />
                  <div className="h-12 w-full bg-elevated border border-border rounded-md animate-pulse" />
                  <div className="h-12 w-32 bg-brand/20 rounded-md" />
                </motion.div>
              )}
              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-md flex flex-col items-center gap-4"
                >
                  <div className="text-sm font-medium text-text-secondary uppercase tracking-wider">Projected ROI</div>
                  <div className="text-6xl font-mono font-bold text-brand">240%</div>
                  <div className="flex gap-4 w-full mt-4">
                    <div className="h-20 flex-1 bg-elevated border border-border rounded-md" />
                    <div className="h-20 flex-1 bg-elevated border border-border rounded-md" />
                  </div>
                </motion.div>
              )}
              {activeStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-lg space-y-4"
                >
                  <div className="h-8 w-1/3 bg-text-primary/10 rounded-md mb-6" />
                  <div className="flex gap-4 items-end h-32">
                    <div className="flex-1 bg-elevated border border-border rounded-t-md h-[40%]" />
                    <div className="flex-1 bg-elevated border border-border rounded-t-md h-[70%]" />
                    <div className="flex-1 bg-brand/80 rounded-t-md h-[100%]" />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-text-secondary mt-2">
                    <span>Base</span>
                    <span>Market</span>
                    <span className="text-brand font-bold">Your Offer</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Horizontal Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className="flex flex-col items-center md:items-start text-center md:text-left group outline-none"
            >
              <div className="flex items-center w-full mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-colors ${
                  activeStep === step.id 
                    ? "bg-brand text-white shadow-sm" 
                    : "bg-elevated border border-border text-text-secondary group-hover:border-brand/50"
                }`}>
                  {step.id}
                </div>
                <div className={`hidden md:block flex-1 h-px ml-4 transition-colors ${
                  activeStep > step.id ? "bg-brand/50" : "bg-border"
                }`} />
              </div>
              <h3 className={`font-semibold text-lg mb-2 transition-colors ${
                activeStep === step.id ? "text-text-primary" : "text-text-secondary"
              }`}>
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm">
                {step.desc}
              </p>
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
