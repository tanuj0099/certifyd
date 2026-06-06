'use client';

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, Sparkles, AlertTriangle,
  ArrowRight, RefreshCw, TrendingUp, CheckCircle,
  AlertCircle, ExternalLink, Briefcase, FileSignature
} from 'lucide-react'
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
    setResult(null); setError(''); setMarketMedian(0);
  }

  const fetchMedianFromDB = async (city) => {
    if (!supabase || !city) return 0;
    try {
      const { data, error } = await supabase
        .from('offer_analyses')
        .select('offered_ctc')
        .ilike('city', `%${city}%`)
      
      if (error || !data || data.length === 0) return 0;
      
      const ctcs = data.map(d => Number(d.offered_ctc)).filter(c => c > 0).sort((a, b) => a - b);
      if (ctcs.length === 0) return 0;
      const mid = Math.floor(ctcs.length / 2);
      return ctcs.length % 2 !== 0 ? ctcs[mid] : (ctcs[mid - 1] + ctcs[mid]) / 2;
    } catch (e) {
      console.warn("Failed to fetch median:", e);
      return 0;
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
      const ctcStated = analysis.CTC_Breakdown?.Total_CTC_Stated || 0
      
      // Fetch dynamic median
      const median = await fetchMedianFromDB(location)
      setMarketMedian(median)

      setResult(analysis)

      // Save to Supabase (Data Flywheel)
      if (supabase && ctcStated > 0) {
        supabase.from('offer_analyses').insert({
          user_id: user?.uid || null,
          city: location,
          target_job_title: analysis.Analysis_Metadata?.Target_Job_Title || '',
          offered_ctc: ctcStated,
          market_median: median,
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
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
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

                {/* Market Comparison */}
                <AppSection id="COMPARISON" title="CTC ANALYSIS & BENCHMARKS">
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="glass" style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px', textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '6px' }}>YOUR OFFER (CTC)</div>
                      <div style={{ fontFamily: FH, fontSize: '1.6rem', fontWeight: '800', color: 'var(--text)' }}>
                        ₹{Math.round(result.CTC_Breakdown?.Total_CTC_Stated || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>Per annum</div>
                    </div>
                    <div className="glass" style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px', textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '6px' }}>IN-HAND ESTIMATE</div>
                      <div style={{ fontFamily: FH, fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent)' }}>
                        ₹{Math.round(result.CTC_Breakdown?.Estimated_Monthly_In_Hand || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>Per month approx</div>
                    </div>
                    {marketMedian > 0 && (
                      <div className="glass" style={{
                        flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px', textAlign: 'center',
                      }}>
                        <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '6px' }}>MARKET MEDIAN</div>
                        <div style={{ fontFamily: FH, fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-2)' }}>
                          ₹{Math.round(marketMedian).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>
                          For {result.Analysis_Metadata?.Target_Location || 'India'}
                        </div>
                      </div>
                    )}
                  </div>

                  {result.Market_Context?.UI_Status_Message && (
                    <div style={{
                      marginTop: '16px', padding: '14px 18px', borderRadius: '10px',
                      background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} color="var(--accent)" />
                        <span style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 }}>
                          {result.Market_Context.UI_Status_Message}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Component Breakdown */}
                  {result.CTC_Breakdown && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '10px' }}>COMPONENT BREAKDOWN</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <BreakdownChip label="Fixed Base" value={result.CTC_Breakdown.Fixed_Base_Annual} />
                        <BreakdownChip label="Variable/Bonus" value={result.CTC_Breakdown.Variable_Bonus_Annual} />
                        <BreakdownChip label="ESOP/Stocks" value={result.CTC_Breakdown.ESOP_Stocks_Annual} />
                        <BreakdownChip label="Retirals" value={result.CTC_Breakdown.Retirals_And_Hidden_Annual} />
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata Context */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '11px', fontFamily: FM, color: 'var(--text-3)' }}>
                      Role: {result.Analysis_Metadata?.Target_Job_Title || 'Unknown'}
                    </div>
                    <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '11px', fontFamily: FM, color: 'var(--text-3)' }}>
                      Location: {result.Analysis_Metadata?.Target_Location || 'Unknown'}
                    </div>
                    <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '11px', fontFamily: FM, color: 'var(--text-3)' }}>
                      Evaluated Exp: {result.Market_Context?.Calculated_Experience_Level_For_Offer || 'Unknown'}
                    </div>
                  </div>
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

function BreakdownChip({ label, value }) {
  if (!value || value === 0) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '8px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      fontFamily: FH, fontSize: '14px', fontWeight: '700', color: 'var(--text)',
    }}>
      <span style={{ color: 'var(--text-4)', fontWeight: '400', marginRight: '6px', fontSize: '12px' }}>{label}:</span>
      ₹{Math.round(Number(value)).toLocaleString('en-IN')}
    </div>
  )
}