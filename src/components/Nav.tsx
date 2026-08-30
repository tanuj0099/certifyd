"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function Nav() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "How it works", href: "/how-it-works" },
    { name: "FAQ", href: "/faq" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
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
            {navLinks.map(link => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="relative text-text-secondary hover:text-text-primary transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-brand after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left after:duration-300 cursor-target"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
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
                className="p-2 rounded-full hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors cursor-target"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            <button 
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors cursor-target"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="flex flex-col px-4 py-4 space-y-4">
              {navLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  className="text-text-secondary hover:text-text-primary font-medium text-lg py-2 border-b border-border/50"
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex items-center gap-4 pt-2">
                <a href="https://www.instagram.com/officialcertifyd.in" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors p-2 bg-elevated rounded-full">
                  <FaInstagram size={20} />
                </a>
                <a href="https://www.linkedin.com/in/certifyd-in" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors p-2 bg-elevated rounded-full">
                  <FaLinkedin size={20} />
                </a>
                <a href="https://chat.whatsapp.com/Gi7GZWKTrqI9Pfe4JprJT5" target="_blank" rel="noreferrer" className="text-text-secondary hover:text-text-primary transition-colors p-2 bg-elevated rounded-full" title="Join Community">
                  <FaWhatsapp size={20} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
