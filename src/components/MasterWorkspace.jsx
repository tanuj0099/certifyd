'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '../store/useJourneyStore.js';
import ModeSelector, { ModePill } from './ModeSelector.jsx';
import ResumeAnalyzer from './ResumeAnalyzer.jsx';
import Hero from './Hero.jsx';
import Heatmap from './Heatmap.jsx';
import CertCompare from './CertCompare.jsx';
import { useIsMobile } from './SharedUI.jsx';
import { FileText, TrendingUp, Map, ArrowRight, Check } from 'lucide-react';

const T = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };
const FM = "var(--font-mono)";
const FH = "var(--font-head)";
const FB = "var(--font-body)";

const STEP_TABS = [
  {
    id: "resume",
    num: "1",
    label: "Find Cert",
    icon: FileText,
    desc: "AI picks from resume",
  },
  {
    id: "calculator",
    num: "2",
    label: "Calculate ROI",
    icon: TrendingUp,
    desc: "Break-even and 5yr gain",
  },
  {
    id: "heatmap",
    num: "3",
    label: "City Demand",
    icon: Map,
    desc: "Is it hot in your city?",
  },
];

const DataFreshnessBadge = function () {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "8px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "var(--accent)",
        }}
      />
      <span
        className="mono-tag"
        style={{
          fontFamily: FM,
          fontSize: "10px",
          color: "var(--text-3)",
          letterSpacing: "0.06em",
          opacity: 1,
        }}
      >
        Data: Q1 2026  LinkedIn India  NASSCOM  Naukri  AmbitionBox
      </span>
    </div>
  );
};

