// ─────────────────────────────────────────────────────────
// aiService.jsx  — Phase 2: JSON mode, no regex parsing
//
// API key lives on the server only (api/groq.js).
// This file never touches the key — safe in browser.
// ─────────────────────────────────────────────────────────

// ── ROI prompt — requests strict JSON output ──────────────
const buildROIPrompt = ({ certName, currentSalary, certCost, hikePercent, isStudent, city = '', domain = '' }) => {
  const annualSalary    = currentSalary * 100000
  const hikedSalary     = annualSalary * (1 + hikePercent / 100)
  const annualGain      = hikedSalary - annualSalary
  const breakEvenMonths = annualGain > 0 ? Math.ceil((certCost * 100000) / (annualGain / 12)) : 0
  const fiveYearGain    = annualGain * 5 - certCost * 100000

  const context = isStudent
    ? `STUDENT with no salary, targeting first job in India. Cert: ${certName}. Goal: first offer Rs.4.8L+.`
    : `Salary: Rs.${currentSalary}L/yr. Cost: Rs.${certCost}L. City: ${city}. Domain: ${domain}.`

  const studentSchema = `
{
  "entryOffers": "₹X.XL – ₹Y.YL",
  "timeToOffer": "~X weeks post-cert",
  "topHirers": "Company A, Company B",
  "demandTrend": "↑ Growing (X open roles)"
}`;

  const professionalSchema = `
{
  "predictedHikePercent": integer (e.g. 25, 12, 30),
  "verdict": "Strong ROI / Moderate ROI / Weak ROI — one sentence with % and timeline",
  "breakEven": "X months",
  "projection": "Rs.X.XL",
  "demand": [
    "specific Naukri/LinkedIn demand signal with number",
    "top 2 hiring companies in India",
    "YoY growth signal"
  ],
  "risks": [
    "biggest real risk",
    "how to mitigate it"
  ],
  "bottomLine": "one punchy action sentence — be direct"
}`;

  return `You are Certify, an elite, brutally honest career and salary analyst for Indian professionals (2026).
${context}
Certification: ${certName || 'General IT Certification'}

${isStudent ? 
`Your task is to predict hiring probability and entry-level packages for a fresher obtaining this certification. Do not predict salary hikes. Provide realistic entry-level numbers, average time to get an offer, top entry-level hirers in India, and the current demand trend for freshers.` : 
`Your task is to predict the exact, realistic salary hike percentage this professional will get. If it's highly demanded, predict a higher hike (25-45%). If saturated, predict low (5-10%). Calculate break-even months. Current salary: ${currentSalary}L. Cert cost: ${certCost}L.`}

Respond with ONLY a valid JSON object — no markdown, no prose, no code fences.

${isStudent ? studentSchema : professionalSchema}

Rules: India-specific. Under 260 words total. No fluff.`
}

// ── Safely parse JSON from AI — never throws ─────────────
const safeParseJSON = (text) => {
  try {
    // Strip any accidental markdown fences the model adds
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

// ── Fallback when JSON parse fails ───────────────────────
const roiFallback = (text, fallbackHike) => ({
  predictedHikePercent: fallbackHike || 15,
  verdict:      'Analysis complete — see raw output below',
  breakEven:    '—',
  projection:   '—',
  demand:       [],
  risks:        [],
  studentTrack: '',
  bottomLine:   'Re-run the analysis for a structured result.',
  raw:          text,
  parseError:   true,
})

// ── Core fetch — hits /api/groq server endpoint ───────────
const callGroq = async (messages, maxTokens = 700, temperature = 0.65, jsonMode = false) => {
  const body = {
    model:       'llama-3.3-70b-versatile',
    messages,
    max_tokens:  maxTokens,
    temperature,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const response = await fetch('/api/groq', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!response.ok) {
    const rawText = await response.text().catch(() => '')
    let err = {}
    try { err = JSON.parse(rawText) } catch (_) { err = { error: rawText } }
    const msg = err?.error?.message || err?.error || rawText || 'HTTP ' + response.status
    if (response.status === 401) throw new Error('Invalid API key (401) — ' + msg + ' (Check GROQ_API_KEY in .env)')
    if (response.status === 403) throw new Error('Access denied (403) — ' + msg + ' (Verify GROQ_API_KEY or Cloudflare WAF restrictions)')
    if (response.status === 429) throw new Error('Rate limit (429) — wait 30 seconds and retry. (' + msg + ')')
    if (response.status === 404) throw new Error('API endpoint not found (404) — run: vercel dev (not npm run dev)')
    if (response.status >= 500) throw new Error('Server error (' + response.status + ') — ' + msg)
    throw new Error(msg)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  if (!text) throw new Error('Empty response from AI')
  return text
}

// ── Public exports ────────────────────────────────────────

export const analyzeROI = async ({ certName, currentSalary, certCost, fallbackHikePercent, isStudent = false, city = '', domain = '' }) => {
  const text   = await callGroq(
    [
      { role: 'system', content: 'You are Certify. Respond ONLY with a valid JSON object. India market 2026.' },
      { role: 'user',   content: buildROIPrompt({ certName, currentSalary, certCost, isStudent, city, domain }) },
    ],
    700,
    0.65,
    true   // ← JSON mode ON
  )

  const parsed = safeParseJSON(text)
  if (!parsed) return roiFallback(text, fallbackHikePercent)

  return {
    predictedHikePercent: parsed.predictedHikePercent || fallbackHikePercent || 15,
    verdict:      parsed.verdict      || '',
    breakEven:    parsed.breakEven    || '',
    projection:   parsed.projection   || '',
    demand:       Array.isArray(parsed.demand) ? parsed.demand : [],
    risks:        Array.isArray(parsed.risks)  ? parsed.risks  : [],
    studentTrack: parsed.studentTrack || '',
    bottomLine:   parsed.bottomLine   || '',
    // Student specific
    entryOffers:  parsed.entryOffers  || '₹4.5L – ₹7.2L',
    timeToOffer:  parsed.timeToOffer  || '~12 weeks post-cert',
    topHirers:    parsed.topHirers    || 'TCS, Infosys, Wipro',
    demandTrend:  parsed.demandTrend  || '↑ Growing',
    raw:          text,
    parseError:   false,
  }
}

export const callGroqForPitch = async (_unusedApiKey, prompt) => {
  return callGroq(
    [{ role: 'user', content: prompt }],
    450,
    0.72
  )
}

export const callGroqForResume = async (_unusedApiKey, prompt) => {
  return callGroq(
    [
      { role: 'system', content: 'You are Certify. Respond ONLY with a valid JSON object. India market 2026.' },
      { role: 'user',   content: prompt },
    ],
    900,
    0.62,
    true   // ← JSON mode ON
  )
}

export const getMockResponse = ({ certName, currentSalary, certCost, hikePercent, isStudent }) => {
  const annualGain      = currentSalary * 100000 * hikePercent / 100
  const breakEvenMonths = annualGain > 0 ? Math.ceil((certCost * 100000) / (annualGain / 12)) : 0
  const fiveYearGain    = ((annualGain * 5 - certCost * 100000) / 100000).toFixed(1)
  return {
    verdict:      `Strong ROI — ${certName} projected +${hikePercent}% hike, break-even in ${breakEvenMonths} months`,
    breakEven:    `${breakEvenMonths} months — roughly ${Math.round(breakEvenMonths * 1.3)} months of Bangalore PG rent`,
    projection:   `Rs.${fiveYearGain}L net over 5 years`,
    demand:       ['2,400+ open roles on Naukri right now', 'Top hirers: TCS, Infosys, Wipro, Accenture', 'Demand up 34% YoY per LinkedIn'],
    risks:        ['Cert alone is not enough — build 2 portfolio projects', 'Budget 3 months of real study, not 3 weeks'],
    studentTrack: isStudent ? 'Step 1: Complete cert in 4 months. Step 2: Build 2 GitHub projects. Step 3: Apply to Capgemini iON for Rs.4.8L offer.' : '',
    bottomLine:   'Run: vercel dev (not npm run dev) to enable the API proxy locally.',
    // Student specific
    entryOffers:  '₹4.5L – ₹7.2L',
    timeToOffer:  '~12 weeks post-cert',
    topHirers:    'TCS, Infosys, Wipro',
    demandTrend:  '↑ Growing',
    raw:          '(demo)',
    parseError:   false,
  }
}

// ── Domain validation via Groq ────────────────────────────
// Returns { isValid: bool, normalized: string, reason: string }
export const validateDomain = async (domainInput, currentRole = '') => {
  if (!domainInput || !domainInput.trim()) {
    return { isValid: false, normalized: '', reason: 'No domain entered', intent: 'Domain_Pivot' }
  }

  const prompt = `You are a professional career domain classifier for a certification platform.

The user entered this as their target career domain: "${domainInput.trim()}"
${currentRole ? `The user's current role is: "${currentRole.trim()}"` : ''}

Your task:
1. BROAD ACCEPTANCE: Accept ANY legitimate professional, corporate, business, management, or tech-adjacent domain. This includes (but is not limited to): Technology, IT, Cloud, Cybersecurity, Data, AI, Finance, Accounting, Marketing, Sales, HR, Legal, Healthcare Admin, Operations, Supply Chain, Project Management, Product Management, Sports Management, Media, Education, Consulting, Real Estate, and any other recognized professional field.
2. ONLY reject (set "Invalid_Domain": true) if the input is:
   - Complete gibberish or random characters (e.g., "asdfghjkl", "xkz123").
   - A purely physical/manual trade that does not use professional certifications (e.g., "Plumber", "Electrician", "Astronaut", "Farmer").
3. If it is valid, normalize it to a clean title-case label (e.g., "sports mgmt" → "Sports Management").
4. INTENT CLASSIFICATION: Compare the target domain to the current role (if provided). If they are identical or highly related (e.g. Data Analyst → Data Science, Software Engineer → Cloud Computing), set "Determined_Intent" to "Level_Up". If they are clearly different fields, set "Determined_Intent" to "Domain_Pivot".

Respond ONLY with a valid JSON object — no markdown, no prose:
{
  "Invalid_Domain": true or false,
  "normalized": "Clean Title Case Domain Name or empty string if invalid",
  "reason": "One sentence explanation",
  "Determined_Intent": "Level_Up" or "Domain_Pivot"
}

Examples:
- Target: "Sports Management" → { "Invalid_Domain": false, "normalized": "Sports Management", "reason": "Recognized professional management domain.", "Determined_Intent": "Domain_Pivot" }
- Target: "cybersec", Current: "" → { "Invalid_Domain": false, "normalized": "Cybersecurity", "reason": "Recognized abbreviation.", "Determined_Intent": "Domain_Pivot" }
- Target: "asdfghjkl" → { "Invalid_Domain": true, "normalized": "", "reason": "Gibberish — not a recognized professional domain.", "Determined_Intent": "Domain_Pivot" }
- Target: "Plumber" → { "Invalid_Domain": true, "normalized": "", "reason": "Manual trade — does not use professional certifications.", "Determined_Intent": "Domain_Pivot" }
- Target: "Data Science", Current: "Data Analyst" → { "Invalid_Domain": false, "normalized": "Data Science", "reason": "Recognized domain.", "Determined_Intent": "Level_Up" }
- Target: "Marketing", Current: "Software Engineer" → { "Invalid_Domain": false, "normalized": "Marketing", "reason": "Corporate domain.", "Determined_Intent": "Domain_Pivot" }
`

  try {
    const text = await callGroq(
      [
        { role: 'system', content: 'You are a strict domain validator. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      250,
      0.1,
      true  // JSON mode
    )
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      isValid:    !parsed.Invalid_Domain,
      normalized: parsed.normalized || '',
      reason:     parsed.reason || '',
      intent:     parsed.Determined_Intent || 'Domain_Pivot'
    }
  } catch {
    // If API fails, allow through (fail open — don't block user)
    return { isValid: true, normalized: domainInput.trim(), reason: 'Validation skipped (API unavailable)', intent: 'Domain_Pivot' }
  }
}

// ── Offer analysis via Groq ────────────────────────────
export const analyzeOffer = async ({ offerText, certStack, city, yoe }) => {
  const certLabels = certStack.map(c => c.name).join(', ')
  const systemPrompt = 'You are an elite, brutally honest salary negotiation analyst for the Indian job market (2026). Respond with ONLY a valid JSON object — no markdown, no prose, no code fences. All currency in Indian Rupees (₹) rounded to 1 decimal place (e.g., 14.5).'

  const userPrompt = `Analyze this job offer letter for an Indian professional.
  
  First, strictly verify if the text is a genuine job offer letter or compensation details. If it is NOT an offer letter (e.g., resume, assignment, fee receipt, random text, generic article), you MUST return this exact JSON:
  {
    "is_valid_offer": false,
    "rejection_reason": "Provide a blunt 1-sentence reason why this is not a valid offer letter."
  }
  
  If it IS a valid offer letter, proceed with analysis:

OFFER LETTER TEXT:
--- START OFFER TEXT ---
${offerText.substring(0, 6000)}
--- END OFFER TEXT ---

CANDIDATE PROFILE:
- Certifications: ${certLabels || 'None'}
- City: ${city}
- Years of Experience: ${yoe}

Return ONLY this JSON:
{
  "is_valid_offer": true,
  "offered_ctc": number_in_lakhs_rounded_to_1_decimal,
  "offered_fixed": number_in_lakhs_rounded_to_1_decimal,
  "offered_variable": number_in_lakhs_rounded_to_1_decimal,
  "market_median": number_in_lakhs_rounded_to_1_decimal,
  "market_75th": number_in_lakhs_rounded_to_1_decimal,
  "percent_diff": integer_percentage_difference,
  "assessment": "one blunt sentence — is this above or below market for this specific city and YOE?",
  "breakdown": {
    "base": number_in_lakhs_rounded_to_1_decimal,
    "bonus": number_in_lakhs_rounded_to_1_decimal,
    "stocks_esop": number_in_lakhs_rounded_to_1_decimal,
    "benefits_note": "short string about benefits included"
  },
  "counter_offer_script": "2-3 sentence professional counter-offer script with a specific mathematical justification and target number in ₹Lakhs",
  "red_flags": ["any red flags found in offer (e.g. low fixed pay, toxic clauses)", "else empty array"],
  "strengths": ["strong points about the offer"],
  "market_trend": "one data-driven sentence about hiring trend for this profile in ${city}"
}

Rules:
- PII ANONYMIZATION: Do NOT extract, leak, or mention the candidate's real name, email, or phone number anywhere in your response (including the counter-offer script). Use placeholders like [Candidate Name] if needed.
- Be mathematically precise. Round all Lakh numbers to 1 decimal place.
- Market median must be realistic for India 2026 (look at YOE, city, cert stack).
- If text doesn't contain salary/CTC, set offered_ctc to 0 and note "CTC not found in offer text" in the assessment.
- Do NOT hallucinate data.`

  const text = await callGroq(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    1024,
    0.3,
    true // JSON mode
  )

  const parsed = safeParseJSON(text)
  if (!parsed) {
    throw new Error('Failed to parse analysis results from AI.')
  }
  
  if (parsed.is_valid_offer === false) {
    throw new Error(parsed.rejection_reason || 'This document does not appear to be a valid offer letter.')
  }

  return parsed
}