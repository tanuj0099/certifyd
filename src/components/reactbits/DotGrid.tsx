"use client";

import React, { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";

const BASE_RADIUS = 1.5;
const HOVER_RADIUS_MULTIPLIER = 1.4;
const INTERACTION_RADIUS = 90;
const EASE = 0.1;

// Colors
const HOVER_COLOR = { r: 249, g: 115, b: 22 }; // #F97316
const LIGHT_BASE = { r: 226, g: 232, b: 240 }; // #E2E8F0
const DARK_BASE = { r: 55, g: 65, b: 81 }; // #374151

interface Dot {
  x: number;
  y: number;
  r: number; // Current radius
  color: { r: number; g: number; b: number }; // Current color
}

export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const disableInteraction = prefersReducedMotion || isTouchDevice;

    const baseColor = resolvedTheme === "dark" ? DARK_BASE : LIGHT_BASE;

    let mouseX = -1000;
    let mouseY = -1000;

    const initDots = () => {
      // Resize canvas to parent bounds
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }

      // Responsive spacing: 40px on desktop, 60px on mobile for less density
      const spacing = width < 768 ? 60 : 40;
      dots = [];

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          dots.push({
            x,
            y,
            r: BASE_RADIUS,
            color: { ...baseColor },
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (disableInteraction) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    // Attach mouse listeners to the parent section to ensure we catch movements
    // even if they hover over other elements (since canvas is pointer-events-none)
    const parent = canvas.parentElement;
    if (parent && !disableInteraction) {
      parent.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        let targetR = BASE_RADIUS;
        let targetColor = baseColor;

        if (!disableInteraction) {
          const dx = mouseX - dot.x;
          const dy = mouseY - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < INTERACTION_RADIUS) {
            // Calculate a factor between 0 and 1 for smoothness within the radius
            const factor = 1 - distance / INTERACTION_RADIUS;
            targetR = BASE_RADIUS + BASE_RADIUS * (HOVER_RADIUS_MULTIPLIER - 1) * factor;
            
            // Mix colors
            targetColor = {
              r: baseColor.r + (HOVER_COLOR.r - baseColor.r) * factor,
              g: baseColor.g + (HOVER_COLOR.g - baseColor.g) * factor,
              b: baseColor.b + (HOVER_COLOR.b - baseColor.b) * factor,
            };
          }
        }

        // Ease towards target
        dot.r += (targetR - dot.r) * EASE;
        dot.color.r += (targetColor.r - dot.color.r) * EASE;
        dot.color.g += (targetColor.g - dot.color.g) * EASE;
        dot.color.b += (targetColor.b - dot.color.b) * EASE;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${Math.round(dot.color.r)}, ${Math.round(dot.color.g)}, ${Math.round(dot.color.b)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    initDots();
    draw();

    window.addEventListener("resize", initDots);

    return () => {
      window.removeEventListener("resize", initDots);
      if (parent && !disableInteraction) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted, resolvedTheme]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 opacity-15 pointer-events-none"
    />
  );
}
