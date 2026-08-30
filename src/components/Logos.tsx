"use client";

import { motion } from "framer-motion";
import { 
  FaAws, 
  FaGoogle, 
  FaMicrosoft, 
  FaNetworkWired, 
  FaDatabase, 
  FaClipboardCheck,
  FaShieldAlt,
  FaLaptopCode
} from "react-icons/fa";

export default function Logos() {
  const companies = [
    { name: "AWS", icon: FaAws },
    { name: "Google Cloud", icon: FaGoogle },
    { name: "Microsoft", icon: FaMicrosoft },
    { name: "Cisco", icon: FaNetworkWired },
    { name: "Oracle", icon: FaDatabase },
    { name: "PMI", icon: FaClipboardCheck },
    { name: "ISC2", icon: FaShieldAlt },
    { name: "CompTIA", icon: FaLaptopCode },
  ];

  // duplicate to ensure seamless loop
  const duplicatedCompanies = [...companies, ...companies, ...companies];

  return (
    <section className="py-12 bg-background border-b border-border overflow-hidden relative">
      <div className="container mx-auto px-4 text-center mb-8">
        <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">
          Supported Certifications
        </p>
      </div>

      <div className="relative w-full flex">
        {/* Gradients for smooth fade on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-[100px] sm:w-[150px] bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[100px] sm:w-[150px] bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={{ x: ["0%", "-33.333333%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex w-max items-center gap-12 sm:gap-20 px-10 cursor-target"
        >
          {duplicatedCompanies.map((company, index) => {
            const Icon = company.icon;
            return (
              <div 
                key={index} 
                className="flex items-center gap-3 text-text-secondary opacity-70 hover:opacity-100 hover:text-text-primary transition-all duration-300 cursor-target"
              >
                <Icon size={28} />
                <span className="font-sans font-semibold text-lg tracking-tight">
                  {company.name}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
