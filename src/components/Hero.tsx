"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Mail, Phone } from "lucide-react";
import SuccessModal from "./SuccessModal";
import { motion } from "framer-motion";
import MagnetLines from "./reactbits/MagnetLines";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Hero() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [position, setPosition] = useState<number | null>(null);

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
      // 1. Get current count to determine position
      const { count } = await supabase
        .from('certifyd_waitlist')
        .select('*', { count: 'exact', head: true });

      const newPosition = (count || 0) + 1;

      // 2. Insert record and artificial delay simultaneously
      const [insertResult] = await Promise.all([
        supabase.from('certifyd_waitlist').insert([
          {
            name: data.fullName,
            email: data.email,
            phone: data.phone || null,
            position: newPosition,
          }
        ]),
        new Promise(resolve => setTimeout(resolve, 2000)) // Force minimum 2s load time
      ]);
      
      const { error } = insertResult;

      if (error) {
        if (error.code === "23505") { // Unique constraint violation (email)
          // Just pretend it's a success to prevent scanning, or handle explicitly
          // Assuming user wants to know they are already on it:
          setStatus("success");
          return;
        }
        throw error;
      }

      setPosition(newPosition);
      setStatus("success");
      
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <section id="hero" className="w-full pt-10 pb-24 md:pt-16 md:pb-32 overflow-hidden relative group">
      <div className="absolute inset-0 -z-10 opacity-15 mix-blend-multiply dark:mix-blend-screen flex items-center justify-center overflow-hidden pt-10">
        <MagnetLines 
          rows={20} 
          columns={40} 
          containerSize="100%" 
          lineColor="var(--text-secondary)" 
          lineWidth="0.3vmin" 
          lineHeight="2.5vmin"
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column - Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start gap-6 max-w-2xl relative"
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Verify certificate <span className="text-brand">ROI</span> before you buy. <span className="text-brand">Negotiate</span> before you accept your offer letter.
            </h1>
            <p className="text-xl md:text-2xl font-medium text-text-secondary leading-snug">
              Certifyd uses verified market data to calculate the exact ROI and expected salary bump for over 500 IT certifications, giving you the leverage to negotiate your next offer.
            </p>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
          >
            <div className="bg-card border border-border p-8 rounded-3xl relative overflow-hidden shadow-sm">
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2 text-center mb-8">
                  <h2 className="text-3xl font-display font-bold">Join the waitlist</h2>
                  <p className="text-text-secondary text-sm md:text-base">Secure your early access to the data engine.</p>
                </div>

                {status === "error" && (
                  <div className="p-3 rounded-md bg-negative/10 border border-negative/20 text-negative text-sm">
                    Something went wrong. Please try again.
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="fullName" className="block text-sm font-semibold text-text-primary">Full Name</label>
                      <span className="text-brand text-lg leading-none">*</span>
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
                      <input
                        id="fullName"
                        {...register("fullName")}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-text-primary placeholder:text-text-secondary/50"
                        placeholder="Rohan Sharma"
                      />
                    </div>
                    {errors.fullName && <p className="text-negative text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="email" className="block text-sm font-semibold text-text-primary">Email Address</label>
                      <span className="text-brand text-lg leading-none">*</span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
                      <input
                        id="email"
                        type="email"
                        {...register("email")}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-text-primary placeholder:text-text-secondary/50"
                        placeholder="rohan.sharma@gmail.com"
                      />
                    </div>
                    {errors.email && <p className="text-negative text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="phone" className="block text-sm font-semibold text-text-primary">Phone Number</label>
                      <span className="text-text-secondary/60 text-sm">(optional)</span>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
                      <input
                        id="phone"
                        type="tel"
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
