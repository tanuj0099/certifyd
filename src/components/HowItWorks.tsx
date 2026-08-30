"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

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

  // Scroll mapping
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      setActiveStep(1);
    } else if (latest < 0.66) {
      setActiveStep(2);
    } else {
      setActiveStep(3);
    }
  });

  return (
    // Tall section to allow meaningful scroll mapping
    <section id="how-it-works" ref={sectionRef} className="py-12 md:py-24 bg-elevated/30 border-y border-border min-h-[300vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl sticky top-20 flex flex-col justify-center h-[calc(100vh-6rem)]">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4 md:mb-8 shrink-0"
        >
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-1 md:mb-4">How it works</h2>
          <p className="text-text-secondary text-sm md:text-lg max-w-2xl mx-auto">
            Get clarity on your IT career moves in under 60 seconds.
          </p>
        </motion.div>

        {/* Browser Window Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full flex-1 min-h-[150px] max-h-[350px] max-w-4xl mx-auto bg-card rounded-t-xl rounded-b-md border border-border overflow-hidden mb-6 md:mb-12 shadow-sm shrink"
        >
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
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
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
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full max-w-md flex flex-col items-center gap-4"
                >
                  <div className="text-sm font-medium text-text-secondary uppercase tracking-wider">Projected ROI</div>
                  <div className="text-6xl font-mono font-bold text-brand">24%</div>
                  <div className="flex gap-4 w-full mt-4">
                    <div className="h-20 flex-1 bg-elevated border border-border rounded-md" />
                    <div className="h-20 flex-1 bg-elevated border border-border rounded-md" />
                  </div>
                </motion.div>
              )}
              {activeStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
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
        </motion.div>

        {/* Horizontal Stepper */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-2 md:gap-8 shrink-0"
        >
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                setActiveStep(step.id);
              }}
              className="flex flex-col items-center md:items-start text-center md:text-left group outline-none"
            >
              <div className="flex items-center justify-center md:justify-start w-full mb-2 md:mb-4">
                <div className={`w-8 h-8 md:w-8 md:h-8 rounded-full flex items-center justify-center font-mono text-xs md:text-sm font-bold transition-colors duration-300 shrink-0 ${
                  activeStep === step.id 
                    ? "bg-brand text-white" 
                    : "bg-elevated border border-border text-text-secondary group-hover:border-brand/50"
                }`}>
                  {step.id}
                </div>
                <div className={`hidden md:block flex-1 h-px ml-4 transition-colors duration-300 ${
                  activeStep > step.id ? "bg-brand/50" : "bg-border"
                }`} />
              </div>
              <h3 className={`font-semibold text-xs sm:text-sm md:text-lg mb-1 md:mb-2 transition-colors duration-300 ${
                activeStep === step.id ? "text-text-primary" : "text-text-secondary"
              }`}>
                {step.title}
              </h3>
              <p className="hidden md:block text-text-secondary text-sm">
                {step.desc}
              </p>
            </button>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
