"use client";
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

const TargetCursor = ({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  cursorColor = '#fff',
  cursorColorOnTarget = '#00ff00',
  hideDefaultCursor = true,
}) => {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const cornersRef = useRef(null);
  const spinTl = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !cursorRef.current) return;

    if (hideDefaultCursor) {
      document.body.style.cursor = 'none';
    }

    const cursor = cursorRef.current;
    const corners = Array.from(cursor.querySelectorAll('.target-cursor-corner'));
    cornersRef.current = corners;

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      opacity: 1
    });

    spinTl.current = gsap.timeline({ repeat: -1 })
      .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

    const moveHandler = (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    };

    let hoverTargets = [];
    const updateHoverTargets = () => {
      hoverTargets.forEach(target => {
        target.removeEventListener('mouseenter', handleMouseEnter);
        target.removeEventListener('mouseleave', handleMouseLeave);
      });
      hoverTargets = Array.from(document.querySelectorAll(targetSelector));
      hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', handleMouseEnter);
        target.addEventListener('mouseleave', handleMouseLeave);
      });
    };

    const handleMouseEnter = (e) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const padding = 4;
      
      spinTl.current?.pause();
      gsap.to(cursor, { rotation: 0, duration: 0.2 });

      if (cursorColorOnTarget) {
        gsap.to(corners, { borderColor: cursorColorOnTarget, duration: 0.2 });
        if (dotRef.current) gsap.to(dotRef.current, { backgroundColor: cursorColorOnTarget, duration: 0.2 });
      }

      corners.forEach((corner, i) => {
        const positions = [
          { x: -rect.width/2 - padding, y: -rect.height/2 - padding },
          { x: rect.width/2 + padding - 12, y: -rect.height/2 - padding },
          { x: rect.width/2 + padding - 12, y: rect.height/2 + padding - 12 },
          { x: -rect.width/2 - padding, y: rect.height/2 + padding - 12 }
        ];
        gsap.to(corner, { x: positions[i].x, y: positions[i].y, duration: 0.2 });
      });
    };

    const handleMouseLeave = () => {
      spinTl.current?.resume();
      
      if (cursorColorOnTarget) {
        gsap.to(corners, { borderColor: cursorColor, duration: 0.2 });
        if (dotRef.current) gsap.to(dotRef.current, { backgroundColor: cursorColor, duration: 0.2 });
      }

      corners.forEach((corner, i) => {
        const resetPositions = [
          { x: -18, y: -18 },
          { x: 6, y: -18 },
          { x: 6, y: 6 },
          { x: -18, y: 6 }
        ];
        gsap.to(corner, { x: resetPositions[i].x, y: resetPositions[i].y, duration: 0.2 });
      });
    };

    window.addEventListener('mousemove', moveHandler);
    
    const interval = setInterval(updateHoverTargets, 1000);
    updateHoverTargets();

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      clearInterval(interval);
      hoverTargets.forEach(target => {
        target.removeEventListener('mouseenter', handleMouseEnter);
        target.removeEventListener('mouseleave', handleMouseLeave);
      });
      document.body.style.cursor = 'auto';
      spinTl.current?.kill();
    };
  }, [mounted, targetSelector, spinDuration, cursorColor, cursorColorOnTarget, hideDefaultCursor]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" style={{ backgroundColor: cursorColor }} />
      <div className="target-cursor-corner corner-tl" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-tr" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-br" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-bl" style={{ borderColor: cursorColor }} />
    </div>,
    document.body
  );
};

export default TargetCursor;
