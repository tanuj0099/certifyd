"use client";

import React, { useRef, useEffect, useState } from "react";

export default function CurvedLoop() {
  const textRef = useRef<SVGTextPathElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !textRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let offset = 0;
    const speed = 0.03; // Slow, continuous drift

    const animate = () => {
      offset -= speed;
      // Reset loop to prevent offset from growing indefinitely
      // 50% is half the path, assuming we duplicated the string enough times
      if (offset <= -50) {
        offset += 50; 
      }
      if (textRef.current) {
        textRef.current.setAttribute("startOffset", `${offset}%`);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [mounted]);

  if (!mounted) return null;

  const content = "500+ CERTIFICATIONS TRACKED • CITY-CALIBRATED DATA • REAL OFFER OUTCOMES • ";
  // Duplicate content to ensure it loops smoothly across wide screens
  const fullText = content.repeat(6); 

  return (
    <div className="w-full h-[60px] md:h-[80px] overflow-hidden flex items-center justify-center bg-transparent border-t border-border/30 opacity-70">
      <svg
        className="w-[150vw] h-full absolute left-1/2 -translate-x-1/2"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <defs>
          <path
            id="shallowCurve"
            d="M 0,80 Q 500,0 1000,80"
            fill="none"
          />
        </defs>
        <text className="font-display font-semibold tracking-[0.2em] uppercase text-text-secondary fill-current text-[12px] md:text-[14px]">
          <textPath ref={textRef} href="#shallowCurve" startOffset="0%">
            {fullText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
