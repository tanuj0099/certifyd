"use client";

import { FaGoogle, FaAws, FaMicrosoft } from "react-icons/fa";
import { SiIsc2, SiComptia, SiCisco } from "react-icons/si";

const vendors = [
  { name: "Google", icon: FaGoogle },
  { name: "AWS", icon: FaAws },
  { name: "Microsoft", icon: FaMicrosoft },
  { name: "ISC2", icon: SiIsc2 },
  { name: "CompTIA", icon: SiComptia },
  { name: "Cisco", icon: SiCisco },
  { name: "PMI", icon: null }, // Text fallback
];

export default function Logos() {
  return (
    <section className="py-12 bg-background border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 text-center mb-8">
        <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">
          Supported Certifications
        </p>
      </div>
      
      <div className="relative flex overflow-x-hidden w-full group">
        <div className="flex animate-marquee group-hover:[animation-play-state:paused] whitespace-nowrap">
          {[...vendors, ...vendors, ...vendors, ...vendors].map((vendor, i) => (
            <div
              key={`${vendor.name}-${i}`}
              className="flex items-center justify-center mx-12 text-text-secondary/50 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:text-text-primary transition-all duration-300"
            >
              {vendor.icon ? (
                <vendor.icon size={36} />
              ) : (
                <span className="text-2xl font-display font-bold">{vendor.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
