"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function Nav() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Only set if we're in the browser to avoid hydration mismatch
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setTheme("light");
    } else {
      html.classList.add("dark");
      setTheme("dark");
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {/* Logo Mark */}
            <div className="w-8 h-8 rounded bg-brand flex items-center justify-center font-bold text-white shadow-sm">
              C
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-text-primary">
              Certifyd
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-text-primary transition-colors">
              How it works
            </button>
            <button onClick={() => scrollToSection("faq")} className="hover:text-text-primary transition-colors">
              FAQ
            </button>
            <button onClick={() => scrollToSection("contact")} className="hover:text-text-primary transition-colors">
              Contact
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => scrollToSection("hero")} 
              className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-md hover:bg-brand/90 transition-colors shadow-sm"
            >
              Join waitlist
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
