import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Sparkles, AlertCircle, CheckCircle, X, TrendingUp, ExternalLink,
  IndianRupee, ChevronDown, ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { CERTIFICATIONS } from '../tokens.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { AppSection } from '../components/SharedUI.jsx'

const FH = "var(--font-head)"
const FM = "var(--font-mono)"
const FB = "var(--font-body)"
const T = { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
const NAV_H = 64

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

function parseOfferWithClaude(offerText, certStack, city, yoe) {
  const certLabels = certStack.map(c => c.name).join(', ')
  const systemPrompt = 'You are a salary negotiation analyst for the Indian job market (2026). Analyze offer letters against market benchmarks. Respond with ONLY a valid JSON object — no markdown, no prose, no code fences. All currency in Indian Rupees (₹).'

  const userPrompt = `Analyze this job offer letter for an Indian professional:

OFFER LETTER TEXT:
"""
${offerText.substring(0, 6000)}
"""

CANDIDATE PROFILE:
- Certifications: ${certLabels}
- City: ${city}
- Years of Experience: ${yoe}

Return ONLY this JSON:
{
  "offered_ctc": number_in_lakhs,
  "offered_fixed": number_in_lakhs,
  "offered_variable": number_in_lakhs,
  "market_median": number_in_lakhs,
  "market_75th": number_in_lakhs,
  "percent_diff": number,
  "assessment": "one sentence — is this above or below market",
  "breakdown": {
    "base": number_in_lakhs,
    "bonus": number_in_lakhs,
    "stocks_esop": number_in_lakhs,
    "benefits_note": "short string about benefits included"
  },
  "counter_offer_script": "2-3 sentence professional counter-offer script with specific number in ₹",
  "red_flags": ["any red flags found in offer", "else empty array"],
  "strengths": ["strong points about the offer", "if any"],
  "market_trend": "one sentence about hiring trend for this profile"
}

Rules:
- If text doesn't contain salary/CTC, set offered_ctc to 0 and note "CTC not found in offer text"
- Market median must be realistic for India 2026 (look at YOE, city, cert stack)
- Counter offer script must mention a specific ₹ amount
- Be honest — if the offer is good, say so`

  return fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    }),
  }).then(r => {
    if (!r.ok) throw new Error('Claude API error: ' + r.status)
    return r.json()
  }).then(data => {
    const cleaned = (data.content || '').replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error('Could not parse Claude response as JSON')
    }
  })
}

function estimateMarketMedian(certStack, city, yoe) {
  const totalHike = certStack.reduce((sum, c) => sum + (c.avgHike || 0), 0)
  const avgHike = certStack.length > 0 ? totalHike / certStack.length : 20
  const baseSalaries = { bangalore: 10, hyderabad: 9, pune: 8.5, mumbai: 10.5, delhi: 9.5, chennai: 8, kolkata: 7, ahmedabad: 7.5 }
  const base = baseSalaries[city] || 9
  return base * (1 + (yoe * 0.12)) * (1 + (avgHike / 100) * 0.4)
}

function generateCounterScript(offeredCTC, marketMedian, certStack) {
  const diff = offeredCTC > 0 ? ((offeredCTC - marketMedian) / marketMedian * 100) : 0
  if (diff >= 0) {
    return `"Thank you for the offer of ₹${offeredCTC}L. Based on my certifications (${certStack.map(c => c.name.split(' ').slice(0, 2).join(' ')).join(', ')}) and current market data for this role, I believe we can bring the total to ₹${(offeredCTC * 1.08).toFixed(1)}L. I'm excited about this opportunity and ready to contribute from day one."`
  }
  if (diff > -15) {
    const target = (marketMedian * 1.05).toFixed(1)
    return `"Thank you for the offer of ₹${offeredCTC}L. Given my certified expertise in ${certStack.map(c => c.name.split(' ').slice(0, 2).join(' ')).join(' and ')}, the market median for this profile is ₹${marketMedian}L. I'd like to discuss adjusting the CTC to ₹${target}L to better align with market benchmarks. I'm very keen on this role and believe we can work this out."`
  }
  const target = Math.round(marketMedian * 0.9)
  return `"Thank you for the offer. My certifications place me at the ₹${marketMedian}L market median for this profile. While the offer of ₹${offeredCTC}L is below market, I'd propose ₹${target}L. Here's what I bring: ${certStack.map(c => c.name).join(', ')}. Let's find a number that works."`
}

