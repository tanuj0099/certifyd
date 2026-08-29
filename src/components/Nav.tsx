"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            {/* Logo Mark */}
            <Image 
              src="/logo.svg" 
              alt="Certifyd Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-semibold text-xl tracking-tight text-text-primary">
              Certifyd
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="relative text-text-secondary hover:text-text-primary transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-brand after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-300">
              Home
            </Link>
            <Link href="/how-it-works" className="relative text-text-secondary hover:text-text-primary transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-brand after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-300">
              How it works
            </Link>
            <Link href="/faq" className="relative text-text-secondary hover:text-text-primary transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-brand after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-300">
              FAQ
            </Link>
            <Link href="/about" className="relative text-text-secondary hover:text-text-primary transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-brand after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-300">
              About
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 pr-2 border-r border-border">
              <a href="https://www.instagram.com/officialcertifyd.in" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                <FaInstagram size={18} />
              </a>
              <a href="https://www.linkedin.com/in/certifyd-in" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                <FaLinkedin size={18} />
              </a>
              <a href="https://chat.whatsapp.com/Gi7GZWKTrqI9Pfe4JprJT5" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors" title="Join Community">
                <FaWhatsapp size={18} />
              </a>
            </div>
            
            {mounted && (
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
