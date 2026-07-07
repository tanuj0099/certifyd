'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, ArrowLeft, X, Award, 
  TrendingUp, ShieldCheck, Zap, CheckCircle2, Compass
} from 'lucide-react';

const FH = "var(--font-head, var(--font-sans))";
const FM = "var(--font-mono)";
const FB = "var(--font-body, var(--font-sans))";

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard!',
    subtitle: 'Career Intelligence Overview',
    content: "We've calibrated your workspace using your onboarding preferences. Let's take a 60-second guided tour of the key tools available to accelerate your career ROI.",
    targetSelector: null, // Center popover
    section: 'active-paths',
    icon: Sparkles,
  },
  {
    id: 'active-paths',
    title: 'Active Certification Paths',
    subtitle: 'ROI & Break-Even Tracking',
    content: 'This main dashboard area tracks your primary certification goals. Here you can see your exact financial break-even timeline calculated against live market salary ranges in your city.',
    targetSelector: '[data-tour="main-content"]',
    section: 'active-paths',
    icon: Award,
  },
  {
    id: 'study-tracker',
    title: 'Preparation Velocity & Burn Rate',
    subtitle: 'Study Tracker',
    content: 'Our interactive Study Tracker calculates your weekly preparation velocity. It predicts exam readiness and warns you if your pacing drops below your target completion date.',
    targetSelector: '[data-tour="main-content"]',
    section: 'study-tracker',
    icon: TrendingUp,
  },
  {
    id: 'milestones',
    title: 'Defensible Milestone Moats',
    subtitle: 'Career Defensibility',
    content: 'Certifications are only part of the equation. Track critical career moats—like mock exam scores, portfolio labs, and salary negotiation prep—to build permanent defensibility against AI automation.',
    targetSelector: '[data-tour="main-content"]',
    section: 'milestones',
    icon: ShieldCheck,
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions & AI Radar',
    subtitle: 'Tool Suite',
    content: 'Use this quick action sidebar to jump into our flagship tools: explore 100+ technical certifications on Cert Radar, run custom ROI calculations, or analyze an offer letter with AI.',
    targetSelector: '[data-tour="quick-actions"]',
    section: 'active-paths',
    icon: Zap,
  },
  {
    id: 'finish',
    title: "You're Ready to Build!",
    subtitle: 'Tour Complete',
    content: "Your workspace is fully initialized and ready. Dive in, track your progress, and let data drive your next major career jump!",
    targetSelector: null,
    section: 'active-paths',
    icon: CheckCircle2,
  }
];

export default function GuidedTour({ isOpen, onClose, onSectionChange }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Update window size on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger section change when step changes
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep.section && onSectionChange) {
      onSectionChange(currentStep.section);
    }
  }, [currentStepIndex, isOpen, currentStep.section, onSectionChange]);

  // Measure target DOM element
  useEffect(() => {
    if (!isOpen) return;
    
    // Give DOM a short moment to render section switch
    const timer = setTimeout(() => {
      if (!currentStep.targetSelector) {
        setTargetRect(null);
        return;
      }
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Add padding around target
        const pad = 12;
        setTargetRect({
          top: Math.max(0, rect.top - pad),
          left: Math.max(0, rect.left - pad),
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          right: Math.min(window.innerWidth, rect.right + pad),
          bottom: Math.min(window.innerHeight, rect.bottom + pad),
        });
        // Scroll target into view smoothly if out of view
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        setTargetRect(null);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isOpen, windowSize, currentStep.targetSelector]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('certifyd_has_seen_tour', 'true');
    localStorage.removeItem('certifyd_start_tour');
    if (onClose) onClose();
  };

  const StepIcon = currentStep.icon || Sparkles;

  // Compute popover position relative to spotlight box
  let popoverStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10001,
    width: '90%',
    maxWidth: '440px',
  };

  if (targetRect) {
    // If target is on the left side of screen, position popover to the right or bottom
    const spaceBelow = windowSize.height - targetRect.bottom;
    const spaceRight = windowSize.width - targetRect.right;
    const spaceLeft = targetRect.left;

    if (windowSize.width > 768 && spaceRight > 460) {
      // Put to the right
      popoverStyle = {
        position: 'fixed',
        top: Math.max(20, Math.min(targetRect.top, windowSize.height - 340)),
        left: targetRect.right + 20,
        zIndex: 10001,
        width: '420px',
      };
    } else if (windowSize.width > 768 && spaceLeft > 460) {
      // Put to the left
      popoverStyle = {
        position: 'fixed',
        top: Math.max(20, Math.min(targetRect.top, windowSize.height - 340)),
        left: targetRect.left - 440,
        zIndex: 10001,
        width: '420px',
      };
    } else if (spaceBelow > 320) {
      // Put below
      popoverStyle = {
        position: 'fixed',
        top: targetRect.bottom + 20,
        left: Math.max(20, Math.min(targetRect.left, windowSize.width - 440)),
        zIndex: 10001,
        width: '90%',
        maxWidth: '440px',
      };
    } else {
      // Put above
      popoverStyle = {
        position: 'fixed',
        top: Math.max(20, targetRect.top - 320),
        left: Math.max(20, Math.min(targetRect.left, windowSize.width - 440)),
        zIndex: 10001,
        width: '90%',
        maxWidth: '440px',
      };
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'auto' }}>
      
      {/* ── 4-Mask Backdrop System (Blurs & Dims screen around target box) ── */}
      {targetRect ? (
        <>
          {/* Top Mask */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: targetRect.top, background: 'rgba(11, 15, 25, 0.75)', backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }} onClick={handleClose} />
          {/* Bottom Mask */}
          <div style={{ position: 'fixed', top: targetRect.bottom, left: 0, right: 0, bottom: 0, background: 'rgba(11, 15, 25, 0.75)', backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }} onClick={handleClose} />
          {/* Left Mask */}
          <div style={{ position: 'fixed', top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height, background: 'rgba(11, 15, 25, 0.75)', backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }} onClick={handleClose} />
          {/* Right Mask */}
          <div style={{ position: 'fixed', top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height, background: 'rgba(11, 15, 25, 0.75)', backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }} onClick={handleClose} />
          
          {/* Glowing Target Spotlight Cutout Border */}
          <div
            style={{
              position: 'fixed',
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              borderRadius: '20px',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 32px rgba(249, 115, 22, 0.4), inset 0 0 16px rgba(249, 115, 22, 0.15)',
              pointerEvents: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </>
      ) : (
        /* Full-screen mask for center modal steps */
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }} onClick={handleClose} />
      )}

      {/* ── Floating Popover Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            ...popoverStyle,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            color: 'var(--text)',
            pointerEvents: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '99px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: FM, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <StepIcon size={13} /> {currentStep.subtitle}
            </div>
            
            <button
              onClick={handleClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Skip Tour"
            >
              <X size={18} />
            </button>
          </div>

          <h3 style={{ fontFamily: FH, fontSize: '22px', fontWeight: '800', color: 'var(--text)', margin: '0 0 10px', lineHeight: '1.2' }}>
            {currentStep.title}
          </h3>

          <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.6', margin: '0 0 24px' }}>
            {currentStep.content}
          </p>

          {/* Footer & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {/* Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {TOUR_STEPS.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    width: i === currentStepIndex ? '24px' : '6px',
                    height: '6px',
                    borderRadius: '99px',
                    background: i === currentStepIndex ? 'var(--accent)' : 'var(--border)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: FH, fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{ padding: '10px 20px', borderRadius: '10px', background: 'var(--text)', color: 'var(--bg)', border: 'none', fontFamily: FH, fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
