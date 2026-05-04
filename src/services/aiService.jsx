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

  return `You are CertifyROI, a brutally honest career advisor for Indian professionals (2026).
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
      { role: 'system', content: 'You are CertifyROI. Respond ONLY with a valid JSON object. India market 2026.' },
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
      { role: 'system', content: 'You are CertifyROI. Respond ONLY with a valid JSON object. India market 2026.' },
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
export const validateDomain = async (domainInput) => {
  if (!domainInput || !domainInput.trim()) {
    return { isValid: false, normalized: '', reason: 'No domain entered' }
  }

  const prompt = `You are a strict career domain classifier for a professional certification platform (India 2026).

The user entered this as their target career domain: "${domainInput.trim()}"

Your task:
1. Determine if this is a real, recognized professional career field or domain (e.g., "Cybersecurity", "Cloud Computing", "Finance", "Data Science", "Project Management", "Marketing", "Healthcare", "HR", "Law", "Architecture" etc.).
2. If it is valid, normalize it to a clean title-case label.
3. If it is nonsense, gibberish, a random word, an insult, or not a professional domain, mark it invalid.

Respond ONLY with a valid JSON object — no markdown, no prose:
{
  "isValid": true or false,
  "normalized": "Clean Title Case Domain Name or empty string if invalid",
  "reason": "One sentence explanation"
}

Examples:
- "cybersec" → { "isValid": true, "normalized": "Cybersecurity", "reason": "Recognized abbreviation of Cybersecurity domain." }
- "asdfghjkl" → { "isValid": false, "normalized": "", "reason": "Not a recognized professional domain." }
- "rubbish" → { "isValid": false, "normalized": "", "reason": "Not a recognized professional domain." }
- "data analytics" → { "isValid": true, "normalized": "Data & Analytics", "reason": "Recognized data domain." }
`

  try {
    const text = await callGroq(
      [
        { role: 'system', content: 'You are a strict domain validator. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      150,
      0.1,
      true  // JSON mode
    )
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      isValid:    !!parsed.isValid,
      normalized: parsed.normalized || '',
      reason:     parsed.reason || '',
    }
  } catch {
    // If API fails, allow through (fail open — don't block user)
    return { isValid: true, normalized: domainInput.trim(), reason: 'Validation skipped (API unavailable)' }
  }
}