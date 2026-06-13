import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackCertSelected } from '../lib/analytics.js'

// ─────────────────────────────────────────────────────────
// useJourneyStore — single source of truth for:
//   • slider values  (salary, certCost, hikePercent)
//   • selected cert  (selectedCert, certName)
//   • journey state  (mode, modeLocked, activeTab)
//   • resume context (prefilledCert, resumeCity, resumeDomain, resumeName)
//
// Persisted slices: salary, certCost, hikePercent, mode
// Transient slices: selectedCert, certName, activeTab, resume context
// ─────────────────────────────────────────────────────────

export const useJourneyStore = create(
  persist(
    (set, get) => ({
      // ── Slider values (persisted) ──────────────────────
      salary:      12,
      certCost:    0.25,
      hikePercent: 30,
      expectedFirstSalary: 4.8,

      setSalary:      (v) => set({ salary: v }),
      setCertCost:    (v) => set({ certCost: v }),
      setHikePercent: (v) => set({ hikePercent: v }),
      setExpectedFirstSalary: (v) => set({ expectedFirstSalary: v }),

      // ── Bookmarks / Saved Certs (persisted) ───────────
      savedCerts: [],
      toggleSavedCert: (certSlug) => set((state) => {
        const isSaved = state.savedCerts.includes(certSlug);
        return {
          savedCerts: isSaved 
            ? state.savedCerts.filter(id => id !== certSlug)
            : [...state.savedCerts, certSlug]
        };
      }),

      // ── Compare Mode (transient) ──────────────────────
      compareMode: false,
      compareCertA: null,
      setCompareMode: (certData) => set({ compareMode: true, compareCertA: certData }),
      clearCompareMode: () => set({ compareMode: false, compareCertA: null }),

      // ── Selected cert ──────────────────────────────────
      selectedCert: null,
      certName:     '',

      setSelectedCert: (cert) => {
        if (!cert) return
        const nativeCostInr = cert.cost_inr || cert.avg_cost || cert.avgCost;
        const nativeHike = cert.median_roi_percent || cert.avg_hike || cert.avgHike;
        
        // Auto-sync certCost + hikePercent from cert data
        set({
          selectedCert: cert,
          certName:     cert.name || cert.cert_name,
          certCost:     nativeCostInr ? nativeCostInr / 100000 : get().certCost,
          hikePercent:  nativeHike ?? get().hikePercent,
        })
        try { trackCertSelected({ certId: cert.id, certName: cert.name || cert.cert_name }) } catch (_) {}
      },

      clearCert: () => set({ selectedCert: null, certName: '' }),

      // ── Journey / nav state (transient) ───────────────
      activeTab:  'resume',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ── Mode (persisted) ──────────────────────────────
      mode:       'professional',
      modeLocked: false,

      setMode: (id) => set({ mode: id, modeLocked: true }),
      resetMode: () => set({ modeLocked: false }),

      // ── Resume AI context (transient) ─────────────────
      prefilledCert: '',
      resumeCity:    '',
      resumeDomain:  '',
      resumeName:    '',

      // ── Pivot domain intent (persisted across nav) ─────
      targetDomain: '',
      setTargetDomain: (v) => set({ targetDomain: v || '' }),

      // Journey intent: "Level_Up" | "Domain_Pivot" | "Breaking_In"
      journeyIntent: '',
      setJourneyIntent: (v) => set({ journeyIntent: v || '' }),

      // ── Pipeline & Roadmap State (persisted) ───────────
      
      // What the user wants to become (e.g., "Senior Backend Engineer")
      targetRole: "",
      setTargetRole: (role) => set({ targetRole: role || '' }),

      // The missing skills between their resume and their target
      validatedGap: [], 
      setValidatedGap: (gaps) => set({ validatedGap: gaps || [] }),

      // Track the skills checked off on the React Flow canvas
      // Format: { "backend": ["skill_id_1", "skill_id_2"], "frontend": ["skill_id_3"] }
      activeRoadmapProgress: {},
      
      toggleSkillCompletion: (roadmapId, skillId) => set((state) => {
        const currentProgress = state.activeRoadmapProgress[roadmapId] || [];
        const isCompleted = currentProgress.includes(skillId);
        
        const updatedProgress = isCompleted
          ? currentProgress.filter(id => id !== skillId)
          : [...currentProgress, skillId];

        return {
          activeRoadmapProgress: {
            ...state.activeRoadmapProgress,
            [roadmapId]: updatedProgress
          }
        };
      }),

      setResumeContext: ({ certName, city, domain, name }) => {
        set({
          prefilledCert: certName || '',
          resumeCity:    city    || '',
          resumeDomain:  domain  || '',
          resumeName:    name    || '',
        })
      },

      clearResumeContext: () => set({
        prefilledCert: '',
        resumeCity:    '',
        resumeDomain:  '',
        resumeName:    '',
      }),
    }),
    {
      name: 'certify-roi-journey',        // localStorage key
      partialize: (state) => ({           // only persist these slices
        salary:      state.salary,
        certCost:    state.certCost,
        hikePercent: state.hikePercent,
        expectedFirstSalary: state.expectedFirstSalary,
        mode:        state.mode,
        targetDomain: state.targetDomain,
        targetRole: state.targetRole,
        activeRoadmapProgress: state.activeRoadmapProgress,
        certName: state.certName,
        selectedCert: state.selectedCert,
        savedCerts: state.savedCerts,
      }),
    }
  )
)
