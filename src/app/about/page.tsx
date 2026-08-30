"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FaultyTerminal from "@/components/reactbits/FaultyTerminal";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function AboutPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col">
        <section className="py-24 bg-background relative overflow-hidden flex-1 flex flex-col justify-center">
          <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none">
            {mounted && (
              <FaultyTerminal
                scale={1.5}
                gridMul={[2.5, 1.25]}
                digitSize={1.1}
                timeScale={0.15}
                scanlineIntensity={0.1}
                glitchAmount={0.5}
                flickerAmount={0.1}
                noiseAmp={0.4}
                chromaticAberration={0}
                dither={0}
                curvature={0}
                tint="#94A3B8"
                mouseReact={true}
                mouseStrength={0.1}
                pageLoadAnimation={false}
                brightness={0.3}
                pause={reduceMotion}
                lightMode={resolvedTheme === 'light'}
              />
            )}
          </div>
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
                Democratizing <span className="text-brand">IT Career Data</span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Certifyd was built to bring radical transparency to the Indian tech certification market. We believe you should know exactly what a certification is worth before you invest your time and money.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.2 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-12 md:mt-16"
            >
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm hover:border-border-strong transition-colors duration-300"
              >
                <h3 className="text-xl md:text-2xl font-display font-bold mb-3 md:mb-4 text-text-primary">The Problem</h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                  Millions of Indian IT professionals spend months studying and thousands of rupees on certifications every year, flying blind on whether it will actually impact their next offer letter or promotion cycle.
                </p>
              </motion.div>

              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="bg-card border border-brand/30 p-6 md:p-8 rounded-xl shadow-[0_0_40px_-15px_rgba(249,115,22,0.1)] hover:border-brand/50 transition-colors duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="text-xl md:text-2xl font-display font-bold mb-3 md:mb-4 text-text-primary relative z-10">Our Solution</h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed relative z-10">
                  We aggregate verified market data, parsing thousands of compensation data points across major Indian tech hubs (Bengaluru, Hyderabad, Pune, NCR) to give you the exact ROI and negotiation leverage you need.
                </p>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-20 text-center"
            >
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-elevated border border-border hover:border-brand/50 hover:bg-brand/5 text-text-primary font-medium transition-all duration-300 cursor-target group"
              >
                Return to Calculator
                <ArrowRight className="w-4 h-4 text-brand group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