const AppPage = function ({ onCertSelected }) {
  //  Read all journey state from store (no more prop drilling) 
  const activeTab = useJourneyStore((s) => s.activeTab);
  const onTabChange = useJourneyStore((s) => s.setActiveTab);
  const mode = useJourneyStore((s) => s.mode);
  const modeLocked = useJourneyStore((s) => s.modeLocked);
  const onModeSelect = useJourneyStore((s) => s.setMode);
  const onModeReset = useJourneyStore((s) => s.resetMode);
  const prefilledCert = useJourneyStore((s) => s.prefilledCert);
  const resumeCity = useJourneyStore((s) => s.resumeCity);
  const resumeDomain = useJourneyStore((s) => s.resumeDomain);
  const resumeName = useJourneyStore((s) => s.resumeName);
  const currentStepNum = STEP_TABS.findIndex((t) => t.id === activeTab);
  const isMobile = useIsMobile();

  const setResumeContext = useJourneyStore((s) => s.setResumeContext);

  // Wrap in a separate component or just use it if the parent provides Suspense
  // Next.js requires useSearchParams to be wrapped in Suspense
  const searchParams = useSearchParams();
  const certQuery = searchParams?.get('cert');

  useEffect(() => {
    if (certQuery && certQuery !== prefilledCert) {
      setResumeContext({ certName: certQuery });
      onTabChange("calculator");
    }
  }, [certQuery, prefilledCert, setResumeContext, onTabChange]);

  return (
    <div
      className="page-top-pad"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >

      <AnimatePresence>
        {!modeLocked ? <ModeSelector onSelect={onModeSelect} /> : null}
      </AnimatePresence>

      {modeLocked ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 64px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between' }}>
                <ModePill mode={mode} onReset={onModeReset} />
                {!isMobile && <DataFreshnessBadge />}
              </div>

                {/* Modern Flow Header */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  {/* Primary Tools (The Flow of 3) */}
                  {currentStepNum !== -1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: isMobile ? "stretch" : "center",
                        justifyContent: "center",
                        gap: isMobile ? "12px" : "16px",
                        flexDirection: isMobile ? "column" : "row",
                        marginBottom: "32px",
                      }}
                    >
                      {STEP_TABS.map((tab, i) => {
                        const active = activeTab === tab.id;
                        const isCompleted = currentStepNum > i;
                        return (
                          <div
                            key={tab.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: isMobile ? "0" : "16px",
                              flexDirection: isMobile ? "column" : "row",
                            }}
                          >
                            {i > 0 && !isMobile && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  opacity: isCompleted || active ? 1 : 0.5,
                                }}
                              >
                                <div
                                  style={{
                                    width: "6px",
                                    height: "1px",
                                    background: "var(--text)",
                                  }}
                                />
                                <ArrowRight size={14} color="var(--text)" />
                                <div
                                  style={{
                                    width: "6px",
                                    height: "1px",
                                    background: "var(--text)",
                                  }}
                                />
                              </div>
                            )}
                            <button
                              onClick={() => onTabChange(tab.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 20px",
                                borderRadius: "100px",
                                border: active
                                  ? "1px solid var(--border-accent)"
                                  : "1px solid var(--border)",
                                background: "transparent",
                                color: active
                                  ? "var(--accent)"
                                  : isCompleted
                                    ? "var(--text-3)"
                                    : "var(--text-4)",
                                cursor: "pointer",
                                fontFamily: FH,
                                transition: "all 0.3s ease",
                                boxShadow: active
                                  ? "none"
                                  : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  background: active
                                    ? "var(--accent)"
                                    : "transparent",
                                  border: active ? "none" : "1px solid var(--border)",
                                  color:
                                    active
                                      ? "var(--bg)"
                                      : isCompleted
                                        ? "var(--text-2)"
                                        : "var(--text-4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  fontFamily: FM,
                                  fontWeight: "700",
                                }}
                              >
                                {isCompleted ? <Check size={14} strokeWidth={3} /> : tab.num}
                              </div>
                              <tab.icon size={16} />
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: active ? "700" : "600",
                                  fontVariantNumeric: "tabular-nums",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {tab.label}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={T}
                  >
                    {/* Tab routes handled sequentially below */}                    {activeTab === "resume" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <ResumeAnalyzer
                          mode={mode}
                          onCertSelected={function (
                            certName,
                            city,
                            domain,
                            name,
                          ) {
                            if (onCertSelected) {
                              onCertSelected(certName, city, domain, name);
                            } else {
                              const store = useJourneyStore.getState();
                              store.setResumeContext({ certName, city, domain, name });
                              
                              store.clearCert();
                              useJourneyStore.setState({ certName: certName });
                              
                              store.setActiveTab("calculator");
                            }
                          }}
                        />
                      </div>
                    ) : null}

                    {activeTab === "calculator" ? (
                      <div>
                        <Hero
                          mode={mode}
                          prefilledCert={prefilledCert}
                          resumeName={resumeName}
                          resumeCity={resumeCity}
                          resumeDomain={resumeDomain}
                        />
                        {/* Step 2  Step 3 */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                          style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <motion.button
                            onClick={function () {
                              onTabChange("heatmap");
                            }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "9px",
                              padding: "13px 24px",
                              borderRadius: "12px",
                              background: "var(--accent)",
                              border: "1px solid var(--accent)",
                              color: "var(--bg)",
                              fontSize: "14px",
                              fontFamily: FH,
                              fontWeight: "700",
                              cursor: "pointer",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            <Map size={15} />
                            Next: See City Demand
                            <ArrowRight size={15} />
                          </motion.button>
                        </motion.div>
                      </div>
                    ) : null}

                    {activeTab === "heatmap" ? (
                      <div>
                        <div
                          style={{
                            padding: "clamp(16px,3vw,28px)",
                            background: "transparent",
                            border: "none"
                          }}
                        >
                          <Heatmap
                            prefilledCity={resumeCity}
                            prefilledDomain={resumeDomain}
                            certName={prefilledCert}
                            resumeName={resumeName}
                          />
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          style={{ marginTop: "20px" }}
                        >
                          <motion.button
                            onClick={function () {
                              onTabChange("calculator");
                            }}
                            whileHover={{ x: -4 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              padding: "11px 18px",
                              borderRadius: "10px",
                              background: "transparent",
                              border: "1px solid var(--border)",
                              color: "var(--text-4)",
                              fontSize: "13px",
                              fontFamily: FH,
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                             Back to ROI Calculator
                          </motion.button>
                        </motion.div>
                      </div>
                    ) : null}

                    {activeTab === "compare" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <CertCompare
                          salary={mode === "student" ? 4.8 : 8}
                          prefilledCert={prefilledCert}
                        />
                      </div>
                    ) : null}

                    {activeTab === "simulate" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <CareerSimulator
                          initialSalary={mode === "student" ? 4.8 : 8}
                        />
                      </div>
                    ) : null}

                    {activeTab === "jobmap" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <JobCertMap />
                      </div>
                    ) : null}

                    {activeTab === "college" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <CollegeVsCorporate />
                      </div>
                    ) : null}

                    {activeTab === "hikeverifier" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <HikeVerifier prefilledCert={prefilledCert} />
                      </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

              {/* Subtle section divider */}
              <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AppPage;
