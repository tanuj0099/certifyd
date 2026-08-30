"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Mail, Phone } from "lucide-react";
import SuccessModal from "./SuccessModal";
import { motion } from "framer-motion";
import FaultyTerminal from "./reactbits/FaultyTerminal";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Hero() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [position, setPosition] = useState<number | null>(null);
  
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setStatus("submitting");

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          name: data.fullName,
          phone: data.phone || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      const result = await response.json();
      
      if (result.position) {
        setPosition(result.position);
      }
      
      setStatus("success");
      
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <section id="hero" className="w-full pt-10 pb-24 md:pt-16 md:pb-32 overflow-hidden relative group">
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-45 mix-blend-multiply dark:mix-blend-screen pointer-events-none">
        {mounted && (
          <FaultyTerminal
            scale={1.8}
            gridMul={[3.5, 1.75]}
            digitSize={1.3}
            timeScale={0.2}
            scanlineIntensity={0.15}
            glitchAmount={1}
            flickerAmount={0.15}
            noiseAmp={0.6}
            chromaticAberration={0}
            dither={0}
            curvature={0}
            tint="#94A3B8"
            mouseReact={true}
            mouseStrength={0.18}
            pageLoadAnimation={true}
            brightness={0.45}
            pause={reduceMotion}
            lightMode={resolvedTheme === 'light'}
          />
        )}
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column - Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start gap-5 md:gap-6 max-w-2xl relative"
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Verify certificate <span className="text-brand">ROI</span> before you buy. <span className="text-brand">Negotiate</span> before you accept your offer letter.
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl font-medium text-text-secondary leading-snug">
              Certifyd uses verified market data to calculate the exact ROI and expected salary bump for over 500 IT certifications, giving you the leverage to negotiate your next offer.
            </p>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto mt-6 lg:mt-0"
          >
            <div className="bg-card border border-border p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-sm">
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
                <div className="space-y-2 text-center mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-3xl font-display font-bold">Join the waitlist</h2>
                  <p className="text-text-secondary text-sm md:text-base">Secure your early access to the data engine.</p>
                </div>

                {status === "error" && (
                  <div className="p-3 rounded-md bg-negative/10 border border-negative/20 text-negative text-sm">
                    Something went wrong. Please try again.
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block mb-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-text-primary">Full Name</span>
                        <span className="text-brand text-lg leading-none">*</span>
                      </div>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50 pointer-events-none" />
                      <input
                        id="fullName"
                        autoComplete="name"
                        {...register("fullName")}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-text-primary placeholder:text-text-secondary/50"
                        placeholder="Rohan Sharma"
                      />
                    </div>
                    {errors.fullName && <p className="text-negative text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block mb-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-text-primary">Email Address</span>
                        <span className="text-brand text-lg leading-none">*</span>
                      </div>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-text-primary placeholder:text-text-secondary/50"
                        placeholder="rohan.sharma@gmail.com"
                      />
                    </div>
                    {errors.email && <p className="text-negative text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block mb-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-text-primary">Phone Number</span>
                        <span className="text-text-secondary/60 text-sm">(optional)</span>
                      </div>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50 pointer-events-none" />
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        {...register("phone")}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-text-primary placeholder:text-text-secondary/50"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-4 px-4 bg-brand hover:bg-brand/90 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg shadow-brand/20 cursor-target"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    "Join the waitlist"
                  )}
                </button>
              </form>

              {status === "success" && (
                <SuccessModal 
                  onClose={() => {
                    setStatus("idle");
                    reset();
                  }} 
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
