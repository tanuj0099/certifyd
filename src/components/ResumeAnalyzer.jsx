import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, Sparkles, AlertTriangle,
  ArrowRight, RefreshCw, User, TrendingUp,
  Zap, Target, Star, Clock, ChevronDown, MapPin
} from 'lucide-react'
import { CERTIFICATIONS, CERT_DOMAINS } from '../tokens.js'
import { callGroqForResume } from '../services/aiService.jsx'
import { useJourneyStore } from '../store/useJourneyStore.js'

// ── Font tokens → CSS variables ───────────────────────────
var FM = 'var(--font-mono)'
var FB = 'var(--font-body)'
var FH = 'var(--font-head)'

// ── Color constants ───────────────────────────────────────
var PICTON  = '#51B1E7'
var EMERALD = '#10B981'
var AMBER   = '#F59E0B'
var INDIGO  = '#6366F1'
var VIOLET  = '#818CF8'

// ── Timeline options ──────────────────────────────────────
var TIMELINE_OPTIONS = [
  { id: 'fast',     label: 'Fast track', sub: '1–3 months', desc: 'Quick wins — get results fast' },
  { id: 'medium',   label: 'Standard',   sub: '3–6 months', desc: 'Balanced depth and speed'      },
  { id: 'flexible', label: 'No rush',    sub: 'Open',       desc: 'Best cert regardless of time'  },
]

// ── Domain options ────────────────────────────────────────
var DOMAIN_CHOICES = [
  { id: 'auto',          label: 'Auto-detect',  sub: 'Picks from your profile' },
  { id: 'tech',          label: 'Cloud / Tech', sub: 'AWS, Azure, DevOps'      },
  { id: 'data',          label: 'Data & AI',    sub: 'Analytics, ML, BI'       },
  { id: 'cybersecurity', label: 'Cybersecurity',sub: 'CEH, CISSP, CISM'        },
  { id: 'finance',       label: 'Finance',      sub: 'CFA, CA, CMA, NISM'      },
  { id: 'management',    label: 'Management',   sub: 'PMP, CSM, Six Sigma'     },
  { id: 'marketing',     label: 'Marketing',    sub: 'Google, Meta, HubSpot'   },
  { id: 'hr',            label: 'HR & People',  sub: 'SHRM, Analytics'         },
  { id: 'government',    label: 'Govt / PSU',   sub: 'GATE, IBPS, SSC'         },
  { id: 'medical',       label: 'Medical',      sub: 'DNB, USMLE, ACRP'        },
]

