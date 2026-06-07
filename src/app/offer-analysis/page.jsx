'use client';

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, Sparkles, AlertTriangle,
  ArrowRight, RefreshCw, TrendingUp, CheckCircle,
  AlertCircle, ExternalLink, Briefcase, FileSignature
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase.js'
import { useAuth } from '@/hooks/useAuth.jsx'
import { AppSection } from '@/components/SharedUI.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import { parseOfferLetter } from '@/services/hrAiService.jsx'

const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const T = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

const PICTON = 'var(--linear-blue)'
const EMERALD = 'var(--linear-blue)'

const STEP_TABS = [
  { id: 1, label: '1. Establish Baseline (Resume)' },
  { id: 2, label: '2. Analyze Offer Letter' }
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

export default function OfferAnalysisPage() {
  const { user } = useAuth()
  
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

  const hasResult = !!result

  // Generic File Reader
  const readFile = async (file, setFileName, setText, setPdfLoadState, setErrorState) => {
    if (!file) return
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
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
    
    // For txt or doc
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
      
      if (!exactError && exactData && exactData.length > 0) {
        return { median: calcMedian(exactData), tierMatched: true };
      }

      // Attempt 2: Fallback to just Title (National Median)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('offer_analyses')
        .select('offered_ctc')
        .ilike('target_job_title', `%${targetTitle}%`);

      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        return { median: calcMedian(fallbackData), tierMatched: false };
      }

      return { median: 0, tierMatched: false };
    } catch (e) {
      console.warn("Failed to fetch median:", e);
      return { median: 0, tierMatched: false };
    }
  }

  const handleAnalyze = async () => {
    if (!offerText || offerText.trim().length < 50) {
      setError('Please paste or upload at least 50 characters of offer text.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const analysis = await parseOfferLetter(offerText, resumeText)

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
        supabase.from('offer_analyses').insert({
          user_id: user?.uid || null,
          city: location,
          target_job_title: title,
          offered_ctc: ctcStated,
          market_median: medianResult.median,
          raw_json: analysis
        }).then(({ error: insertErr }) => {
          if (insertErr) console.warn('Failed to save analysis:', insertErr.message)
        })
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
                <FileText size={16} color={EMERALD} />
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
      description="Compare your job offer against verified Indian market benchmarks using AI."
      footer={false}
      showFeedback={false}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stepper Capsules */}
        {!hasResult && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
            {STEP_TABS.map((tab) => {
              const isActive = step === tab.id;
              const isCompleted = step > tab.id;
              return (
                <div key={tab.id} style={{
                  padding: '8px 16px', borderRadius: '999px',
                  background: isActive ? 'var(--text)' : isCompleted ? 'var(--bg-surface)' : 'transparent',
                  border: isActive ? '1px solid var(--text)' : '1px solid var(--border)',
                  color: isActive ? 'var(--bg)' : 'var(--text-3)',
                  fontFamily: FH, fontSize: '12px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease', cursor: isCompleted ? 'pointer' : 'default'
                }} onClick={() => { if (isCompleted) setStep(tab.id) }}>
                  {isCompleted && <CheckCircle size={12} color="var(--accent)" />}
                  {tab.label}
                </div>
              )
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

              <button
                onClick={() => { if (resumeText.trim() || resumeFileName) { setStep(2); setError('') } else { setError('Please provide your resume text or PDF to continue.') } }}
                style={{
                  marginTop: '20px', width: '100%', padding: '14px', borderRadius: '10px',
                  background: (resumeText.trim() || resumeFileName) ? 'var(--text)' : 'var(--bg-surface)',
                  color: (resumeText.trim() || resumeFileName) ? 'var(--bg)' : 'var(--text-4)',
                  fontSize: '14px', fontFamily: FH, fontWeight: '700', border: 'none',
                  cursor: (resumeText.trim() || resumeFileName) ? 'pointer' : 'not-allowed',
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

              <motion.button
                onClick={handleAnalyze}
                disabled={loading || (!offerText.trim() && !offerFileName)}
                whileHover={(offerText.trim() || offerFileName) ? { scale: 1.01, y: -1 } : {}}
                whileTap={(offerText.trim() || offerFileName) ? { scale: 0.98 } : {}}
                style={{
                  marginTop: '20px', width: '100%', padding: '16px', borderRadius: '12px',
                  background: loading ? 'var(--bg-surface)' : (offerText.trim() || offerFileName) ? 'var(--accent)' : 'var(--bg-surface)',
                  border: loading ? '1px solid var(--border)' : (offerText.trim() || offerFileName) ? 'none' : '1px solid var(--border)',
                  color: loading ? 'var(--text-4)' : (offerText.trim() || offerFileName) ? '#fff' : 'var(--text-4)',
                  fontSize: '15px', fontFamily: FH, fontWeight: '800',
                  cursor: loading ? 'not-allowed' : (offerText.trim() || offerFileName) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '9px', letterSpacing: '-0.015em', transition: 'all 0.2s',
                  boxShadow: (offerText.trim() || offerFileName) ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
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
                <AppSection id="COMPARISON" title="CTC ANALYSIS & BENCHMARKS">
                  {(() => {
                    const ctcValue = result.CTC_Breakdown?.Total_CTC_Stated || 0;
                    const median = marketMedian || (ctcValue * 1.1);
                    const percentile = calculatePercentile(ctcValue, marketMedian > 0 ? marketMedian : median);

                    let gaugeColor = 'bg-teal-400';
                    let gaugeShadow = 'shadow-[0_0_12px_rgba(45,212,191,0.8)]';
                    let gaugeText = 'text-teal-400';

                    if (percentile < 40) {
                      gaugeColor = 'bg-red-500';
                      gaugeShadow = 'shadow-[0_0_12px_rgba(239,68,68,0.8)]';
                      gaugeText = 'text-red-500';
                    } else if (percentile <= 60) {
                      gaugeColor = 'bg-yellow-500';
                      gaugeShadow = 'shadow-[0_0_12px_rgba(234,179,8,0.8)]';
                      gaugeText = 'text-yellow-500';
                    }
                    
                    const pieData = [
                      { name: 'Fixed Base', value: result.CTC_Breakdown?.Fixed_Base_Annual || 0, color: '#10b981' },
                      { name: 'Variable/Bonus', value: result.CTC_Breakdown?.Variable_Bonus_Annual || 0, color: '#f59e0b' },
                      { name: 'Retirals & Hidden', value: result.CTC_Breakdown?.Retirals_And_Hidden_Annual || 0, color: '#64748b' },
                      { name: 'ESOP/Stocks', value: result.CTC_Breakdown?.ESOP_Stocks_Annual || 0, color: '#6366f1' }
                    ].filter(d => d.value > 0);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* ROW 1: Reality Check */}
                        <div className="md:col-span-3 flex flex-wrap gap-6">
                          <div className="flex-1 min-w-[280px] p-8 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                            <div style={{ fontFamily: FM }} className="text-xs tracking-[0.06em] text-gray-400 mb-3">STATED CTC (INFLATED)</div>
                            <div className="font-sans tracking-tight tabular-nums text-4xl md:text-5xl font-bold text-gray-500 line-through decoration-red-500/70 decoration-[3px]">
                              ₹{Math.round(ctcValue).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontFamily: FB }} className="text-sm text-gray-400 mt-2">Per annum</div>
                          </div>
                          
                          <div className="flex-1 min-w-[280px] p-8 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-teal-500/5 blur-[60px] pointer-events-none"></div>
                            <div style={{ fontFamily: FM }} className="text-xs tracking-[0.06em] text-gray-400 mb-3 relative">IN-HAND ESTIMATE</div>
                            <div className="font-sans tracking-tight tabular-nums text-5xl md:text-6xl font-black text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.3)] relative">
                              ₹{Math.round(result.CTC_Breakdown?.Estimated_Monthly_In_Hand || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontFamily: FB }} className="text-sm text-gray-400 mt-2 relative">Per month approx</div>
                          </div>
                        </div>

                        {/* ROW 2 LEFT: Donut Chart */}
                        <div className="md:col-span-2 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col justify-center items-center min-h-[300px]">
                          <div style={{ fontFamily: FM }} className="text-[10px] tracking-[0.06em] text-gray-400 w-full mb-4 uppercase">Compensation Composition</div>
                          <div className="w-full">
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={90}
                                  outerRadius={120}
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13px', fontFamily: FB }}
                                  itemStyle={{ color: '#fff', fontWeight: '600', fontFamily: 'sans-serif' }}
                                  formatter={(value) => `₹${Math.round(value).toLocaleString('en-IN')}`}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* ROW 2 RIGHT: Market Context & Breakdowns */}
                        <div className="md:col-span-1 flex flex-col gap-6">
                          <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex-1 flex flex-col justify-center">
                            <div style={{ fontFamily: FM }} className="text-[10px] tracking-[0.06em] text-gray-400 mb-2">MARKET MEDIAN</div>
                            <div className="font-sans tracking-tight tabular-nums text-2xl font-bold text-gray-200 mb-1">
                              ₹{Math.round(marketMedian).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontFamily: FB }} className="text-[11px] text-gray-400 mb-6">
                              For {result.Analysis_Metadata?.Target_Location || 'India'}
                              {!tierMatched && marketMedian > 0 && <span className="text-yellow-500 block mt-1">General market median shown.</span>}
                            </div>
                            
                            <div style={{ fontFamily: FM }} className="text-[10px] tracking-[0.06em] text-gray-400 mb-3">POSITION ({percentile}TH %ILE)</div>
                            <div className="w-full h-2 bg-gray-800 rounded-full relative">
                              <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${gaugeColor} ${gaugeShadow}`} style={{ left: `${percentile}%`, transition: 'left 1s ease-out' }} />
                            </div>
                          </div>

                          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col gap-3">
                            {pieData.map((d, i) => (
                              <BreakdownChip key={i} label={d.name} value={d.value} color={d.color} />
                            ))}
                          </div>
                        </div>

                        {/* ROW 3: Intelligence Summary */}
                        <div className="md:col-span-3 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                          {result.Market_Context?.UI_Status_Message && (
                            <div className="flex items-start gap-4 mb-6">
                              <Sparkles className="text-teal-400 mt-1 flex-shrink-0" size={24} />
                              <div style={{ fontFamily: FB }} className="text-base md:text-lg text-gray-200 leading-relaxed">
                                {result.Market_Context.UI_Status_Message}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-3 flex-wrap">
                            <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/5 text-xs text-gray-400 font-mono">
                              Role: <span className="text-white ml-1 font-sans">{result.Analysis_Metadata?.Target_Job_Title || 'Unknown'}</span>
                            </div>
                            {result.Analysis_Metadata?.Company_Tier && result.Analysis_Metadata.Company_Tier !== 'Unknown' && (
                              <div className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400 font-mono">
                                Tier: <span className="font-bold ml-1 font-sans">{result.Analysis_Metadata.Company_Tier.replace(/_/g, ' ')}</span>
                              </div>
                            )}
                            <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/5 text-xs text-gray-400 font-mono">
                              Evaluated Exp: <span className="text-white ml-1 font-sans">{result.Market_Context?.Calculated_Experience_Level_For_Offer || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </AppSection>

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

function BreakdownChip({ label, value, color }) {
  if (!value || value === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
      <span style={{ fontFamily: FB }} className="text-gray-400 text-[11px] uppercase tracking-wider">{label}:</span>
      <span className="font-sans tracking-tight tabular-nums text-gray-200 text-sm font-bold">₹{Math.round(Number(value)).toLocaleString('en-IN')}</span>
    </div>
  )
}