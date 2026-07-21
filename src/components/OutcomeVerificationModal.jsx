import React, { useState } from 'react'
import { recordOutcome } from '../lib/analytics/logOutcome.js'
import { CheckCircle2, Award, TrendingUp, ShieldCheck, X } from 'lucide-react'

const CONTRIBUTING_OPTIONS = [
  { id: 'certification', label: 'This certification' },
  { id: 'tenure', label: 'Years of experience / tenure' },
  { id: 'performance_review', label: 'Performance review cycle' },
  { id: 'team_change', label: 'Change in manager/team' },
  { id: 'job_change', label: 'Job change (new company)' },
  { id: 'market_conditions', label: 'Market conditions improved' },
  { id: 'referral', label: 'Referral / network' },
]

export default function OutcomeVerificationModal({ isOpen, onClose, certName = 'AWS Solutions Architect', defaultHike = 25, predictionId = null }) {
  const [completedCert, setCompletedCert] = useState(true)
  const [actualHike, setActualHike] = useState(defaultHike)
  const [timelineMonths, setTimelineMonths] = useState(6)
  const [selectedFactors, setSelectedFactors] = useState(['certification'])
  const [otherText, setOtherText] = useState('')
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleFactorToggle = (id) => {
    setSelectedFactors((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleOtherToggle = () => {
    setShowOtherInput((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const finalFactors = [...selectedFactors]
      if (showOtherInput && otherText.trim()) {
        finalFactors.push(`other: ${otherText.trim()}`)
      }

      await recordOutcome({
        predictionId,
        entityType: 'certification_roi',
        actualOutcome: {
          completed_cert: completedCert,
          cert_name: certName,
          actual_salary_hike_pct: Number(actualHike),
          actual_timeline_months: Number(timelineMonths),
        },
        contributingFactors: finalFactors,
        monthsSinceCert: Number(timelineMonths),
        verificationMethod: 'self_reported',
        confidenceWeight: 0.85,
      })
      setSubmitted(true)
      setTimeout(() => {
        onClose && onClose()
      }, 1600)
    } catch (err) {
      console.error('Failed to submit outcome:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0F1218] border border-white/10 rounded-2xl p-6 shadow-2xl text-white font-sans max-h-[90vh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto animate-bounce" />
            <h3 className="text-lg font-bold">Ground Truth Captured!</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Thank you! Your verified outcome and honest attribution factors help calibrate real-world accuracy across India.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-[#F97316] text-xs font-mono uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Layer 3 Ground Truth Loop</span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                Help calibrate our ROI accuracy
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Did you complete <strong className="text-white">{certName}</strong> and receive a salary revision?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Did you finish this certification?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCompletedCert(true)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${
                      completedCert
                        ? 'bg-[#F97316]/20 border-[#F97316] text-white'
                        : 'bg-[#161B22] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    Yes, Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletedCert(false)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${
                      !completedCert
                        ? 'bg-[#F97316]/20 border-[#F97316] text-white'
                        : 'bg-[#161B22] border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    In Progress / Skipped
                  </button>
                </div>
              </div>

              {completedCert && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Actual Salary Hike / Revision Received (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={actualHike}
                        onChange={(e) => setActualHike(e.target.value)}
                        className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F97316]"
                        required
                        min="0"
                        max="300"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-mono">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Time to Offer / Appraisal (Months)
                    </label>
                    <input
                      type="number"
                      value={timelineMonths}
                      onChange={(e) => setTimelineMonths(e.target.value)}
                      className="w-full bg-[#161B22] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F97316]"
                      required
                      min="1"
                      max="36"
                    />
                  </div>

                  <div className="bg-[#161B22]/80 border border-white/10 rounded-xl p-3.5 space-y-2.5">
                    <label className="block text-xs font-semibold text-gray-200">
                      What contributed to this outcome? (select all that apply)
                    </label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {CONTRIBUTING_OPTIONS.map((opt) => {
                        const checked = selectedFactors.includes(opt.id)
                        return (
                          <label
                            key={opt.id}
                            className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white select-none py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleFactorToggle(opt.id)}
                              className="rounded border-white/20 bg-black/40 text-[#F97316] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span>{opt.label}</span>
                          </label>
                        )
                      })}
                      <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white select-none py-0.5">
                        <input
                          type="checkbox"
                          checked={showOtherInput}
                          onChange={handleOtherToggle}
                          className="rounded border-white/20 bg-black/40 text-[#F97316] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span>Other</span>
                      </label>
                      {showOtherInput && (
                        <input
                          type="text"
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value)}
                          placeholder="Please specify other factor..."
                          className="w-full mt-1.5 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F97316]"
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-bold text-sm shadow-lg shadow-[#F97316]/20 hover:brightness-110 transition disabled:opacity-50"
            >
              {submitting ? 'Recording Outcome...' : 'Submit Verified Outcome'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