// ── Manual skill tags (for mobile / no-resume flow) ───────
var SKILL_GROUPS = [
  { group: 'Cloud & Infra',  skills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Terraform'] },
  { group: 'Development',    skills: ['Python', 'Java', 'JavaScript', 'Node.js', 'React', 'SQL', 'REST APIs'] },
  { group: 'Data & AI',      skills: ['Pandas', 'Power BI', 'Tableau', 'Excel', 'Machine Learning', 'TensorFlow'] },
  { group: 'Management',     skills: ['Agile', 'Scrum', 'JIRA', 'Stakeholder Mgmt', 'Risk Mgmt', 'Budgeting'] },
  { group: 'Business',       skills: ['Excel', 'PowerPoint', 'SAP', 'Salesforce', 'Google Analytics', 'Tally'] },
  { group: 'Security',       skills: ['Network Security', 'SIEM', 'Penetration Testing', 'OWASP', 'IAM', 'SOC'] },
]

function buildSkillText(skills, role, exp) {
  return [
    'Skills: ' + skills.join(', ') + '.',
    role ? 'Current role: ' + role + '.' : '',
    exp  ? 'Experience: ' + exp + ' years.' : '',
    'Education: Bachelor\'s degree.',
    'Looking for certification recommendations to advance career.',
  ].filter(Boolean).join(' ')
}

// ── Loader steps — defined OUTSIDE component so the array
//    reference is stable and won't re-trigger useEffect ────
var LOADER_STEPS = [
  'Reading your resume...',
  'Matching India job market 2026...',
  'Ranking certification ROI...',
  'Writing your recommendation...',
]

// ── Document validator ────────────────────────────────────
var validateDocument = function(text) {
  var t    = text.toLowerCase()
  var tRaw = text
  var hardRejectRules = [
    { label: 'fee receipt',    patterns: ['fee receipt', 'bill no', 'gst no'],                        min: 2 },
    { label: 'fee receipt',    patterns: ['annual fee', 'total amount', 'amount in words'],           min: 2 },
    { label: 'fee receipt',    patterns: ['billdesk', 'mode of transfer', 'total amount'],            min: 2 },
    { label: 'hall ticket',    patterns: ['hall ticket', 'reporting time', 'invigilator'],            min: 2 },
    { label: 'hall ticket',    patterns: ['examination hall', 'course code', 'reporting time'],       min: 2 },
    { label: 'hall ticket',    patterns: ['reg.no:', 'exam time', 'venue'],                           min: 3 },
    { label: 'question paper', patterns: ['total marks', 'section a', 'section b'],                  min: 3 },
    { label: 'question paper', patterns: ['each carries', 'answer any', 'marks)'],                   min: 2 },
    { label: 'question paper', patterns: ['q1.', 'q2.', 'q3.'],                                      min: 3 },
    { label: 'study notes',    patterns: ['last minute revision', 'formula sheet'],                  min: 1 },
    { label: 'study notes',    patterns: ['master formula', 'traps to avoid'],                       min: 1 },
    { label: 'assignment',     patterns: ['submitted to', 'submitted by', 'assistant professor'],    min: 2 },
    { label: 'technical doc',  patterns: ['select * from', 'sql query', 'database schema'],          min: 1 },
    { label: 'research report',patterns: ['null hypothesis', 'p-value', 'chi-square', 'anova'],      min: 3 },
    { label: 'academic paper', patterns: ['table of contents', 'literature review', 'bibliography'], min: 2 },
  ]
  for (var ri = 0; ri < hardRejectRules.length; ri++) {
    var rule = hardRejectRules[ri]
    var matches = rule.patterns.filter(function(p) { return t.includes(p) })
    if (matches.length >= rule.min) return { isResume: false, rejectedBy: rule.label, score: 0 }
  }
  var score = 0
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(tRaw)) score += 3
  if (/(\+91[\s\-]?)?[6-9]\d{9}/.test(tRaw))                          score += 3
  if (t.includes('linkedin'))                                            score += 3
  var sections = ['education','experience','skills','projects','achievements','certifications','volunteering','leadership','internship','employment history','work experience','extracurricular','awards','publications','languages']
  var sectionHits = sections.filter(function(s) { return t.includes(s) })
  score += sectionHits.length * 1.5
  if (sectionHits.length >= 3) score += 2
  var degrees = ['bba','mba','b.tech','btech','m.tech','mtech','bsc','msc','bca','mca','bcom','mcom','pgdm','diploma','cbse','icse']
  if (degrees.filter(function(d) { return t.includes(d) }).length >= 1) score += 2
  var institutions = ['university','college','institute','iit','nit','bits','vit','srm','manipal','christ','symbiosis','amity']
  if (institutions.filter(function(i) { return t.includes(i) }).length >= 1) score += 1
  if (/\b20\d{2}\s*[–\-]\s*(20\d{2}|present)/i.test(tRaw)) score += 2
  if (/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*'?\d{2,4}/i.test(tRaw)) score += 1
  var actionVerbs = ['managed','led ','developed','built ','handled','coordinated','organized','achieved','launched','mentored','conducted','reduced','increased','collaborated','spearheaded','implemented','delivered','designed','created','trained','secured','boosted']
  var verbHits = actionVerbs.filter(function(v) { return t.includes(v) })
  if (verbHits.length >= 2) score += 2
  if (verbHits.length >= 4) score += 1
  var tools = ['excel','powerpoint','canva','python','java','sql','tableau','figma','aws','azure','docker','git','tally','powerbi']
  if (tools.filter(function(t2) { return t.includes(t2) }).length >= 2) score += 2
  if (text.trim().length < 150) return { isResume: false, rejectedBy: 'too short', score: score }
  return { isResume: score >= 8, score: score, sectionHits: sectionHits, verbHits: verbHits }
}

// ── PDF reader ────────────────────────────────────────────
var readPdfFile = async function(file) {
  if (!window.pdfjsLib) {
    await new Promise(function(resolve, reject) {
      var script = document.createElement('script')
      script.src     = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload  = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  var arrayBuffer = await file.arrayBuffer()
  var pdf         = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  var fullText = ''
  for (var i = 1; i <= pdf.numPages; i++) {
    var page    = await pdf.getPage(i)
    var content = await page.getTextContent()
    fullText += content.items.map(function(item) { return item.str }).join(' ') + '\n'
  }
  return fullText.trim()
}

// ── Prompt builder — requests strict JSON output ─────────
var buildPrompt = function(resumeText, mode, timeline, domainIntent, switchTarget) {
  var timelineNote = timeline === 'fast'
    ? 'IMPORTANT: User needs FAST-TRACK only — certs completable in 1–3 months.'
    : timeline === 'medium'
    ? 'User has 3–6 months. Recommend certs within that window.'
    : 'Flexible timeline — recommend the best certs regardless of duration.'

  var domainNote = switchTarget
    ? 'User wants to SWITCH CAREERS to: "' + switchTarget + '". This is their #1 priority. Find certs for that specific field even if resume points elsewhere.'
    : (domainIntent && domainIntent !== 'auto')
    ? 'User wants to grow in: ' + domainIntent + '. Prioritise certs in that domain.'
    : 'Auto-detect best domain from resume.'

  return 'You are CertifyROI, a career advisor for Indian professionals (2026).\n' +
    'Mode: ' + mode + '\nTimeline: ' + timelineNote + '\nDomain: ' + domainNote + '\n\n' +
    'Resume:\n' + resumeText.slice(0, 2200) + '\n\n' +
    'Respond with ONLY a valid JSON object — no markdown, no prose, no code fences.\n\n' +
    '{\n' +
    '  "name": "full name or empty string",\n' +
    '  "summary": "2-3 sentences on background and biggest career opportunity",\n' +
    '  "city": "city from resume or empty string",\n' +
    '  "domain": "one of: tech|data|cybersecurity|finance|management|marketing|hr|government|medical|business",\n' +
    '  "gaps": ["gap one", "gap two", "gap three"],\n' +
    '  "certs": [\n' +
    '    { "name": "exact cert name", "why": "specific reason tied to resume", "roi": "hike % range", "timeline": "X months", "fastTrack": "one concrete first step" },\n' +
    '    { "name": "exact cert name", "why": "specific reason", "roi": "hike % range", "timeline": "X months", "fastTrack": "one concrete first step" },\n' +
    '    { "name": "exact cert name", "why": "specific reason", "roi": "hike % range", "timeline": "X months", "fastTrack": "one concrete first step" }\n' +
    '  ],\n' +
    '  "immediateAction": "one thing to do this week with platform name",\n' +
    '  "marketInsight": "one sentence on India demand for top cert in their city"\n' +
    '}\n\n' +
    'Rules: India-specific. Under 380 words total. Be specific to their actual resume.'
}

// ── Safe JSON parser — never throws ──────────────────────
var INDIA_CITIES = ['Bangalore','Bengaluru','Hyderabad','Pune','Mumbai','Delhi','Chennai','Kolkata','Noida','Gurgaon','Gurugram','Ahmedabad','Kochi','Vadodara','Jaipur']
var DOMAIN_MAP   = ['tech','data','cybersecurity','finance','management','marketing','hr','government','medical','business']

var safeParseResumeJSON = function(text) {
  try {
    var cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    var obj     = JSON.parse(cleaned)

    // Normalise city to a known Indian city
    var cityRaw  = (obj.city || '').toLowerCase()
    var city     = INDIA_CITIES.find(function(c) { return cityRaw.includes(c.toLowerCase()) }) || ''

    // Normalise domain
    var domainRaw = (obj.domain || '').toLowerCase()
    var domain    = DOMAIN_MAP.find(function(k) { return domainRaw.includes(k) }) || 'business'

    // Ensure certs is an array with primary flag
    var certs = (Array.isArray(obj.certs) ? obj.certs : []).slice(0, 3).map(function(c, i) {
      return {
        name:      String(c.name      || ''),
        why:       String(c.why       || ''),
        roi:       String(c.roi       || ''),
        timeline:  String(c.timeline  || ''),
        fastTrack: String(c.fastTrack || ''),
        primary:   i === 0,
      }
    }).filter(function(c) { return c.name })

    // Trim name to first 2 words
    var nameRaw = String(obj.name || '')
    var name    = (nameRaw && nameRaw !== 'Not found') ? nameRaw.split(' ').slice(0, 2).join(' ') : ''

    return {
      name:            name,
      summary:         String(obj.summary         || ''),
      city:            city,
      domain:          domain,
      gaps:            Array.isArray(obj.gaps) ? obj.gaps.map(String) : [],
      certs:           certs,
      immediateAction: String(obj.immediateAction || ''),
      marketInsight:   String(obj.marketInsight   || ''),
      raw:             text,
      parseError:      false,
    }
  } catch (_) {
    // JSON parse failed — return a safe empty shell so UI doesn't crash
    return {
      name: '', summary: 'Analysis complete — re-run for structured results.',
      city: '', domain: 'business',
      gaps: [], certs: [],
      immediateAction: text.slice(0, 300),
      marketInsight: '',
      raw: text,
      parseError: true,
    }
  }
}

// ── Not-a-resume error ────────────────────────────────────
var NotAResumeError = function({ rejectedBy, onDismiss }) {
  var messages = {
    'fee receipt':    { title: "That's a fee receipt",       desc: "Please upload your CV or resume instead." },
    'hall ticket':    { title: "That's an exam hall ticket",  desc: "Please upload your resume or LinkedIn profile." },
    'question paper': { title: "That's a question paper",     desc: "Please upload your actual resume." },
    'study notes':    { title: "These are study notes",       desc: "Please upload your resume or CV." },
    'assignment':     { title: "That's a college assignment", desc: "Please upload your personal resume." },
    'technical doc':  { title: "That's a technical document", desc: "Please upload your resume instead." },
    'research report':{ title: "That's a research report",    desc: "Please upload your personal resume." },
    'academic paper': { title: "That's an academic paper",    desc: "Please upload your resume." },
    'too short':      { title: "Too short to be a resume",    desc: "Please paste more of your profile - work experience, education, skills." },
    default:          { title: "That doesn't look like a resume", desc: "We need your work experience, education, skills, and contact details." },
  }
  var msg = messages[rejectedBy] || messages.default
  var isTooShort = rejectedBy === 'too short'
  var tone = isTooShort ? '#F59E0B' : '#FCA5A5'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      style={{ padding: '22px', borderRadius: '13px', background: isTooShort ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.07)', border: isTooShort ? '1px solid rgba(245,158,11,0.28)' : '1px solid rgba(239,68,68,0.22)', textAlign: 'center' }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
        <AlertTriangle size={24} color={tone} />
      </div>
      <h3 style={{ fontFamily: FH, fontWeight: '800', fontSize: '15px', color: tone, marginBottom: '7px' }}>{msg.title}</h3>
      <p style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: FB, lineHeight: '1.6', marginBottom: '14px' }}>{msg.desc}</p>
      {/* FIX: onDismiss only clears rejection + fileName, NOT the textarea text.
          Previously called clearAll() which wiped pasted text the user would need to retype. */}
      <button
        onClick={onDismiss}
        style={{ padding: '8px 18px', borderRadius: '8px', background: isTooShort ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', border: isTooShort ? '1px solid rgba(245,158,11,0.28)' : '1px solid rgba(239,68,68,0.25)', color: tone, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FH }}
      >
        Try a different file
      </button>
    </motion.div>
  )
}

// ── Clean loader ──────────────────────────────────────────
// LOADER_STEPS moved above to module scope — stable reference, no useEffect re-fires.
var CleanLoader = function() {
  var [step, setStep] = useState(0)

  useEffect(function() {
    var timers = LOADER_STEPS.map(function(_, i) {
      return setTimeout(function() { setStep(i) }, i * 1000)
    })
    return function() { timers.forEach(clearTimeout) }
  }, []) // stable — LOADER_STEPS is module-level constant

  return (
    <div style={{ padding: '22px', borderRadius: '13px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
          style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(81,177,231,0.2)', borderTopColor: PICTON, flexShrink: 0 }}
        />
        <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analysing</span>
        <span style={{ marginLeft: 'auto', fontFamily: FM, fontSize: '11px', color: PICTON, fontWeight: '700' }}>
          {Math.round(((step + 1) / LOADER_STEPS.length) * 100)}%
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -7 }}
          transition={{ duration: 0.28 }}
          style={{ fontFamily: FH, fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '18px', letterSpacing: '-0.02em' }}
        >
          {LOADER_STEPS[step]}
        </motion.div>
      </AnimatePresence>
      <div style={{ height: '3px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: Math.round(((step + 1) / LOADER_STEPS.length) * 100) + '%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg,' + PICTON + ',' + VIOLET + ')', borderRadius: '2px' }}
        />
      </div>
    </div>
  )
}

// ── Preferences panel ─────────────────────────────────────
var PreferencesPanel = function({ timeline, onTimeline, domainIntent, onDomain, mode, switchTarget }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>

      {/* Timeline */}
      <div>
        <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={10} />
          How soon do you need results?
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TIMELINE_OPTIONS.map(function(opt) {
            var active = timeline === opt.id
            return (
              <button
                key={opt.id}
                onClick={function() { onTimeline(opt.id) }}
                style={{
                  flex: '1', minWidth: '100px',
                  padding: '11px 12px', borderRadius: '10px',
                  background: active ? INDIGO + '14' : 'var(--surface)',
                  border: '1px solid ' + (active ? INDIGO + '40' : 'var(--border)'),
                  color: active ? VIOLET : 'var(--text-3)',
                  cursor: 'pointer', transition: 'all 0.16s',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '13px', fontFamily: FH, fontWeight: active ? '700' : '500' }}>{opt.label}</span>
                <span style={{ fontSize: '10px', fontFamily: FM, color: active ? VIOLET + 'AA' : 'var(--text-4)' }}>{opt.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Domain — show if not switcher */}
      {mode !== 'switcher' && (
        <div>
          <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '9px' }}>
            Which domain are you targeting?
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {DOMAIN_CHOICES.map(function(d) {
              var active = domainIntent === d.id
              return (
                <button
                  key={d.id}
                  onClick={function() { onDomain(d.id) }}
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    background: active ? INDIGO + '14' : 'transparent',
                    border: '1px solid ' + (active ? INDIGO + '40' : 'var(--border)'),
                    color: active ? VIOLET : 'var(--text-4)',
                    fontSize: '12px', fontFamily: FB,
                    fontWeight: active ? '600' : '400',
                    cursor: 'pointer', transition: 'all 0.14s',
                  }}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Switcher: show their chosen domain as a badge */}
      {mode === 'switcher' && switchTarget && (
        <div style={{ padding: '10px 14px', borderRadius: '9px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: AMBER, fontFamily: FM, letterSpacing: '0.04em', fontWeight: '700' }}>Target domain:</span>
          <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '12px', color: AMBER, fontFamily: FH, fontWeight: '700' }}>
            {DOMAIN_CHOICES.find(function(d) { return d.id === switchTarget })?.label || switchTarget}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: FB, marginLeft: '4px' }}>will be prioritised</span>
        </div>
      )}

      <div style={{ height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

// ── PersonalisedHero ──────────────────────────────────────
var PersonalisedHero = function({ name, city, domain, primaryCert, mode }) {
  var [phase, setPhase] = useState(0)

  useEffect(function() {
    var t1 = setTimeout(function() { setPhase(1) }, 600)
    var t2 = setTimeout(function() { setPhase(2) }, 1200)
    return function() { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  var domainLabel = CERT_DOMAINS.find(function(d) { return d.id === domain })?.label || domain
  var firstName   = name ? name.split(' ')[0] : ''
  var intro = firstName
    ? firstName + ', out of 103 certifications analysed for ' + (city ? 'a professional in ' + city : 'your profile') + ' right now —'
    : 'For a ' + (mode === 'student' ? 'student' : mode === 'switcher' ? 'career switcher' : 'professional') + ' in ' + domainLabel + ' right now —'
  var callout = firstName ? 'this is your move.' : 'one cert stands clearly above the rest.'

  return (
    <div style={{ marginBottom: '22px' }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '1px', background: 'linear-gradient(90deg,' + INDIGO + '55,' + EMERALD + '55,transparent)', marginBottom: '18px', transformOrigin: 'left' }}
      />
      {phase >= 0 && (
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ fontFamily: FM, fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px', lineHeight: 1.6 }}
        >
          {intro}
        </motion.p>
      )}
      {phase >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: '14px' }}
        >
          <div style={{ fontFamily: FH, fontWeight: '800', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
            <span style={{ fontSize: 'clamp(20px, 4.5vw, 30px)', color: 'var(--text)' }}>
              {callout.split(' ').slice(0, -1).join(' ')}{' '}
            </span>
            <span style={{ fontSize: 'clamp(20px, 4.5vw, 30px)', background: 'linear-gradient(135deg,' + EMERALD + ',' + PICTON + ',' + VIOLET + ')', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {callout.split(' ').at(-1)}
            </span>
          </div>
        </motion.div>
      )}
      {phase >= 2 && primaryCert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <PrimaryCertHero cert={primaryCert} />
        </motion.div>
      )}
    </div>
  )
}

// ── PrimaryCertHero ───────────────────────────────────────
var PrimaryCertHero = function({ cert }) {
  var [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={function() { setHovered(true) }}
      onMouseLeave={function() { setHovered(false) }}
      style={{
        position: 'relative', borderRadius: '13px', overflow: 'hidden',
        border: '1px solid ' + (hovered ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.22)'),
        background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(81,177,231,0.04), rgba(99,102,241,0.06))',
        padding: '18px',
        boxShadow: hovered ? '0 0 24px rgba(16,185,129,0.12), 0 4px 20px rgba(0,0,0,0.14)' : '0 2px 10px rgba(0,0,0,0.08)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,' + EMERALD + '70,' + PICTON + '70,transparent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star size={12} color={EMERALD} fill={EMERALD} />
          <span style={{ fontFamily: FM, fontSize: '9px', color: EMERALD, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700' }}>Primary Move</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <span style={{ fontFamily: FM, fontSize: '9px', padding: '3px 7px', borderRadius: '5px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: EMERALD }}>+{cert.roi}</span>
          <span style={{ fontFamily: FM, fontSize: '9px', padding: '3px 7px', borderRadius: '5px', background: 'rgba(81,177,231,0.12)', border: '1px solid rgba(81,177,231,0.22)', color: PICTON }}>{cert.timeline}</span>
        </div>
      </div>
      <h2 style={{ fontFamily: FH, fontWeight: '800', fontSize: 'clamp(16px, 3.5vw, 23px)', color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '8px' }}>
        {cert.name}
      </h2>
      <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.65, marginBottom: '12px' }}>
        {cert.why}
      </p>
      {cert.fastTrack && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '9px 11px', borderRadius: '8px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.14)' }}>
          <Zap size={11} color={VIOLET} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontFamily: FM, fontSize: '8px', color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>This Week</div>
            <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{cert.fastTrack}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CertLeaderboardRow ────────────────────────────────────
var CertLeaderboardRow = function({ cert, rank, onSelect, mode }) {
  var [hovered, setHovered] = useState(false)
  var col = rank === 2 ? PICTON : VIOLET

  // Switcher: parse AI-returned timeline string to detect over-8-month certs
  var exceedsSwitcherLimit = false
  if (mode === 'switcher' && cert.timeline) {
    var monthMatch = cert.timeline.match(/(\d+)/)
    if (monthMatch) exceedsSwitcherLimit = parseInt(monthMatch[1], 10) > 8
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: exceedsSwitcherLimit ? 0.45 : 1, x: 0 }}
      transition={{ duration: 0.3, delay: (rank - 2) * 0.1 }}
      onMouseEnter={function() { setHovered(true) }}
      onMouseLeave={function() { setHovered(false) }}
      onClick={function() { if (onSelect && !exceedsSwitcherLimit) onSelect(cert.name) }}
      style={{
        display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 13px',
        borderRadius: '10px',
        border: '1px solid ' + (exceedsSwitcherLimit ? 'rgba(245,158,11,0.25)' : hovered ? col + '33' : 'var(--border)'),
        background: exceedsSwitcherLimit ? 'rgba(245,158,11,0.04)' : hovered ? col + '06' : 'var(--surface)',
        cursor: onSelect && !exceedsSwitcherLimit ? 'pointer' : 'default',
        transition: 'all 0.15s', marginBottom: '6px',
        filter: exceedsSwitcherLimit ? 'grayscale(0.4)' : 'none',
      }}
    >
      <div style={{ width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0, background: col + '12', border: '1px solid ' + col + '25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: FM, fontSize: '10px', fontWeight: '700', color: col }}>#{rank}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FH, fontWeight: '700', fontSize: '13px', color: 'var(--text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cert.name}</div>
        <div style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-4)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{cert.why}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
        {exceedsSwitcherLimit ? (
          <span style={{ fontFamily: FM, fontSize: '9px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: AMBER, whiteSpace: 'nowrap' }}>
            Exceeds 8-mo window
          </span>
        ) : (
          <span style={{ fontFamily: FM, fontSize: '11px', fontWeight: '700', color: EMERALD }}>+{cert.roi}</span>
        )}
        <span style={{ fontFamily: FM, fontSize: '10px', color: 'var(--text-4)' }}>{cert.timeline}</span>
      </div>
      {!exceedsSwitcherLimit && (
        <motion.div animate={{ x: hovered ? 3 : 0 }} transition={{ duration: 0.13 }}>
          <ArrowRight size={13} color={hovered ? col : 'var(--text-4)'} />
        </motion.div>
      )}
    </motion.div>
  )
}

// ── ResultDisplay ─────────────────────────────────────────
var ResultDisplay = function({ result, onCertSelected, mode, onClear }) {
  var [showOtherCerts, setShowOtherCerts] = useState(false)
  var primaryCert = result.certs[0]
  var otherCerts  = result.certs.slice(1)
  var firstName   = result.name ? result.name.split(' ')[0] : ''

  var handleSelect = useCallback(function(certName) {
    if (onCertSelected) onCertSelected(certName, result.city, result.domain, result.name)
  }, [onCertSelected, result])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PersonalisedHero name={result.name} city={result.city} domain={result.domain} primaryCert={primaryCert} mode={mode} />

      {primaryCert && onCertSelected && (
        <motion.button
          onClick={function() { handleSelect(primaryCert.name) }}
          initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.35 }}
          whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '14px 18px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,' + EMERALD + ',#0DA271)', color: 'white', fontSize: '14px', fontWeight: '800', fontFamily: FH, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', boxShadow: '0 5px 20px rgba(16,185,129,0.28)', marginBottom: '16px' }}
        >
          <TrendingUp size={14} />
          Calculate ROI for {primaryCert.name.split(' ').slice(0, 3).join(' ')}
          <ArrowRight size={13} />
        </motion.button>
      )}

      {/* Profile summary — plain border, no NeonCard */}
      {result.summary && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.35 }}
          style={{ marginBottom: '14px' }}
        >
          <div style={{
            borderRadius: '11px',
            border: '1px solid ' + PICTON + '25',
            background: PICTON + '08',
            padding: '13px 15px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <User size={11} color={PICTON} />
              <span style={{ fontFamily: FM, fontSize: '9px', color: PICTON, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {firstName ? 'Profile — ' + firstName.toUpperCase() : 'Profile'}
              </span>
              {result.city && (
                <span style={{ marginLeft: 'auto', fontFamily: FM, fontSize: '9px', padding: '2px 7px', borderRadius: '5px', background: PICTON + '14', color: PICTON, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {/* FIX: 📍 emoji → MapPin icon */}
                  <MapPin size={9} color={PICTON} />
                  {result.city}
                </span>
              )}
            </div>
            <p style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
          </div>
        </motion.div>
      )}

      {result.gaps?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0, duration: 0.35 }}
          style={{ marginBottom: '14px' }}
        >
          <div style={{ fontFamily: FM, fontSize: '9px', color: AMBER, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={10} color={AMBER} /> Gaps to close
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {result.gaps.map(function(gap, i) {
              return (
                <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', padding: '8px 11px', borderRadius: '8px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.13)' }}>
                  <span style={{ fontFamily: FM, fontSize: '10px', color: AMBER, flexShrink: 0, marginTop: '1px' }}>0{i+1}</span>
                  <span style={{ fontFamily: FB, fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>{gap}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {otherCerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2, duration: 0.35 }}
          style={{ marginBottom: '14px' }}
        >
          <button
            onClick={function() { setShowOtherCerts(function(v) { return !v }) }}
            style={{ width: '100%', padding: '9px 13px', borderRadius: '9px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-4)', fontFamily: FM, fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showOtherCerts ? '8px' : '0' }}
          >
            <span>Other options ({otherCerts.length} more)</span>
            {/* FIX: ▾ text char → ChevronDown icon — consistent with lucide icon system */}
            <motion.span
              animate={{ rotate: showOtherCerts ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-flex' }}
            >
              <ChevronDown size={12} />
            </motion.span>
          </button>
          <AnimatePresence>
            {showOtherCerts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden' }}
              >
                {otherCerts.map(function(cert, i) {
                  return <CertLeaderboardRow key={i} cert={cert} rank={i + 2} mode={mode} onSelect={onCertSelected ? handleSelect : null} />
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* "Do this week" — plain border, no NeonCard */}
      {result.immediateAction && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, duration: 0.35 }}
          style={{ marginBottom: '11px' }}
        >
          <div style={{
            borderRadius: '10px',
            border: '1px solid ' + EMERALD + '25',
            background: EMERALD + '08',
            padding: '12px 14px',
            display: 'flex', gap: '9px', alignItems: 'flex-start',
          }}>
            <Target size={13} color={EMERALD} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontFamily: FM, fontSize: '9px', color: EMERALD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {firstName ? firstName + "'s action this week" : 'Do this week'}
              </div>
              <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65 }}>{result.immediateAction}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Market insight — FIX: 📊 emoji → TrendingUp icon */}
      {result.marketInsight && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}
          style={{ padding: '11px 13px', borderRadius: '10px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}
        >
          <TrendingUp size={13} color={VIOLET} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontFamily: FM, fontSize: '9px', color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Market Insight</div>
            <div style={{ fontFamily: FB, fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6 }}>{result.marketInsight}</div>
          </div>
        </motion.div>
      )}

      <motion.button
        onClick={onClear}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-4)', fontSize: '13px', fontFamily: FH, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.15s' }}
        onMouseEnter={function(e) { e.currentTarget.style.borderColor = PICTON + '33'; e.currentTarget.style.color = PICTON }}
        onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-4)' }}
      >
        <RefreshCw size={13} /> Upload a different resume
      </motion.button>
    </motion.div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
var ResumeAnalyzer = function({ mode, onCertSelected }) {
  mode = mode || 'professional'

  var [text,         setText]         = useState('')
  var [fileName,     setFileName]     = useState('')
  var [loading,      setLoading]      = useState(false)
  var [result,       setResult]       = useState(null)
  var [error,        setError]        = useState(null)
  var [rejection,    setRejection]    = useState(null)
  var [dragging,     setDragging]     = useState(false)
  var [pdfLoading,   setPdfLoading]   = useState(false)
  var [textReady,    setTextReady]    = useState(true)    // false while PDF is still extracting
  var [timeline,     setTimeline]     = useState('flexible')
  var [domainIntent, setDomainIntent] = useState('auto')
  var [inputMode,    setInputMode]    = useState('upload')   // 'upload' | 'skills'
  var [pickedSkills, setPickedSkills] = useState([])
  var [skillRole,    setSkillRole]    = useState('')
  var [skillExp,     setSkillExp]     = useState('')
  var fileRef = useRef(null)

  // switchTarget — read from Zustand store (no more localStorage)
  var switchTarget = useJourneyStore(function(s) {
    return mode === 'switcher' ? (s.resumeDomain || null) : null
  })

  var hasFile   = !!fileName
  var hasResult = !!result

  var readFile = async function(file) {
    if (!file) return
    var ext = file.name.split('.').pop().toLowerCase()
    setError(null); setRejection(null)
    if (ext === 'pdf') {
      // OPTIMISTIC: accept file immediately, extract in background
      setFileName(file.name); setText(''); setPdfLoading(true); setTextReady(false)
      try {
        var extracted = await readPdfFile(file)
        if (!extracted || !extracted.trim()) {
          setFileName('')
          setError('Could not extract text from this PDF. Please paste your resume below.')
          setTextReady(true)
          return
        }
        setText(extracted)
        setTextReady(true)
      } catch(e) {
        setFileName('')
        setError('PDF parsing failed. Please paste your resume text below.')
        setTextReady(true)
      } finally {
        setPdfLoading(false)
      }
      return
    }
    setFileName(file.name); setText(''); setTextReady(false)
    var reader = new FileReader()
    reader.onload  = function(e) { setText(e.target.result || ''); setTextReady(true) }
    reader.onerror = function()  { setError('Could not read file. Try pasting text instead.'); setFileName(''); setTextReady(true) }
    reader.readAsText(file)
  }

  var handleDrop = function(e) { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]) }

  var clearAll = function() {
    setText(''); setFileName(''); setResult(null); setError(null); setRejection(null); setTextReady(true)
  }

  // FIX: separate dismiss-rejection from clear-all.
  // On rejection dismiss, only clear the rejection + file — NOT the pasted text.
  // If a user pasted text that failed, they shouldn't have to re-paste after dismissing.
  var dismissRejection = function() {
    setRejection(null)
    setFileName('')   // clear any file reference
    // setText preserved intentionally
  }

  var handleAnalyse = async function() {
    // If PDF is still extracting, wait — optimistic UI means button is active but needs text
    if (!textReady) { setError('Still reading your file — please wait a moment and try again.'); return }
    // If skill-tag mode: synthesize text from selected skills
    var analyseText = text
    if (inputMode === 'skills') {
      if (pickedSkills.length < 3) { setError('Pick at least 3 skills to get a recommendation'); return }
      analyseText = buildSkillText(pickedSkills, skillRole, skillExp)
      setText(analyseText)
    }
    if (!analyseText.trim()) { setError('Please upload a file, paste your resume, or tag your skills'); return }
    // Skip document validation for synthesized skill text
    if (inputMode !== 'skills') {
      var validation = validateDocument(analyseText)
      if (!validation.isResume) { setRejection(validation.rejectedBy || 'default'); return }
    }
    setLoading(true); setResult(null); setError(null); setRejection(null)
    try {
      var safeText = analyseText.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').slice(0, 2200).trim()
      var raw    = await callGroqForResume(null, buildPrompt(safeText, mode, timeline, domainIntent, switchTarget))
      if (!raw || raw.length < 30) throw new Error('Empty response — try again')
      var parsed = safeParseResumeJSON(raw)
      setResult(parsed.certs?.length ? parsed : {
        ...parsed,
        summary: parsed.summary || 'Analysis complete',
        immediateAction: parsed.immediateAction || parsed.raw?.slice(0, 300) || '',
      })
    } catch(e) {
      console.error('Resume AI error:', e)
      if (e.message?.includes('not configured') || e.message?.includes('500') || e.message?.includes('404') || e.message === 'NO_KEY') {
        setResult({
          name: 'Demo', summary: 'AI not connected. Check GROQ_API_KEY in Vercel environment variables.',
          city: 'Bangalore', domain: 'tech',
          gaps: ['No hands-on cloud portfolio projects', 'Missing architecture-level certifications', 'Limited DevOps exposure'],
          certs: [
            { name: 'AWS Solutions Architect', why: 'Highest ROI for Indian tech professionals — 2,400+ open roles on Naukri', roi: '30-40%', timeline: '3 months', fastTrack: 'Register free on AWS Skill Builder today', primary: true },
            { name: 'Google Data Analytics',   why: 'High demand, entry-friendly', roi: '20-28%', timeline: '4 months', fastTrack: 'Enrol on Coursera — first 7 days free', primary: false },
            { name: 'PMP Certification',       why: 'Best path to senior management', roi: '25-30%', timeline: '6 months', fastTrack: "Download PMI's free Exam Content Outline", primary: false },
          ],
          immediateAction: 'Check Vercel → Settings → Environment Variables → ensure GROQ_API_KEY is set.',
          marketInsight: 'AWS certified professionals in Bangalore command 35% higher salaries — 2,400+ active roles on Naukri as of March 2026.',
          raw: '(demo)',
        })
      } else {
        setError(e.message || 'Unknown error.')
      }
    } finally { setLoading(false) }
  }

  // Toggle a skill in/out of the selection
  var toggleSkill = function(skill) {
    setPickedSkills(function(prev) {
      return prev.includes(skill) ? prev.filter(function(s) { return s !== skill }) : [...prev, skill]
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {!hasResult && (
        <PreferencesPanel
          timeline={timeline}
          onTimeline={setTimeline}
          domainIntent={domainIntent}
          onDomain={setDomainIntent}
          mode={mode}
          switchTarget={switchTarget}
        />
      )}

      {/* ── Input mode tab switcher ─────────────────────── */}
      {!hasResult && (
        <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[
            { id: 'upload', label: '↑ Upload Resume',   sub: 'PDF / DOC / paste' },
            { id: 'skills', label: '✦ Tag Your Skills', sub: 'No resume? Use this' },
          ].map(function(tab) {
            var active = inputMode === tab.id
            return (
              <button
                key={tab.id}
                onClick={function() { setInputMode(tab.id); setError(null) }}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '7px', cursor: 'pointer',
                  background: active ? 'var(--bg)' : 'transparent',
                  border: active ? '1px solid var(--border)' : '1px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-4)',
                  fontFamily: FH, fontWeight: active ? '700' : '400',
                  fontSize: '12px', transition: 'all 0.18s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: FM }}>{tab.sub}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Skill tag grid (mobile-first fallback) ───────── */}
      <AnimatePresence>
        {!hasResult && inputMode === 'skills' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px', borderRadius: '11px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
                Tag skills you already have — pick at least 3
                {pickedSkills.length > 0 && <span style={{ color: EMERALD, marginLeft: '8px' }}>{pickedSkills.length} selected</span>}
              </div>

              {/* Optional role + exp context */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <input
                  value={skillRole} onChange={function(e) { setSkillRole(e.target.value) }}
                  placeholder="Current role (optional)"
                  style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12px', fontFamily: FB, outline: 'none', boxSizing: 'border-box' }}
                />
                <input
                  value={skillExp} onChange={function(e) { setSkillExp(e.target.value) }}
                  placeholder="Years of exp (optional)"
                  style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12px', fontFamily: FB, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {SKILL_GROUPS.map(function(group) {
                return (
                  <div key={group.group} style={{ marginBottom: '12px' }}>
                    <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{group.group}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {group.skills.map(function(skill) {
                        var picked = pickedSkills.includes(skill)
                        return (
                          <button
                            key={skill}
                            onClick={function() { toggleSkill(skill) }}
                            style={{
                              padding: '5px 11px', borderRadius: '99px', cursor: 'pointer',
                              background: picked ? INDIGO + '18' : 'transparent',
                              border: '1px solid ' + (picked ? INDIGO + '50' : 'var(--border)'),
                              color: picked ? VIOLET : 'var(--text-3)',
                              fontSize: '12px', fontFamily: FB,
                              fontWeight: picked ? '700' : '400',
                              transition: 'all 0.13s',
                            }}
                          >
                            {skill}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {pickedSkills.length > 0 && (
                <button
                  onClick={function() { setPickedSkills([]) }}
                  style={{ fontSize: '11px', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, marginTop: '4px' }}
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload zone — only shown in upload mode */}
      <AnimatePresence>
        {!hasResult && !text.trim() && inputMode === 'upload' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderRadius: '11px',
              border: '1.5px dashed ' + (dragging ? PICTON : hasFile ? EMERALD : 'var(--border)'),
              background: dragging ? PICTON + '08' : hasFile ? EMERALD + '06' : 'var(--surface)',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div
                onDragOver={function(e) { e.preventDefault(); setDragging(true) }}
                onDragLeave={function() { setDragging(false) }}
                onDrop={handleDrop}
                onClick={function() { if (!hasFile) fileRef.current?.click() }}
                style={{ padding: '22px', cursor: hasFile ? 'default' : 'pointer', textAlign: 'center' }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={function(e) { readFile(e.target.files[0]) }}
                />
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
                    <button
                      onClick={function(e) { e.stopPropagation(); clearAll() }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* FIX: static icon — removed animate={{ y: [0,-5,0] }} bounce animation */}
                    <Upload size={22} color="var(--text-4)" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '14px', color: 'var(--text-3)', fontFamily: FH, fontWeight: '700', marginBottom: '4px' }}>
                      Drop resume or <span style={{ color: PICTON, textDecoration: 'underline' }}>browse</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: FB }}>PDF · TXT · DOC accepted</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Or divider */}
      {!hasFile && !text.trim() && !hasResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FM }}>or paste below</span>
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
              value={text}
              onChange={function(e) { setText(e.target.value) }}
              placeholder="Paste your resume, LinkedIn About section, or work experience here. Include your city for better results."
              rows={6}
              style={{ width: '100%', padding: '14px', background: 'var(--bg)', border: '1px solid ' + (text.trim() ? PICTON + '44' : 'var(--border)'), borderRadius: '11px', color: 'var(--text)', fontSize: '13px', fontFamily: FB, outline: 'none', resize: 'vertical', lineHeight: '1.6', transition: 'border-color 0.18s', boxSizing: 'border-box' }}
            />
            {text.trim() && (
              <>
                <button onClick={clearAll} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer' }}>
                  <X size={13} />
                </button>
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '10px', color: 'var(--text-4)', fontFamily: FM }}>{text.length}c</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection — FIX: onDismiss calls dismissRejection() not clearAll().
          Text is preserved so user doesn't re-paste after a validation failure. */}
      <AnimatePresence>
        {rejection && (
          <NotAResumeError
            rejectedBy={rejection}
            onDismiss={dismissRejection}
          />
        )}
      </AnimatePresence>

      {/* Analyse button — enabled as soon as file is selected (optimistic) */}
      {!hasResult && !loading && (
        <motion.button
          onClick={handleAnalyse}
          disabled={!text.trim() && !hasFile && !(inputMode === 'skills' && pickedSkills.length >= 3)}
          whileHover={(text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3)) ? { scale: 1.01, y: -1 } : {}}
          whileTap={(text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3)) ? { scale: 0.98 } : {}}
          style={{
            width: '100%', fontSize: '15px', padding: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
            background: (text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3))
              ? 'linear-gradient(135deg,' + PICTON + ',#3B8CC7)'
              : 'transparent',
            border: (text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3)) ? 'none' : '1px solid var(--border)',
            borderRadius: '12px',
            color: (text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3)) ? 'white' : 'var(--text-4)',
            fontFamily: FH, fontWeight: '800',
            cursor: (text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3)) ? 'pointer' : 'not-allowed',
            boxShadow: (text.trim() || hasFile || (inputMode === 'skills' && pickedSkills.length >= 3)) ? '0 4px 16px rgba(81,177,231,0.25)' : 'none',
            letterSpacing: '-0.015em',
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          {pdfLoading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
              Analyse Profile
              <span style={{ fontSize: '11px', opacity: 0.75, marginLeft: '4px' }}>(reading file...)</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Analyse Profile
            </>
          )}
        </motion.button>
      )}

      {loading && <CleanLoader />}

      {error && (
        <div style={{ padding: '11px 13px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#FCA5A5', display: 'flex', gap: '8px', fontFamily: FB }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} /><span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <ResultDisplay result={result} onCertSelected={onCertSelected} mode={mode} onClear={clearAll} />
        )}
      </AnimatePresence>

    </div>
  )
}

export default ResumeAnalyzer