export default function OfferAnalysisPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [offerText, setOfferText] = useState('')
  const [selectedCerts, setSelectedCerts] = useState([])
  const [city, setCity] = useState('bangalore')
  const [yoe, setYoe] = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showCertPicker, setShowCertPicker] = useState(false)
  const [certSearch, setCertSearch] = useState('')

  const filteredCerts = CERTIFICATIONS.filter(c => {
    if (!certSearch) return true
    return c.name.toLowerCase().includes(certSearch.toLowerCase()) ||
           c.tags.some(t => t.toLowerCase().includes(certSearch.toLowerCase())) ||
           c.domain.includes(certSearch.toLowerCase())
  }).slice(0, 30)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (file.type === 'application/pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.5.207/pdf.worker.min.mjs'
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          fullText += content.items.map(item => item.str).join(' ') + '\n'
        }
        setOfferText(fullText.trim())
      } catch (err) {
        setError('Could not read PDF. Please paste the offer text directly instead.')
      }
    } else {
      const text = await file.text()
      setOfferText(text)
    }
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
    if (!offerText || offerText.trim().length < 50) {
      setError('Please enter at least 50 characters of offer text.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      let analysis
      try {
        analysis = await parseOfferWithClaude(offerText, selectedCerts, city, yoe)
      } catch {
        const median = estimateMarketMedian(selectedCerts, city, yoe)
        const offeredMatch = offerText.match(/₹?\s*(\d+\.?\d*)\s*(?:L|lakh|LPA|Lakhs)/i)
        const offeredCTC = offeredMatch ? parseFloat(offeredMatch[1]) : median * 0.85
        const diff = ((offeredCTC - median) / median * 100)
        const script = generateCounterScript(offeredCTC, median, selectedCerts)

        analysis = {
          offered_ctc: offeredCTC,
          market_median: median,
          market_75th: median * 1.25,
          percent_diff: Math.round(diff),
          assessment: diff >= 0
            ? `Your offer is ${Math.round(Math.abs(diff))}% above the market median for this profile.`
            : `Your offer is ${Math.round(Math.abs(diff))}% below the market median for this profile.`,
          breakdown: { base: offeredCTC * 0.7, bonus: offeredCTC * 0.15, stocks_esop: offeredCTC * 0.15, benefits_note: 'Standard benefits package' },
          counter_offer_script: script,
          red_flags: [],
          strengths: ['Offer matches market expectations'],
          market_trend: `Hiring demand for these certifications is strong in ${city} in 2026.`,
        }
      }

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
    <div style={{ paddingTop: '128px', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: 'clamp(20px, 3vw, 40px) 16px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={T}>
          <h1 style={{
            fontFamily: FH, fontWeight: '800', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.08,
            margin: '0 0 8px 0',
          }}>
            Offer Letter
            <span style={{ color: 'var(--indigo)' }}> Analysis</span>
          </h1>
          <p style={{ fontFamily: FB, fontSize: '14px', color: 'var(--text-3)', marginBottom: '28px', lineHeight: 1.6 }}>
            Paste your offer letter or upload a PDF. Compare against market benchmarks for your certification stack.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Offer Text Input */}
          <div>
            <label style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              OFFER LETTER TEXT
            </label>
            <textarea
              value={offerText}
              onChange={e => setOfferText(e.target.value)}
              placeholder="Paste your offer letter text here (salary, role, company, benefits, CTC breakdown...)"
              rows={8}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '13px', fontFamily: FB, lineHeight: 1.6,
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', borderRadius: '6px',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-3)', fontSize: '12px', fontFamily: FH, fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Upload size={12} /> Upload PDF
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
              <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)' }}>
                {offerText.length} characters
              </span>
            </div>
          </div>

          {/* Profile Selection */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
            padding: '18px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
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
                  <ChevronDown size={12} />
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
                CITY
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

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ fontFamily: FB, fontSize: '13px', color: '#EF4444' }}>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !offerText.trim()}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px',
              background: loading ? 'var(--bg-surface)' : 'var(--accent)',
              border: loading ? '1px solid var(--border)' : 'none',
              color: loading ? 'var(--text-4)' : 'var(--bg)',
              fontSize: '15px', fontFamily: FH, fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', opacity: !offerText.trim() ? 0.5 : 1,
            }}
          >
            {loading ? (
              <>
                <Sparkles size={16} /> Analyzing with Claude AI...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Analyze My Offer
              </>
            )}
          </button>

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
                    <div style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
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
                    <div style={{
                      flex: 1, minWidth: '140px', padding: '20px', borderRadius: '10px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
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
                    marginTop: '16px', padding: '12px 16px', borderRadius: '8px',
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
                        {result.assessment || (result.percent_diff >= 0 ? 'Your offer is competitive' : 'Your offer is below market')}
                      </span>
                    </div>
                    {result.market_trend && (
                      <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', marginTop: '6px', lineHeight: 1.5 }}>
                        {result.market_trend}
                      </div>
                    )}
                  </div>

                  {result.breakdown && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.06em', marginBottom: '10px' }}>CTC BREAKDOWN</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <BreakdownChip label="Base" value={result.breakdown.base} />
                        <BreakdownChip label="Bonus" value={result.breakdown.bonus} />
                        <BreakdownChip label="ESOP/Stocks" value={result.breakdown.stocks_esop} />
                      </div>
                      {result.breakdown.benefits_note && (
                        <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-4)', marginTop: '8px' }}>
                          {result.breakdown.benefits_note}
                        </div>
                      )}
                    </div>
                  )}
                </AppSection>

                {/* Counter-Offer Script */}
                <AppSection id="COUNTER" title="COUNTER-OFFER SCRIPT">
                  <div style={{
                    padding: '18px 20px', borderRadius: '10px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    fontFamily: FB, fontSize: '14px', color: 'var(--text)', lineHeight: 1.8,
                    fontStyle: 'italic',
                  }}>
                    {result.counter_offer_script || 'Not available'}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.counter_offer_script || '')
                    }}
                    style={{
                      marginTop: '10px', padding: '8px 14px', borderRadius: '6px',
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text-3)', fontSize: '12px', fontFamily: FH, fontWeight: '600',
                      cursor: 'pointer',
                    }}
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
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                            <CheckCircle size={12} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.red_flags?.length > 0 && (
                      <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ fontFamily: FM, fontSize: '10px', color: '#EF4444', letterSpacing: '0.06em', marginBottom: '8px' }}>RED FLAGS</div>
                        {result.red_flags.map((rf, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                            <AlertCircle size={12} color="#EF4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>{rf}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Job Listings Placeholder */}
                <AppSection id="JOBS" title="LIVE JOBS PAYING MORE">
                  <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', marginBottom: '14px', lineHeight: 1.6 }}>
                    Explore live job listings in <strong>{CITIES.find(c => c.id === city)?.label || city}</strong> that may offer better compensation for your profile.
                  </p>
                  <a
                    href={naukriSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '14px 24px', borderRadius: '10px',
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: '14px', fontFamily: FH, fontWeight: '700',
                      textDecoration: 'none', transition: 'all 0.18s',
                    }}
                  >
                    <ExternalLink size={15} />
                    Search Naukri for {selectedCerts.map(c => c.name.split(' ').slice(0, 2).join(' ')).join(', ') || 'relevant'} roles
                    <ArrowRight size={15} />
                  </a>
                  <p style={{ fontFamily: FB, fontSize: '11px', color: 'var(--text-4)', marginTop: '8px' }}>
                    Job listings are linked to Naukri.com. Certify does not host or list jobs directly.
                  </p>
                </AppSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function BreakdownChip({ label, value }) {
  return (
    <div style={{
      padding: '8px 14px', borderRadius: '8px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      fontFamily: FH, fontSize: '13px', fontWeight: '700', color: 'var(--text)',
    }}>
      <span style={{ color: 'var(--text-4)', fontWeight: '400', marginRight: '4px' }}>{label}:</span>
      ₹{value?.toFixed(1)}L
    </div>
  )
}