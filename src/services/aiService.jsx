// ─────────────────────────────────────────────────────────
// aiService.jsx  — Phase 2: JSON mode, no regex parsing
//
// API key lives on the server only (api/groq.js).
// This file never touches the key — safe in browser.
// ─────────────────────────────────────────────────────────

// ── ROI prompt — requests strict JSON output ──────────────
const buildROIPrompt = ({ certName, currentSalary, certCost, hikePercent, isStudent }) => {
  const annualSalary    = currentSalary * 100000
  const hikedSalary     = annualSalary * (1 + hikePercent / 100)
  const annualGain      = hikedSalary - annualSalary
  const breakEvenMonths = annualGain > 0 ? Math.ceil((certCost * 100000) / (annualGain / 12)) : 0
  const fiveYearGain    = annualGain * 5 - certCost * 100000

  const context = isStudent
    ? `STUDENT with no salary, targeting first job in India. Cert: ${certName}. Goal: first offer Rs.4.8L+.`
    : `Salary: Rs.${currentSalary}L/yr → Rs.${(hikedSalary/100000).toFixed(1)}L. Cost: Rs.${certCost}L. Break-even: ${breakEvenMonths} months. 5yr net: Rs.${(fiveYearGain/100000).toFixed(1)}L.`

  return `You are Certify, a brutally honest career advisor for Indian professionals (2026).
${context}
Certification: ${certName || 'General IT Certification'}

Respond with ONLY a valid JSON object — no markdown, no prose, no code fences.

{
  "verdict": "Strong ROI / Moderate ROI / Weak ROI — one sentence with % and timeline",
  "breakEven": "X months — real-world India anchor e.g. = 6 months Pune PG rent",
  "projection": "Rs.X.XL — anchor e.g. = Honda City down payment twice over",
  "demand": [
    "specific Naukri/LinkedIn demand signal with number",
    "top 2 hiring companies in India",
    "YoY growth signal"
  ],
  "risks": [
    "biggest real risk",
    "how to mitigate it"
  ],
  "studentTrack": "${isStudent ? '3 concrete steps + timeline to Rs.4.8L' : ''}",
  "bottomLine": "one punchy action sentence — be direct"
}

Rules: India-specific. Under 260 words total across all fields. No fluff.`
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
const roiFallback = (text) => ({
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
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || err?.error || 'HTTP ' + response.status
    if (response.status === 401) throw new Error('Invalid API key — check GROQ_API_KEY in .env')
    if (response.status === 403) throw new Error('Access denied — check GROQ_API_KEY in .env')
    if (response.status === 429) throw new Error('Rate limit — wait 30 seconds and retry')
    if (response.status === 404) throw new Error('API endpoint not found — run: vercel dev (not npm run dev)')
    if (response.status === 500) throw new Error('Server error — GROQ_API_KEY may not be set in .env')
    throw new Error(msg)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  if (!text) throw new Error('Empty response from AI')
  return text
}

// ── Public exports ────────────────────────────────────────

export const analyzeROI = async ({ certName, currentSalary, certCost, hikePercent, isStudent = false }) => {
  const text   = await callGroq(
    [
      { role: 'system', content: 'You are Certify. Respond ONLY with a valid JSON object. India market 2026.' },
      { role: 'user',   content: buildROIPrompt({ certName, currentSalary, certCost, hikePercent, isStudent }) },
    ],
    700,
    0.65,
    true   // ← JSON mode ON
  )

  const parsed = safeParseJSON(text)
  if (!parsed) return roiFallback(text)

  return {
    verdict:      parsed.verdict      || '',
    breakEven:    parsed.breakEven    || '',
    projection:   parsed.projection   || '',
    demand:       Array.isArray(parsed.demand) ? parsed.demand : [],
    risks:        Array.isArray(parsed.risks)  ? parsed.risks  : [],
    studentTrack: parsed.studentTrack || '',
    bottomLine:   parsed.bottomLine   || '',
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

  const prompt = `You are a strict career domain classifier for a professional certification platform (India 2026).

The user entered this as their target career domain: "${domainInput.trim()}"
${currentRole ? `The user's current role is: "${currentRole.trim()}"` : ''}

Your task:
1. STRICT WHITELIST: Determine if this target domain is a real, recognized professional career field within the IT, Tech, or Corporate sectors (e.g., "Cybersecurity", "Cloud Computing", "Finance", "Data Science", "Project Management", "Marketing", "Healthcare IT", "HR", "Law/Legal Tech" etc.).
2. If it is an out-of-scope domain (e.g., "Medical Surgeon", "Astronaut", "Plumber") or nonsense/gibberish, you MUST reject it by setting "Invalid_Domain": true.
3. If it is valid, normalize it to a clean title-case label.
4. INTENT CLASSIFICATION: Compare the target domain to the current role (if provided). If they are identical or highly related (e.g. Data Analyst -> Data Science), set "Determined_Intent" to "Level_Up". If they are distinct pivots (e.g., Sales -> Cybersecurity), set "Determined_Intent" to "Domain_Pivot".

Respond ONLY with a valid JSON object — no markdown, no prose:
{
  "Invalid_Domain": true or false,
  "normalized": "Clean Title Case Domain Name or empty string if invalid",
  "reason": "One sentence explanation",
  "Determined_Intent": "Level_Up" or "Domain_Pivot"
}

Examples:
- Target: "cybersec", Current: "" → { "Invalid_Domain": false, "normalized": "Cybersecurity", "reason": "Recognized abbreviation of Cybersecurity domain.", "Determined_Intent": "Domain_Pivot" }
- Target: "Surgeon", Current: "" → { "Invalid_Domain": true, "normalized": "", "reason": "Not a Corporate IT or Tech domain.", "Determined_Intent": "Domain_Pivot" }
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
"""
${offerText.substring(0, 6000)}
"""

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