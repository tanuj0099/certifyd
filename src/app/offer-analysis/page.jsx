'use client';

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, Sparkles, AlertTriangle,
  ArrowRight, RefreshCw, TrendingUp, CheckCircle,
  AlertCircle, ExternalLink, Briefcase, FileSignature, Check
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase.js'
import { useAuth } from '@/hooks/useAuth.jsx'
import { AppSection, useThemeContext } from '@/components/SharedUI.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import { parseOfferLetter } from '@/services/hrAiService.jsx'
import { scanAndScrubPII } from '@/utils/piiScanner.js'

const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const T = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

const PICTON = 'var(--linear-blue)'
const ORANGE = 'var(--linear-blue)'

const STEP_TABS = [
  { id: 1, num: '1', label: 'Establish Baseline', icon: FileText, desc: 'Upload resume for context' },
  { id: 2, num: '2', label: 'Analyze Offer Letter', icon: Briefcase, desc: 'AI benchmarks your CTC' },
]

function calculatePercentile(userSalary, marketMedian) {
  if (!marketMedian || marketMedian === 0) return 45;
  const ratio = userSalary / marketMedian;
  let p = 50;
  if (ratio < 1) {
    p = 50 - ((1 - ratio) * 100);
  } else {
    p = 50 + ((ratio - 1) * 116.6);
  }
  return Math.min(Math.max(Math.round(p), 1), 99);
}

