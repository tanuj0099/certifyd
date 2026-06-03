'use client';

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, Sparkles, AlertTriangle,
  ArrowRight, RefreshCw, TrendingUp, CheckCircle,
  AlertCircle, ExternalLink, Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase.js'
import { CERTIFICATIONS } from '@/tokens.js'
import { useAuth } from '@/hooks/useAuth.jsx'
import { AppSection } from '@/components/SharedUI.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'
import { analyzeOffer } from '@/services/aiService.jsx'

const FH = "var(--font-head)";
const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const T = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }

const PICTON = 'var(--linear-blue)'
const EMERALD = 'var(--linear-blue)'
const AMBER = 'var(--cool-grey)'
const INDIGO = 'var(--linear-blue)'
const VIOLET = 'var(--accent)'

const CITIES = [
  { id: 'bangalore', label: 'Bangalore' },
  { id: 'hyderabad', label: 'Hyderabad' },
  { id: 'pune', label: 'Pune' },
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'delhi', label: 'Delhi NCR' },
  { id: 'chennai', label: 'Chennai' },
  { id: 'kolkata', label: 'Kolkata' },
  { id: 'ahmedabad', label: 'Ahmedabad' },
]

export default function OfferAnalysisPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  
  const [offerText, setOfferText] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedCerts, setSelectedCerts] = useState([])
  const [city, setCity] = useState('bangalore')
  const [yoe, setYoe] = useState(3)
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  
  const [showCertPicker, setShowCertPicker] = useState(false)
  const [certSearch, setCertSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [textReady, setTextReady] = useState(true)

  const hasFile = !!fileName
  const hasResult = !!result

  const filteredCerts = CERTIFICATIONS.filter(c => {
    if (!certSearch) return true
    return c.name.toLowerCase().includes(certSearch.toLowerCase()) ||
           c.tags.some(t => t.toLowerCase().includes(certSearch.toLowerCase())) ||
           c.domain.includes(certSearch.toLowerCase())
  }).slice(0, 30)

  const readFile = async (file) => {
    if (!file) return
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    setError('')
    
    if (isPdf) {
      setFileName(file.name); setOfferText(''); setPdfLoading(true); setTextReady(false)
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
          setError('Could not extract text from this PDF. Please paste your offer text below.')
          setTextReady(true)
          return
        }
        setOfferText(extracted)
        setTextReady(true)
      } catch (e) {
        setFileName('')
        setError(e.message || 'PDF parsing failed. Please paste your offer text below.')
        setTextReady(true)
      } finally {
        setPdfLoading(false)
      }
      return
    }
    
    // For txt or doc
    setFileName(file.name); setOfferText(''); setTextReady(false)
    const reader = new FileReader()
    reader.onload = (e) => { setOfferText(e.target.result || ''); setTextReady(true) }
    reader.onerror = () => { setError('Could not read file. Try pasting text instead.'); setFileName(''); setTextReady(true) }
    reader.readAsText(file)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]) }

  const clearAll = () => {
    setOfferText(''); setFileName(''); setResult(null); setError(''); setTextReady(true)
  }

  const toggleCert = (cert) => {
    setSelectedCerts(prev => {
      const exists = prev.find(c => c.id === cert.id)
      if (exists) return prev.filter(c => c.id !== cert.id)
      if (prev.length >= 5) return prev
      return [...prev, cert]
    })
  }

  const handleAnalyze = async () => {
    if (!textReady) { setError('Still reading your file - please wait a moment and try again.'); return }
    if (!offerText || offerText.trim().length < 50) {
      setError('Please paste or upload at least 50 characters of offer text.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const analysis = await analyzeOffer({
        offerText,
        certStack: selectedCerts,
        city: CITIES.find(c => c.id === city)?.label || city,
        yoe
      })

      setResult(analysis)

      if (supabase) {
        supabase.from('offer_analyses').insert({
          user_id: user?.uid || null,
          cert_stack: selectedCerts.map(c => c.name),
          city,
          yoe,
          offered_ctc: analysis.offered_ctc || 0,
          market_median: analysis.market_median || 0,
          percentile_diff: analysis.percent_diff || 0,
          counter_offer_script: analysis.counter_offer_script || '',
          raw_offer_text: offerText.substring(0, 3000),
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

  const naukriSearchUrl = selectedCerts.length > 0
    ? `https://www.naukri.com/${encodeURIComponent(selectedCerts.map(c => c.name).join(' '))}-jobs-in-${encodeURIComponent(city)}?experience=${yoe}`
    : `https://www.naukri.com/jobs-in-${encodeURIComponent(city)}?experience=${yoe}`

  return (
    <ToolPageWrapper
      title="Offer Letter"
      subtitle="Analysis"
      description="Upload your offer letter PDF or paste the text. Compare against live market benchmarks."
      footer={false}
      showFeedback={false}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile Selection */}
          {!hasResult && (
            <div className="glass" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
              padding: '18px', borderRadius: '10px',
            }}>
              {/* Cert Stack */}
              <div>
                <label style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  CERTIFICATION STACK
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '28px' }}>
                  {selectedCerts.length === 0 && (
                    <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-4)', padding: '4px 0' }}>Select up to 5</span>
                  )}
                  {selectedCerts.map(c => (
                    <span key={c.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '3px 8px', borderRadius: '6px', fontSize: '11px',
                      fontFamily: FB, fontWeight: '600', background: 'var(--accent-dim)',
                      color: 'var(--accent)', border: '1px solid var(--border-accent)',
                    }}>
                      {c.name.split(' ').slice(0, 2).join(' ')}
                      <X size={10} style={{ cursor: 'pointer' }} onClick={() => toggleCert(c)} />
                    </span>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setShowCertPicker(!showCertPicker); setCertSearch('') }}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      color: 'var(--text-3)', fontSize: '12px', fontFamily: FB,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    + Add certifications
                  </button>
                  <AnimatePresence>
                    {showCertPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          maxHeight: '240px', overflowY: 'auto', marginTop: '4px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Search certifications..."
                          value={certSearch}
                          onChange={e => setCertSearch(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 12px', border: 'none',
                            borderBottom: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text)', fontSize: '12px', fontFamily: FB, outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          autoFocus
                        />
                        {filteredCerts.map(c => {
                          const selected = selectedCerts.find(s => s.id === c.id)
                          return (
                            <button
                              key={c.id}
                              onClick={() => toggleCert(c)}
                              style={{
                                width: '100%', padding: '8px 12px', textAlign: 'left',
                                background: selected ? 'var(--accent-dim)' : 'transparent',
                                border: 'none', borderBottom: '1px solid var(--border-subtle)',
                                color: selected ? 'var(--accent)' : 'var(--text-2)',
                                fontSize: '12px', fontFamily: FB, cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}
                            >
                              <span>{c.name}</span>
                              {selected && <CheckCircle size={12} color="var(--accent)" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* City */}
              <div>
                <label style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  MARKET CITY
                </label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '13px', fontFamily: FB,
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  {CITIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* YOE */}
              <div>
                <label style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  YEARS OF EXPERIENCE
                </label>
                <input
                  type="number" min={0} max={30} step={0.5} value={yoe}
                  onChange={e => setYoe(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '13px', fontFamily: FB,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {/* Upload Zone */}
          <AnimatePresence>
            {!hasResult && !offerText.trim() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="glass" style={{
                  borderRadius: '11px',
                  border: '1.5px dashed ' + (dragging ? PICTON : hasFile ? EMERALD : 'var(--border)'),
                  background: dragging ? PICTON + '08' : hasFile ? EMERALD + '06' : 'transparent',
                  transition: 'border-color 0.2s, background 0.2s',
                }}>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => { if (!hasFile) fileInputRef.current?.click() }}
                    style={{ padding: '32px 22px', cursor: hasFile ? 'default' : 'pointer', textAlign: 'center' }}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={e => readFile(e.target.files[0])} />
                    
                    {pdfLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid ' + PICTON, borderTopColor: 'transparent' }}
                        />
                        <span style={{ fontSize: '13px', color: PICTON, fontFamily: FH, fontWeight: '600' }}>Reading PDF...</span>
                      </div>
                    ) : hasFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FileText size={14} color={EMERALD} />
                        <span style={{ fontSize: '13px', color: EMERALD, fontWeight: '600', fontFamily: FH }}>{fileName}</span>
                        <button onClick={e => { e.stopPropagation(); clearAll() }} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} color="var(--text-4)" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <div style={{ fontSize: '15px', color: 'var(--text-2)', fontFamily: FH, fontWeight: '700', marginBottom: '6px' }}>
                          Drop your offer letter PDF or <span style={{ color: PICTON, textDecoration: 'underline' }}>browse</span>
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
          {!hasFile && !offerText.trim() && !hasResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FM }}>or paste text below</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
          )}

          {/* Textarea */}
          <AnimatePresence>
            {!hasFile && !hasResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                <textarea
                  value={offerText}
                  onChange={e => setOfferText(e.target.value)}
                  placeholder="Paste your offer letter text here (salary, role, company, benefits, CTC breakdown...)"
                  rows={8}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '11px',
                    background: 'var(--bg)', border: '1px solid ' + (offerText.trim() ? PICTON + '44' : 'var(--border)'),
                    color: 'var(--text)', fontSize: '13px', fontFamily: FB, lineHeight: 1.6,
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.18s',
                  }}
                />
                {offerText.trim() && (
                  <>
                    <button onClick={clearAll} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                      <X size={13} />
                    </button>
                    <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '10px', color: 'var(--text-4)', fontFamily: FM }}>{offerText.length}c</div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: FB, fontSize: '13px', color: '#EF4444', lineHeight: '1.5' }}>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          {!hasResult && (
            <motion.button
              onClick={handleAnalyze}
              disabled={loading || (!offerText.trim() && !hasFile)}
              whileHover={(offerText.trim() || hasFile) ? { scale: 1.01, y: -1 } : {}}
              whileTap={(offerText.trim() || hasFile) ? { scale: 0.98 } : {}}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: loading ? 'var(--bg-surface)' : (offerText.trim() || hasFile) ? 'var(--text)' : 'transparent',
                border: loading ? '1px solid var(--border)' : (offerText.trim() || hasFile) ? 'none' : '1px solid var(--border)',
                color: loading ? 'var(--text-4)' : (offerText.trim() || hasFile) ? 'var(--bg)' : 'var(--text-4)',
                fontSize: '15px', fontFamily: FH, fontWeight: '800',
                cursor: loading ? 'not-allowed' : (offerText.trim() || hasFile) ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '9px', letterSpacing: '-0.015em', transition: 'all 0.2s',
                boxShadow: (offerText.trim() || hasFile) ? '0 4px 16px transparent' : 'none',
              }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--bg)' }} />
                  Running AI Analysis...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Analyze My Offer
                </>
              )}
            </motion.button>
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
                {/* Market Comparison */}
                <AppSection id="COMPARISON" title="MARKET COMPARISON">
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="glass" style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '6px' }}>YOUR OFFER</div>
                      <div style={{ fontFamily: FH, fontSize: '1.6rem', fontWeight: '800', color: 'var(--text)' }}>
                        ₹{(result.offered_ctc || 0).toFixed(1)}L
                      </div>
                      <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>CTC per annum</div>
                    </div>
                    <div style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px',
                      background: result.percent_diff >= 0 ? 'var(--accent-dim)' : 'rgba(239, 68, 68, 0.06)',
                      border: result.percent_diff >= 0 ? '1px solid var(--border-accent)' : '1px solid rgba(239, 68, 68, 0.25)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '6px' }}>MARKET MEDIAN</div>
                      <div style={{ fontFamily: FH, fontSize: '1.6rem', fontWeight: '800', color: result.percent_diff >= 0 ? 'var(--accent)' : '#EF4444' }}>
                        ₹{(result.market_median || 0).toFixed(1)}L
                      </div>
                      <div style={{
                        fontFamily: FH, fontSize: '13px', fontWeight: '700',
                        color: result.percent_diff >= 0 ? 'var(--accent)' : '#EF4444',
                        marginTop: '4px',
                      }}>
                        {result.percent_diff >= 0 ? '+' : ''}{result.percent_diff || 0}% vs market
                      </div>
                    </div>
                    <div className="glass" style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '6px' }}>75TH PERCENTILE</div>
                      <div style={{ fontFamily: FH, fontSize: '1.6rem', fontWeight: '800', color: 'var(--indigo-light)' }}>
                        ₹{(result.market_75th || 0).toFixed(1)}L
                      </div>
                      <div style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>Top earners</div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '16px', padding: '14px 18px', borderRadius: '10px',
                    background: result.percent_diff >= 0 ? 'var(--accent-dim)' : 'rgba(239, 68, 68, 0.06)',
                    border: result.percent_diff >= 0 ? '1px solid var(--border-accent)' : '1px solid rgba(239, 68, 68, 0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {result.percent_diff >= 0 ? (
                        <CheckCircle size={16} color="var(--accent)" />
                      ) : (
                        <AlertCircle size={16} color="#EF4444" />
                      )}
                      <span style={{ fontFamily: FH, fontSize: '14px', fontWeight: '700', color: result.percent_diff >= 0 ? 'var(--accent)' : '#EF4444' }}>
                        {result.assessment || (result.percent_diff >= 0 ? 'Your offer is competitive.' : 'Your offer is below market.')}
                      </span>
                    </div>
                    {result.market_trend && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '10px' }}>
                        <TrendingUp size={13} color={VIOLET} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                          {result.market_trend}
                        </div>
                      </div>
                    )}
                  </div>

                  {result.breakdown && (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '10px' }}>CTC BREAKDOWN</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <BreakdownChip label="Fixed Base" value={result.breakdown.base || result.offered_fixed} />
                        <BreakdownChip label="Variable/Bonus" value={result.breakdown.bonus || result.offered_variable} />
                        <BreakdownChip label="ESOP/Stocks" value={result.breakdown.stocks_esop} />
                      </div>
                      {result.breakdown.benefits_note && (
                        <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-4)', marginTop: '8px' }}>
                          Note: {result.breakdown.benefits_note}
                        </div>
                      )}
                    </div>
                  )}
                </AppSection>

                {/* Counter-Offer Script */}
                <AppSection id="COUNTER" title="COUNTER-OFFER SCRIPT">
                  <div className="glass" style={{
                    padding: '18px 20px', borderRadius: '10px',
                    fontFamily: FB, fontSize: '14px', color: 'var(--text)', lineHeight: 1.8,
                    fontStyle: 'italic', borderLeft: '4px solid var(--accent)'
                  }}>
                    "{result.counter_offer_script || 'Not available'}"
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.counter_offer_script || '')
                    }}
                    style={{
                      marginTop: '10px', padding: '8px 14px', borderRadius: '6px',
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text-3)', fontSize: '12px', fontFamily: FH, fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                  >
                    Copy script
                  </button>
                </AppSection>

                {/* Red Flags / Strengths */}
                {(result.red_flags?.length > 0 || result.strengths?.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {result.strengths?.length > 0 && (
                      <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)' }}>
                        <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: '8px' }}>STRENGTHS</div>
                        {result.strengths.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                            <CheckCircle size={12} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.red_flags?.length > 0 && (
                      <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ fontFamily: FM, fontSize: '10px', color: '#EF4444', letterSpacing: '0.06em', marginBottom: '8px' }}>RED FLAGS</div>
                        {result.red_flags.map((rf, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                            <AlertCircle size={12} color="#EF4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>{rf}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Live Jobs Action */}
                <AppSection id="JOBS" title="LEVERAGE">
                  <div className="glass" style={{ padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ fontFamily: FH, fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>Find a Better Offer</div>
                      <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
                        Search live roles in {CITIES.find(c => c.id === city)?.label || city} to build negotiation leverage.
                      </p>
                    </div>
                    <a
                      href={naukriSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '12px 20px', borderRadius: '8px',
                        background: 'var(--text)', color: 'var(--bg)',
                        fontSize: '13px', fontFamily: FH, fontWeight: '700',
                        textDecoration: 'none', transition: 'all 0.18s',
                      }}
                    >
                      <Briefcase size={15} />
                      View Live Jobs
                      <ExternalLink size={15} />
                    </a>
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
  if (value === undefined || value === null) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '8px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      fontFamily: FH, fontSize: '14px', fontWeight: '700', color: 'var(--text)',
    }}>
      <span style={{ color: 'var(--text-4)', fontWeight: '400', marginRight: '6px', fontSize: '12px' }}>{label}:</span>
      ₹{Number(value).toFixed(1)}L
    </div>
  )
}