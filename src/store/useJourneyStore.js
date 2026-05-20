import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

      // ── Selected cert ──────────────────────────────────
      selectedCert: null,
      certName:     '',

      setSelectedCert: (cert) => {
        if (!cert) return
        // Auto-sync certCost + hikePercent from cert data
        set({
          selectedCert: cert,
          certName:     cert.name,
          certCost:     cert.examCostL ?? (cert.avgCost ? cert.avgCost / 100000 : get().certCost),
          hikePercent:  cert.avgHike   ?? get().hikePercent,
        })
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
      }),
    }
  )
)