function getOrdinalNum(n) {
  const s = ["th", "st", "nd", "rd"],
        v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function OfferAnalysisPage() {
  const { user } = useAuth()
  const C = useThemeContext()

  const [step, setStep] = useState(1)

  // Step 1: Resume State
  const resumeFileInputRef = useRef(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [resumeDragging, setResumeDragging] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)

  // Step 2: Offer State
  const offerFileInputRef = useRef(null)
  const [offerText, setOfferText] = useState('')
  const [offerFileName, setOfferFileName] = useState('')
  const [offerDragging, setOfferDragging] = useState(false)
  const [offerPdfLoading, setOfferPdfLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [marketMedian, setMarketMedian] = useState(0)
  const [tierMatched, setTierMatched] = useState(true)
  const [error, setError] = useState('')
  const [resumeConsentGiven, setResumeConsentGiven] = useState(false)
  const [offerConsentGiven, setOfferConsentGiven] = useState(false)

  const hasResult = !!result

  // Generic File Reader
  const readFile = async (file, setFileName, setText, setPdfLoadState, setErrorState) => {
    if (!file) return
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    const isDocx = file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    setErrorState('')

    if (isPdf) {
      setFileName(file.name); setText(''); setPdfLoadState(true);
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/parse-offer', {
          method: 'POST',
          body: formData
        })
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Server rejected file')
        }
        const data = await response.json()
        const extracted = data.text

        if (!extracted || !extracted.trim()) {
          setFileName('')
          setErrorState('Could not extract text from this PDF. Please paste your text below.')
          return
        }
        setText(extracted)
      } catch (e) {
        setFileName('')
        setErrorState(e.message || 'PDF parsing failed. Please paste your text below.')
      } finally {
        setPdfLoadState(false)
      }
      return
    }

    if (isDocx) {
      setFileName(file.name); setText(''); setPdfLoadState(true);
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const mammoth = await import('mammoth');
          const result = await (mammoth.default || mammoth).extractRawText({ arrayBuffer: arrayBuffer });
          const extracted = result.value || '';
          
          if (!extracted || !extracted.trim()) {
            setFileName('')
            setErrorState('Could not extract text from this DOCX. Please paste your text below.')
            setPdfLoadState(false)
            return
          }
          setText(extracted)
          setPdfLoadState(false)
        } catch (err) {
          setFileName('')
          setErrorState('Failed to parse DOCX file. Please paste text instead.')
          setPdfLoadState(false)
        }
      }
      reader.onerror = () => { setErrorState('Could not read file.'); setFileName(''); setPdfLoadState(false) }
      reader.readAsArrayBuffer(file)
      return
    }

    // For txt
    setFileName(file.name); setText('');
    const reader = new FileReader()
    reader.onload = (e) => { setText(e.target.result || '') }
    reader.onerror = () => { setErrorState('Could not read file. Try pasting text instead.'); setFileName('') }
    reader.readAsText(file)
  }

  const handleResumeDrop = (e) => { e.preventDefault(); setResumeDragging(false); readFile(e.dataTransfer.files[0], setResumeFileName, setResumeText, setResumeLoading, setError) }
  const handleOfferDrop = (e) => { e.preventDefault(); setOfferDragging(false); readFile(e.dataTransfer.files[0], setOfferFileName, setOfferText, setOfferPdfLoading, setError) }

  const clearAll = () => {
    setStep(1)
    setResumeText(''); setResumeFileName('');
    setOfferText(''); setOfferFileName('');
    setResult(null); setError(''); setMarketMedian(0); setTierMatched(true);
  }

  const fetchMedianFromDB = async (city, targetTitle, companyTier) => {
    if (!supabase || !city || !targetTitle) return { median: 0, tierMatched: false };

    const K_ANONYMITY_THRESHOLD = 5;

    const calcMedian = (data) => {
      if (!data || data.length === 0) return 0;
      const ctcs = data.map(d => Number(d.offered_ctc)).filter(c => c > 0).sort((a, b) => a - b);
      if (ctcs.length === 0) return 0;
      const mid = Math.floor(ctcs.length / 2);
      return ctcs.length % 2 !== 0 ? ctcs[mid] : (ctcs[mid - 1] + ctcs[mid]) / 2;
    };

    try {
      // Attempt 1: Exact match on City, Title, and Tier
      let exactQuery = supabase
        .from('offer_analyses')
        .select('offered_ctc')
        .ilike('city', `%${city}%`)
        .ilike('target_job_title', `%${targetTitle}%`);

      if (companyTier && companyTier !== 'Unknown') {
        exactQuery = exactQuery.eq('raw_json->Analysis_Metadata->>Company_Tier', companyTier);
      }

      const { data: exactData, error: exactError } = await exactQuery;

      if (!exactError && exactData && exactData.length >= K_ANONYMITY_THRESHOLD) {
        return { median: calcMedian(exactData), tierMatched: true };
      }

      // Attempt 2: Fallback to just Title (National Median)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('offer_analyses')
        .select('offered_ctc')
        .ilike('target_job_title', `%${targetTitle}%`);

      if (!fallbackError && fallbackData && fallbackData.length >= K_ANONYMITY_THRESHOLD) {
        return { median: calcMedian(fallbackData), tierMatched: false };
      }

      return { median: 0, tierMatched: false };
    } catch (e) {
      console.warn("Failed to fetch median:", e);
      return { median: 0, tierMatched: false };
    }
  }

  const handleAnalyze = async () => {
    if (!offerConsentGiven || !resumeConsentGiven) {
      setError('Please agree to the Terms and Privacy Policy for both files.')
      return
    }
    let effectiveOfferText = offerText;
    let effectiveResumeText = resumeText;
    if ((!effectiveOfferText || effectiveOfferText.trim().length < 15) && effectiveResumeText && effectiveResumeText.trim().length >= 15) {
      effectiveOfferText = effectiveResumeText;
    }
    if (!effectiveOfferText || effectiveOfferText.trim().length < 15) {
      setError('Please paste or upload at least 15 characters of offer text.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const analysis = await parseOfferLetter(effectiveOfferText, effectiveResumeText)

      if (analysis.error || analysis.is_valid_offer === false) {
        setError(analysis.message || analysis.rejection_reason || 'Could not analyze document. Please ensure the text is a valid offer letter.')
        setLoading(false)
        return
      }

      // Geogatekeeper
      if (analysis.Analysis_Metadata?.Unsupported_Region) {
        setError(analysis.Analysis_Metadata.Mismatch_Warning_Message || 'Unsupported region.')
        setLoading(false)
        return
      }

      const location = analysis.Analysis_Metadata?.Target_Location || 'India'
      const title = analysis.Analysis_Metadata?.Target_Job_Title || ''
      const tier = analysis.Analysis_Metadata?.Company_Tier || 'Unknown'
      const ctcStated = analysis.CTC_Breakdown?.Total_CTC_Stated || 0

      // Fetch dynamic median
      const medianResult = await fetchMedianFromDB(location, title, tier)
      setMarketMedian(medianResult.median)
      setTierMatched(medianResult.tierMatched)

      setResult(analysis)

      // Save to Supabase (Data Flywheel)
      if (supabase && ctcStated > 0) {
        
        // Defense in Depth Layer 3: PII Scrubber
        const scrubbedAnalysis = scanAndScrubPII(analysis);
        const scrubbedPayload = scanAndScrubPII(analysis.Database_Payload);
        
        supabase.from('offer_analyses').insert({
          user_id: user?.uid || null,
          city: location,
          target_job_title: title,
          offered_ctc: ctcStated,
          market_median: medianResult.median,
          raw_json: scrubbedAnalysis,
          blunt_assessment: scrubbedAnalysis.Strategic_Negotiation_Output?.Blunt_Assessment || null,
          red_flags: scrubbedAnalysis.Strategic_Negotiation_Output?.Red_Flags || null,
          strengths: scrubbedAnalysis.Strategic_Negotiation_Output?.Strengths || null
        }).then(({ error: insertErr }) => {
          if (insertErr) console.warn('Failed to save analysis:', insertErr.message)
        })

        if (scrubbedPayload) {
          supabase.from('offer_letters').insert({
            user_id: user?.id || user?.uid || null,
            fixed_base: scrubbedPayload.fixed_base,
            variable_pay: scrubbedPayload.variable_pay,
            hra: scrubbedPayload.hra,
            special_allowance: scrubbedPayload.special_allowance,
            pf: scrubbedPayload.pf,
            company_tier: scrubbedPayload.company_tier,
            role: scrubbedPayload.role,
            experience_years: scrubbedPayload.experience_years,
            company_name: scrubbedPayload.company_name,
            work_model: scrubbedPayload.work_model,
            bond_or_clawback_detected: scrubbedPayload.bond_or_clawback_detected,
            employer_pf_included: scrubbedPayload.employer_pf_included,
            gratuity_included: scrubbedPayload.gratuity_included,
            joining_bonus: scrubbedPayload.joining_bonus,
            allowances_and_perks: scrubbedPayload.allowances_and_perks
          }).then(({ error: insertErr }) => {
            if (insertErr) console.warn('Failed to save structured offer letter to DB:', insertErr.message)
          })
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderUploadZone = (
    title, dragging, setDragging, hasFile, fileName, loadingState, handleDrop, inputRef, readFileFn,
    textValue, setTextValue, isResume
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <AnimatePresence>
        {!hasFile && !textValue.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass" style={{
              borderRadius: '11px',
              border: '1.5px dashed ' + (dragging ? PICTON : 'var(--border)'),
              background: dragging ? PICTON + '08' : 'transparent',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => { if (!hasFile) inputRef.current?.click() }}
                style={{ padding: '32px 22px', cursor: 'pointer', textAlign: 'center' }}
              >
                <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={e => readFileFn(e.target.files[0])} />

                {loadingState ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid ' + PICTON, borderTopColor: 'transparent' }}
                    />
                    <span style={{ fontSize: '13px', color: PICTON, fontFamily: FH, fontWeight: '600' }}>Reading PDF...</span>
                  </div>
                ) : (
                  <>
                    {isResume ? <FileText size={24} color="var(--text-4)" style={{ margin: '0 auto 12px', display: 'block' }} /> : <FileSignature size={24} color="var(--text-4)" style={{ margin: '0 auto 12px', display: 'block' }} />}
                    <div style={{ fontSize: '15px', color: 'var(--text-2)', fontFamily: FH, fontWeight: '700', marginBottom: '6px' }}>
                      {title} or <span style={{ color: PICTON, textDecoration: 'underline' }}>browse</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-4)', fontFamily: FB }}>We use an AI scanner. No data is stored or shared.</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Or divider */}
      {!hasFile && !textValue.trim() && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FM }}>or paste text below</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
      )}

      {/* Textarea or File View */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden', position: 'relative' }}
        >
          {hasFile ? (
            <div style={{ padding: '16px', borderRadius: '11px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color={ORANGE} />
                <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '600', fontFamily: FH }}>{fileName}</span>
              </div>
              <button onClick={() => { isResume ? setResumeFileName('') : setOfferFileName(''); setTextValue('') }} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <textarea
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                placeholder={isResume ? "Paste your resume text here..." : "Paste your offer letter text here..."}
                rows={8}
                style={{
                  width: '100%', padding: '14px', borderRadius: '11px',
                  background: 'var(--bg)', border: '1px solid ' + (textValue.trim() ? PICTON + '44' : 'var(--border)'),
                  color: 'var(--text)', fontSize: '13px', fontFamily: FB, lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.18s',
                }}
              />
              {textValue.trim() && (
                <button onClick={() => setTextValue('')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )

  return (
    <ToolPageWrapper
      title="Offer Letter"
      subtitle="Analysis"
      description="Upload your job offer to instantly identify lowball tactics, expose hidden deductions, and generate a data-backed negotiation script."
      eyebrow="AI NEGOTIATOR"
      footer={false}
      showFeedback={false}
      hideHeader={false}
    >
      <div className="w-full mx-auto" style={{ margin: '0 -12px', width: 'calc(100% + 24px)' }}>

        {/* ROI-style Flow Stepper */}
        {!hasResult && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-8 md:mb-10 w-full px-2">
            {STEP_TABS.map((tab, i) => {
              const isActive = step === tab.id;
              const isCompleted = step > tab.id;
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="flex flex-col md:flex-row items-center gap-3 md:gap-6 w-full md:w-auto">
                  {i > 0 && (
                    <div className="hidden md:flex items-center gap-1" style={{ opacity: isCompleted || isActive ? 1 : 0.35 }}>
                      <div style={{ width: '6px', height: '1px', background: 'var(--text)' }} />
                      <ArrowRight size={14} color="var(--text)" />
                      <div style={{ width: '6px', height: '1px', background: 'var(--text)' }} />
                    </div>
                  )}
                  {i > 0 && (
                    <div className="flex md:hidden items-center" style={{ opacity: isCompleted || isActive ? 1 : 0.35 }}>
                      <div style={{ width: '1px', height: '12px', background: 'var(--text)' }} />
                    </div>
                  )}
                  <button
                    onClick={() => { if (isCompleted) { setStep(tab.id); setError('') } }}
                    className="w-full md:w-auto flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-full transition-all duration-300"
                    style={{
                      border: isActive ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                      background: 'transparent',
                      color: isActive ? 'var(--accent)' : isCompleted ? 'var(--text-3)' : 'var(--text-4)',
                      cursor: isCompleted ? 'pointer' : 'default',
                      fontFamily: FH,
                    }}
                  >
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isActive ? 'var(--accent)' : 'transparent',
                      border: isActive ? 'none' : '1px solid var(--border)',
                      color: isActive ? 'var(--bg)' : isCompleted ? 'var(--text-2)' : 'var(--text-4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontFamily: FM, fontWeight: '700', flexShrink: 0,
                    }}>
                      {isCompleted ? <Check size={13} strokeWidth={3} /> : tab.num}
                    </div>
                    <Icon size={16} />
                    <span style={{ fontSize: '14px', fontWeight: isActive ? '700' : '600', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      {tab.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: FB, fontSize: '13px', color: '#EF4444', lineHeight: '1.5' }}>{error}</span>
            </div>
          )}

          {/* STEP 1: RESUME */}
          {!hasResult && step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontFamily: FH, fontSize: '18px', color: 'var(--text)', margin: '0 0 4px 0' }}>Establish Baseline</h3>
                <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>Upload your resume to establish your current experience level, role, and location.</p>
              </div>

              {renderUploadZone(
                "Drop your Resume PDF", resumeDragging, setResumeDragging, !!resumeFileName, resumeFileName, resumeLoading, handleResumeDrop, resumeFileInputRef,
                (file) => readFile(file, setResumeFileName, setResumeText, setResumeLoading, setError),
                resumeText, setResumeText, true
              )}

              <div style={{ marginTop: '24px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="resumeDpdpConsent"
                  checked={resumeConsentGiven}
                  onChange={(e) => {
                    setResumeConsentGiven(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="resumeDpdpConsent" className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
                  I agree to the processing of my resume data in accordance with the <a href="/terms" className="text-[var(--accent)] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button
                onClick={() => { if ((resumeText.trim() || resumeFileName) && resumeConsentGiven) { setStep(2); setError('') } else if (!resumeConsentGiven) { setError('Please accept the Terms to continue.') } else { setError('Please provide your resume text or PDF to continue.') } }}
                style={{
                  marginTop: '16px', width: '100%', padding: '14px', borderRadius: '10px',
                  background: ((resumeText.trim() || resumeFileName) && resumeConsentGiven) ? 'var(--text)' : 'var(--bg-surface)',
                  color: ((resumeText.trim() || resumeFileName) && resumeConsentGiven) ? 'var(--bg)' : 'var(--text-4)',
                  fontSize: '14px', fontFamily: FH, fontWeight: '700', border: 'none',
                  cursor: ((resumeText.trim() || resumeFileName) && resumeConsentGiven) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
              >
                Continue to Offer Letter <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: OFFER LETTER */}
          {!hasResult && step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontFamily: FH, fontSize: '18px', color: 'var(--text)', margin: '0 0 4px 0' }}>Analyze Offer Letter</h3>
                  <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>Now upload the job offer you want to evaluate.</p>
                </div>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-3)', fontSize: '11px', fontFamily: FH, cursor: 'pointer' }}>Back to Resume</button>
              </div>

              {renderUploadZone(
                "Drop your Offer Letter PDF", offerDragging, setOfferDragging, !!offerFileName, offerFileName, offerPdfLoading, handleOfferDrop, offerFileInputRef,
                (file) => readFile(file, setOfferFileName, setOfferText, setOfferPdfLoading, setError),
                offerText, setOfferText, false
              )}

              <div style={{ marginTop: '24px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="offerDpdpConsent"
                  checked={offerConsentGiven}
                  onChange={(e) => {
                    setOfferConsentGiven(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  style={{ marginTop: '3px', cursor: 'pointer' }}
                />
                <label htmlFor="offerDpdpConsent" className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
                  I agree to the processing of my offer letter data in accordance with the <a href="/terms" className="text-[var(--accent)] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <motion.button
                onClick={handleAnalyze}
                disabled={loading || (!offerText.trim() && !offerFileName && !resumeText.trim()) || !offerConsentGiven}
                whileHover={(offerText.trim() || offerFileName || resumeText.trim()) && offerConsentGiven ? { scale: 1.01, y: -1 } : {}}
                whileTap={(offerText.trim() || offerFileName || resumeText.trim()) && offerConsentGiven ? { scale: 0.98 } : {}}
                style={{
                  marginTop: '16px', width: '100%', padding: '16px', borderRadius: '12px',
                  background: loading ? 'var(--bg-surface)' : ((offerText.trim() || offerFileName || resumeText.trim()) && offerConsentGiven) ? 'var(--accent)' : 'var(--bg-surface)',
                  border: loading ? '1px solid var(--border)' : ((offerText.trim() || offerFileName || resumeText.trim()) && offerConsentGiven) ? 'none' : '1px solid var(--border)',
                  color: loading ? 'var(--text-4)' : ((offerText.trim() || offerFileName || resumeText.trim()) && offerConsentGiven) ? 'var(--bg)' : 'var(--text-4)',
                  fontSize: '15px', fontFamily: FH, fontWeight: '800',
                  cursor: (loading || !offerConsentGiven) ? 'not-allowed' : (offerText.trim() || offerFileName || resumeText.trim()) ? 'pointer' : 'not-allowed',
                  boxShadow: (offerText.trim() || offerFileName || resumeText.trim()) ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--bg)' }} />
                    Running Deep Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generate Offer Intelligence
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={T}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* Warnings */}
                {result.Analysis_Metadata?.Profile_Mismatch_Flag && (
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', gap: '12px' }}>
                    <AlertTriangle color="#EF4444" size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: FH, fontSize: '14px', fontWeight: '700', color: '#EF4444', marginBottom: '4px' }}>Profile Mismatch Detected</div>
                      <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>{result.Analysis_Metadata.Mismatch_Warning_Message}</div>
                    </div>
                  </div>
                )}

                {/* Market Comparison Bento Grid */}
                <div className="w-full mt-4">
                  {(() => {
                    const calculatedFallback = (() => {
                      const expStr = result.Market_Context?.Calculated_Experience_Level_For_Offer || '0';
                      const expNum = parseInt(expStr.match(/\d+/) ? expStr.match(/\d+/)[0] : 0);
                      const titleLower = (result.Analysis_Metadata?.Target_Job_Title || '').toLowerCase();
                      if (titleLower.includes('architect') || titleLower.includes('principal') || titleLower.includes('staff') || titleLower.includes('director') || titleLower.includes('vp')) {
                        return 3500000 + (expNum * 300000);
                      } else if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('manager')) {
                        return 2000000 + (expNum * 250000);
                      } else if (titleLower.includes('sde ii') || titleLower.includes('sde 2')) {
                        return 1500000 + (expNum * 250000);
                      }
                      return 800000 + (expNum * 250000);
                    })();

                    const finalMedian = marketMedian > 0 ? marketMedian : calculatedFallback;
                    const ctcValue = result.CTC_Breakdown?.Total_CTC_Stated || 0;
                    const percentile = calculatePercentile(ctcValue, finalMedian);

                    let gaugeColor = 'bg-teal-500 dark:bg-teal-400';
                    let gaugeText = 'text-teal-600 dark:text-teal-400';

                    if (percentile < 40) {
                      gaugeColor = 'bg-red-600 dark:bg-red-500';
                      gaugeText = 'text-red-600 dark:text-red-500';
                    } else if (percentile <= 60) {
                      gaugeColor = 'bg-yellow-500';
                      gaugeText = 'text-yellow-600 dark:text-yellow-500';
                    }

                    const pieData = [
                      { name: 'Basic / Fixed Pay', value: result.CTC_Breakdown?.Basic_Salary || result.Database_Payload?.fixed_base || 0, color: '#059669' },
                      { name: 'HRA', value: result.CTC_Breakdown?.HRA || 0, color: 'var(--brand-primary)' },
                      { name: 'Other Allowances', value: result.CTC_Breakdown?.Other_Allowances || result.CTC_Breakdown?.Special_Allowance || 0, color: '#34d399' },
                      { name: 'Joining/Perf Bonus', value: result.CTC_Breakdown?.Joining_Bonus || 0, color: '#a7f3d0' },
                      { name: 'Variable/Bonus', value: result.CTC_Breakdown?.Variable_PLVP || 0, color: '#f59e0b' },
                      { name: 'Employer PF', value: result.CTC_Breakdown?.Employer_PF || 0, color: '#475569' },
                      { name: 'Gratuity', value: result.CTC_Breakdown?.Gratuity_Provision || 0, color: '#64748b' },
                      { name: 'ESOP/Stocks', value: result.CTC_Breakdown?.ESOP_Annual_Vesting_Value || 0, color: '#6366f1' }
                    ].filter(d => d.value > 0);

                    const glassStyle = {
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
                    };

                    const premiumCardClass = "w-full rounded-[2rem] p-6 md:p-8 transition-all duration-300 relative overflow-hidden group";

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

                        {/* ROW 1: Reality Check */}
                        <div className="md:col-span-3 flex flex-col md:flex-row gap-6 md:gap-8 w-full">
                          <div className={`${premiumCardClass} flex-1 text-center`}
                            style={glassStyle}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <div style={{ fontFamily: FM, color: C.text3 }} className="text-xs font-bold tracking-[0.1em] mb-4 uppercase">STATED CTC (INFLATED)</div>
                            <div className="font-sans tracking-tight tabular-nums text-4xl sm:text-5xl md:text-6xl font-black line-through decoration-red-500/80 decoration-[3px] md:decoration-[4px]"
                              style={{ color: C.text }}>
                              ₹{Math.round(ctcValue).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontFamily: FB, color: C.text3 }} className="text-sm font-medium mt-3">Per annum</div>
                          </div>

                          <div className={`${premiumCardClass} flex-1 text-center`}
                            style={glassStyle}>
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <div style={{ fontFamily: FM, color: C.text3 }} className="text-xs font-bold tracking-[0.1em] mb-4 uppercase">IN-HAND ESTIMATE</div>
                            <div className="font-sans tracking-tight tabular-nums text-5xl sm:text-6xl md:text-7xl font-black text-teal-500 dark:text-teal-400 drop-shadow-md">
                              ₹{Math.round(result.CTC_Breakdown?.Estimated_Monthly_In_Hand || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontFamily: FB, color: C.text3 }} className="text-sm font-medium mt-3">Per month approx</div>
                          </div>
                        </div>

                        {/* ROW 2 LEFT: AI Negotiation Hub */}
                        <div className={`md:col-span-2 ${premiumCardClass} flex flex-col justify-center`} style={glassStyle}>
                          <div style={{ fontFamily: FM, color: C.text3 }} className="text-xs font-bold tracking-[0.1em] mb-6 uppercase">AI Negotiator & Strategy</div>

                          {/* Negotiation Target */}
                          <div className="mb-8">
                            <div className="text-sm font-bold text-[var(--text-3)] mb-3 font-sans">TARGET COUNTER-OFFER RANGE</div>
                            <div className="text-orange-500 dark:text-orange-400 font-black text-4xl sm:text-5xl font-sans tracking-tight tabular-nums flex flex-col sm:flex-row sm:items-baseline sm:gap-3 drop-shadow-sm">
                              <span>₹{Math.round(Math.max(ctcValue * 1.15, finalMedian * 0.95)).toLocaleString('en-IN')}</span>
                              <span className="hidden sm:inline text-[var(--text-4)] font-normal text-3xl">-</span>
                              <span className="sm:hidden text-[var(--text-4)] text-sm font-medium my-1">to</span>
                              <span>₹{Math.round(Math.max(ctcValue * 1.25, finalMedian * 1.15)).toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {/* Negotiation Script */}
                          <div className="rounded-2xl border flex flex-col gap-5 p-5 md:p-6" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                            
                            {result.Strategic_Negotiation_Output?.Blunt_Assessment && (
                              <div>
                                <div className="text-xs uppercase tracking-[0.1em] text-[var(--text-4)] mb-2 font-bold">VERDICT</div>
                                <div className="text-lg sm:text-xl text-[var(--text)] font-sans font-bold leading-relaxed">
                                  {result.Strategic_Negotiation_Output.Blunt_Assessment}
                                </div>
                              </div>
                            )}

                            {(result.Strategic_Negotiation_Output?.Red_Flags?.length > 0) && (
                              <div>
                                <div className="text-xs uppercase tracking-[0.1em] text-red-500 dark:text-red-400 mb-2 font-bold flex items-center gap-2">
                                  <AlertTriangle size={14} /> RED FLAGS
                                </div>
                                <ul className="list-none m-0 p-0 flex flex-col gap-2">
                                  {result.Strategic_Negotiation_Output.Red_Flags.map((rf, idx) => (
                                    <li key={idx} className="text-sm md:text-base text-[var(--text-2)] font-sans leading-relaxed flex items-start gap-2.5">
                                      <span className="text-red-500 dark:text-red-400 mt-0.5 font-bold">•</span> {rf}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {(result.Strategic_Negotiation_Output?.Strengths?.length > 0) && (
                              <div>
                                <div className="text-xs uppercase tracking-[0.1em] text-orange-500 dark:text-orange-400 mb-2 font-bold flex items-center gap-2">
                                  <Check size={14} strokeWidth={3} /> STRENGTHS
                                </div>
                                <ul className="list-none m-0 p-0 flex flex-col gap-2">
                                  {result.Strategic_Negotiation_Output.Strengths.map((str, idx) => (
                                    <li key={idx} className="text-sm md:text-base text-[var(--text-2)] font-sans leading-relaxed flex items-start gap-2.5">
                                      <span className="text-orange-500 dark:text-orange-400 mt-0.5 font-bold">•</span> {str}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.Strategic_Negotiation_Output?.Counter_Offer_Email_Script ? (
                              <div className="mt-4 p-5 md:p-6 rounded-2xl relative group" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                                <div className="text-xs uppercase tracking-[0.1em] text-orange-500 dark:text-orange-400 mb-3 font-bold flex items-center gap-2">
                                  <Sparkles size={14} /> EMAIL SCRIPT
                                </div>
                                <div className="text-[15px] text-[var(--text)] font-sans leading-relaxed whitespace-pre-wrap font-medium">
                                  {result.Strategic_Negotiation_Output.Counter_Offer_Email_Script}
                                </div>
                                <button
                                  onClick={() => navigator.clipboard.writeText(result.Strategic_Negotiation_Output.Counter_Offer_Email_Script)}
                                  className="absolute top-4 right-4 p-2 bg-[var(--bg)] hover:bg-[var(--bg-surface)] text-[var(--text-2)] hover:text-[var(--text)] rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-[var(--border)] shadow-sm"
                                  title="Copy to clipboard"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-orange-400 mb-2 font-mono flex items-center gap-2">
                                  <Sparkles size={12} className="flex-shrink-0" /> Actionable Talking Point
                                </div>
                                <div className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed">
                                  {result.Market_Context?.Negotiation_Strategy || `Your current offer puts you at the ${percentile}th percentile for ${result.Analysis_Metadata?.Target_Location || 'your region'}. Leverage your relevant experience and core expertise to negotiate a 15-25% bump on the basic salary, or request that the performance variable pay be converted into guaranteed fixed components to align with the market.`}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ROW 2 RIGHT: Market Context (Median/Gauge) */}
                        {/* ROW 2 RIGHT: Market Context (Median/Gauge) */}
                        <div className={`md:col-span-1 ${premiumCardClass} flex flex-col justify-center`} style={glassStyle}>
                          <div style={{ fontFamily: FM, color: C.text3 }} className="text-xs font-bold tracking-[0.1em] mb-4 uppercase">Market Benchmark</div>
                          <div className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums block mb-3" style={{ color: C.text }}>
                            ₹{Math.round(finalMedian).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontFamily: FB, color: C.text2 }} className="text-sm font-medium mb-8 leading-relaxed">
                            Typical salary for {result.Analysis_Metadata?.Target_Job_Title || 'this role'} in {result.Analysis_Metadata?.Target_Location || 'India'}
                            {!tierMatched && marketMedian > 0 && <span className="text-amber-500 dark:text-amber-400 block mt-1.5 font-bold">Based on broader market data.</span>}
                            {marketMedian === 0 && <span className="text-blue-500 dark:text-blue-400 block mt-1.5 font-bold">AI-estimated benchmark.</span>}
                          </div>

                          <div className="flex justify-between text-xs sm:text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: C.text4, fontFamily: FM }}>
                            <span>Entry</span>
                            <span className={`${gaugeText} font-bold font-sans text-center px-3 py-1 rounded-full bg-slate-500/10`}>
                              {getOrdinalNum(percentile)} Percentile
                            </span>
                            <span>Top</span>
                          </div>
                          <div className="w-full h-3 rounded-full relative overflow-hidden" style={{ backgroundColor: C.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                            <div className={`absolute top-0 left-0 h-full ${gaugeColor}`} style={{ width: `${percentile}%`, transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }} />
                          </div>
                        </div>

                        {/* ROW 3 LEFT: Donut Chart */}
                        <div className={`md:col-span-2 ${premiumCardClass} flex flex-col justify-center items-center h-[320px] md:h-[400px]`} style={glassStyle}>
                          <div style={{ fontFamily: FM, color: C.text3 }} className="text-xs font-bold tracking-[0.1em] w-full mb-6 uppercase text-center md:text-left">Compensation Composition</div>
                          <div className="w-full h-full min-h-[200px] md:min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius="50%"
                                  outerRadius="80%"
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontFamily: FB }}
                                  itemStyle={{ color: '#fff', fontWeight: '600', fontFamily: 'sans-serif' }}
                                  formatter={(value) => `₹${Math.round(value).toLocaleString('en-IN')}`}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* ROW 3 RIGHT: Breakdowns (Numerical Item List) */}
                        <div className={`md:col-span-1 ${premiumCardClass} flex flex-col gap-2 md:gap-3 max-h-[320px] md:max-h-[400px] md:h-[400px] overflow-y-auto custom-scrollbar`} style={glassStyle}>
                          {pieData.map((d, i) => (
                            <BreakdownChip key={i} label={d.name} value={d.value} color={d.color} theme={C} />
                          ))}
                        </div>

                        {/* ROW 4: Intelligence Summary */}
                        <div className={`md:col-span-3 ${premiumCardClass}`} style={glassStyle}>
                          {result.Market_Context?.UI_Status_Message && (
                            <div className="flex items-start gap-3 md:gap-4 mb-5 md:mb-6">
                              <Sparkles className="text-teal-500 dark:text-teal-400 mt-1 flex-shrink-0" size={20} />
                              <div style={{ fontFamily: FB, color: C.text }} className="font-semibold text-[15px] md:text-base leading-relaxed">
                                {result.Market_Context.UI_Status_Message}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 md:gap-4 flex-wrap">
                            <div className="px-3 md:px-4 py-2 rounded-xl border text-sm font-bold font-mono tracking-wide break-words"
                              style={{ background: C.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)', borderColor: C.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', color: C.text2 }}>
                              ROLE <span className="font-black ml-2" style={{ color: C.text }}>{result.Analysis_Metadata?.Target_Job_Title || 'Unknown'}</span>
                            </div>
                            {result.Analysis_Metadata?.Company_Tier && result.Analysis_Metadata.Company_Tier !== 'Unknown' && (
                              <div className="px-3 md:px-4 py-2 rounded-xl border text-sm font-bold font-mono tracking-wide"
                                style={{ background: C.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)', borderColor: C.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', color: C.text2 }}>
                                TIER <span className="font-black ml-2" style={{ color: C.text }}>{result.Analysis_Metadata.Company_Tier.replace(/_/g, ' ')}</span>
                              </div>
                            )}
                            <div className="px-3 md:px-4 py-2 rounded-xl border text-sm font-bold font-mono tracking-wide"
                              style={{ background: C.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)', borderColor: C.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', color: C.text2 }}>
                                EXP <span className="font-black ml-2" style={{ color: C.text }}>{result.Market_Context?.Calculated_Experience_Level_For_Offer || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

                {/* Reset */}
                <motion.button
                  onClick={clearAll}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-4)', fontSize: '13px', fontFamily: FH, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.15s', marginTop: '10px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = PICTON + '33'; e.currentTarget.style.color = PICTON }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-4)' }}
                >
                  <RefreshCw size={14} /> Analyze Another Offer
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ToolPageWrapper>
  )
}

function BreakdownChip({ label, value, color, theme }) {
  if (!value || value === 0) return null;
  const chipBg = theme?.isLight ? '#f8fafc' : (theme?.surface || '#1e293b');
  const labelColor = theme?.isLight ? '#475569' : (theme?.text3 || '#94a3b8');
  const valueColor = theme?.isLight ? '#0f172a' : (theme?.text || '#f1f5f9');
  const borderColor = theme?.border || '#e2e8f0';
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ backgroundColor: chipBg, borderColor }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
      <span className="text-sm font-medium text-slate-600 font-bold tracking-wide uppercase line-clamp-1 flex-1" style={{ color: labelColor }}>{label}</span>
      <span className="text-sm font-bold font-mono tabular-nums" style={{ color: valueColor }}>₹{Math.round(Number(value)).toLocaleString('en-IN')}</span>
    </div>
  )
}