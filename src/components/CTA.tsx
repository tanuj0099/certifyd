"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle brand glow in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl relative z-10 text-center"
      >
        <span className="text-brand text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4 block">
          Early Access
        </span>
        
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-text-primary tracking-tight">
          Get Early Beta Access
        </h2>
        
        <p className="text-text-secondary text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Be part of our exclusive initial group. Secure your spot on the waitlist to receive access invites, promotional fee waivers, and community bonuses.
        </p>
        
        <Link 
          href="#hero" 
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand hover:bg-brand/90 text-white rounded-full font-bold text-lg transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/25"
        >
          Join the Waitlist Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </section>
  );
}
