import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Copy, Check, Linkedin, LayoutTemplate } from 'lucide-react'
import { useCanvasTheme } from '../hooks/useCanvasTheme'
import { trackShareCardGenerated } from '../lib/analytics.js'

const FM = "'JetBrains Mono','Commit Mono',monospace"
const FH = "'Plus Jakarta Sans','Bricolage Grotesque',sans-serif"
const FB = "'Inter',sans-serif"

// ── Domain display labels ─────────────────────────────────
var DOMAIN_LABELS = {
  tech:          'Cloud & Tech',
  data:          'Data & AI',
  cybersecurity: 'Cybersecurity',
  management:    'Project Mgmt',
  finance:       'Finance',
  marketing:     'Marketing',
  hr:            'HR & People',
  product:       'Product',
  design:        'UX & Design',
  medical:       'Medical',
  law:           'Law & Compliance',
  architecture:  'Architecture',
  engineering:   'Engineering',
  government:    'Govt & PSU',
  mba:           'MBA & Executive',
  business:      'Business & Ops',
}

// ── Demand colors ─────────────────────────────────────────
var DEMAND_COLORS = {
  'Very High': '#4F7CF8',
  'High':      '#4F7CF8',
  'Medium':    '#94A3B8',
  'Low':       '#94A3B8',
}

// ── Domain accent colors (used for card glow) ─────────────
var DOMAIN_ACCENTS = {
  tech:          ['#4F7CF8', '#4F7CF8'],
  data:          ['#8B5CF6', '#06B6D4'],
  cybersecurity: ['#94A3B8', '#94A3B8'],
  management:    ['#4F7CF8', '#4F7CF8'],
  finance:       ['#4F7CF8', '#94A3B8'],
  marketing:     ['#EC4899', '#94A3B8'],
  hr:            ['#94A3B8', '#4F7CF8'],
  product:       ['#4F7CF8', '#EC4899'],
  design:        ['#EC4899', '#8B5CF6'],
  medical:       ['#4F7CF8', '#06B6D4'],
  law:           ['#94A3B8', '#4F7CF8'],
  architecture:  ['#94A3B8', '#4F7CF8'],
  engineering:   ['#4F7CF8', '#4F7CF8'],
  government:    ['#4F7CF8', '#94A3B8'],
  mba:           ['#4F7CF8', '#94A3B8'],
  business:      ['#4F7CF8', '#4F7CF8'],
}

// ── Rounded rect helper ───────────────────────────────────
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Text wrap helper ──────────────────────────────────────
function wrapLines(ctx, text, maxWidth) {
  var words = text.split(' ')
  var lines = [], line = ''
  words.forEach(function(w) {
    var test = line ? (line + ' ' + w) : w
    if (ctx.measureText(test).width > maxWidth) { if (line) lines.push(line); line = w }
    else { line = test }
  })
  if (line) lines.push(line)
  return lines
}

// ─────────────────────────────────────────────────────────
// VARIANT A — "MY 2026 CERT MOVE"
// Classic announcement. Cert name big, domain + demand pills,
// clean footer. What someone shares when they've decided.
// ─────────────────────────────────────────────────────────
function drawCardA(canvas, opts) {
  var certName = opts.certName || 'Your Certification'
  var domain   = opts.domain   || 'tech'
  var demand   = opts.demand   || 'High'

  var W = 1200, H = 628, SC = 2
  canvas.width = W * SC; canvas.height = H * SC
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  var c = canvas.getContext('2d')
  c.scale(SC, SC)

  var accents  = DOMAIN_ACCENTS[domain] || ['#4F7CF8', '#4F7CF8']
  var accent1  = accents[0]
  var accent2  = accents[1]
  var demColor = DEMAND_COLORS[demand] || '#94A3B8'
  var theme    = opts.theme || {}
  var isDark   = theme.mode !== 'light'

  // ── Background ───────────────────────────────────────────
  var bg = c.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0,   isDark ? '#080E1E' : '#F8FAFC')
  bg.addColorStop(0.6, isDark ? '#0C1628' : '#E2E8F0')
  bg.addColorStop(1,   isDark ? '#060C18' : '#FFFFFF')
  c.fillStyle = bg; c.fillRect(0, 0, W, H)

  // Dot grid — very subtle
  c.fillStyle = 'rgba(148,163,184,0.12)'
  for (var xi = 0; xi <= W; xi += 36) {
    for (var yi = 0; yi <= H; yi += 36) {
      c.beginPath(); c.arc(xi, yi, 1.2, 0, Math.PI * 2); c.fill()
    }
  }

  // Domain-specific radial glow — shifts based on domain color
  var g1 = c.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, 480)
  g1.addColorStop(0,   accent1 + '12')
  g1.addColorStop(0.5, accent1 + '06')
  g1.addColorStop(1,   'transparent')
  c.fillStyle = g1; c.fillRect(0, 0, W, H)

  var g2 = c.createRadialGradient(W * 0.75, H * 0.65, 0, W * 0.75, H * 0.65, 380)
  g2.addColorStop(0,   accent2 + '10')
  g2.addColorStop(1,   'transparent')
  c.fillStyle = g2; c.fillRect(0, 0, W, H)

  // ── Scan lines — very subtle horizontal texture ───────────
  for (var si = 0; si < H; si += 3) {
    c.fillStyle = 'transparent'
    c.fillRect(0, si, W, 1)
  }

  // ── Inset border frame ───────────────────────────────────
  c.strokeStyle = 'rgba(148,163,184,0.12)'
  c.lineWidth = 1
  rr(c, 12, 12, W - 24, H - 24, 6)
  c.stroke()

  // ── Top gradient bar ─────────────────────────────────────
  var topBar = c.createLinearGradient(0, 0, W, 0)
  topBar.addColorStop(0,    accent1)
  topBar.addColorStop(0.5,  accent2)
  topBar.addColorStop(1,    accent1)
  c.fillStyle = topBar; c.fillRect(0, 0, W, 4)

  // ── Top bar glow line ────────────────────────────────────
  var topGlow = c.createLinearGradient(0, 0, W, 0)
  topGlow.addColorStop(0,   accent1 + '00')
  topGlow.addColorStop(0.3, accent1 + '40')
  topGlow.addColorStop(0.7, accent2 + '40')
  topGlow.addColorStop(1,   accent1 + '00')
  c.fillStyle = topGlow; c.fillRect(0, 4, W, 18)

  // ── Logo ─────────────────────────────────────────────────
  var lgGrad = c.createLinearGradient(44, 34, 82, 72)
  lgGrad.addColorStop(0, '#4F7CF8'); lgGrad.addColorStop(1, '#4338CA')
  c.fillStyle = lgGrad; rr(c, 44, 34, 40, 40, 10); c.fill()
  c.fillStyle = 'white'; c.font = 'bold 22px Arial'; c.textAlign = 'center'
  c.fillText('↗', 64, 62)
  c.textAlign = 'left'
  c.fillStyle = 'white'; c.font = 'bold 20px Arial'; c.fillText('Certify', 94, 62)
  var cw = c.measureText('Certify').width
  c.fillStyle = '#4F7CF8'; c.font = 'bold 20px Arial'; c.fillText('ROI', 94 + cw, 62)

  // ── "INDIA · 2026" badge ─────────────────────────────────
  c.font = '11px "Courier New", monospace'
  var bt = 'INDIA · 2026', btw = c.measureText(bt).width
  var bW = btw + 28, bH = 26, bX = W - bW - 44, bY = 36
  c.fillStyle = 'transparent'
  rr(c, bX, bY, bW, bH, 7); c.fill()
  c.strokeStyle = 'transparent'; c.lineWidth = 1
  rr(c, bX, bY, bW, bH, 7); c.stroke()
  c.fillStyle = '#4F7CF8'; c.textAlign = 'center'
  c.fillText(bt, bX + bW / 2, bY + 17)

  // ── Header divider ───────────────────────────────────────
  c.strokeStyle = 'rgba(148,163,184,0.18)'; c.lineWidth = 1
  c.beginPath(); c.moveTo(44, 90); c.lineTo(W - 44, 90); c.stroke()

  // ── Eyebrow ──────────────────────────────────────────────
  var midY = 308
  c.font = '12px "Courier New", monospace'
  c.fillStyle = 'transparent'
  c.textAlign = 'center'
  c.fillText('MY  2026  CERTIFICATION  MOVE', W / 2, midY - 122)

  // Eyebrow decorative dots
  c.fillStyle = accent1 + 'AA'
  ;[-120, -100, -80].forEach(function(ox) {
    c.beginPath(); c.arc(W / 2 + ox * 0, midY - 108, 1.8, 0, Math.PI * 2); c.fill()
  })
  c.fillStyle = accent1 + '80'
  c.beginPath(); c.arc(W / 2, midY - 108, 2.2, 0, Math.PI * 2); c.fill()
  c.fillStyle = accent1 + '40'
  c.beginPath(); c.arc(W / 2 - 14, midY - 108, 1.8, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.arc(W / 2 + 14, midY - 108, 1.8, 0, Math.PI * 2); c.fill()

  // ── Cert name — hero ─────────────────────────────────────
  var cLen = certName.length
  var cSize = cLen > 44 ? 50 : cLen > 34 ? 60 : cLen > 22 ? 72 : cLen > 16 ? 80 : 88
  c.font = 'bold ' + cSize + 'px Arial, sans-serif'
  var cLines = wrapLines(c, certName, 900)
  var lH     = cSize * 1.18

  // Gradient text effect — white → light steel
  var tGrad = c.createLinearGradient(W / 2 - 400, 0, W / 2 + 400, 0)
  tGrad.addColorStop(0,   'transparent')
  tGrad.addColorStop(0.5, '#FFFFFF')
  tGrad.addColorStop(1,   'transparent')

  // Glow under text
  c.shadowColor = accent1 + '55'
  c.shadowBlur  = 32
  c.fillStyle   = tGrad
  c.textAlign   = 'center'
  cLines.forEach(function(line, i) {
    c.fillText(line, W / 2, midY - 40 + i * lH)
  })
  c.shadowBlur = 0

  var afterCert = midY - 40 + cLines.length * lH

  // ── Domain + Demand pills ────────────────────────────────
  var pillY   = afterCert + 38
  var domLabel = DOMAIN_LABELS[domain] || domain
  c.font = '12px "Courier New", monospace'

  var p1t = domLabel.toUpperCase()
  var p2t = (demand.toUpperCase() + ' DEMAND')
  var p1w = c.measureText(p1t).width + 30
  var p2w = c.measureText(p2t).width + 30
  var gap = 16, totalPW = p1w + p2w + gap
  var p1x = W / 2 - totalPW / 2, p2x = p1x + p1w + gap
  var pH = 30, pRad = 15

  // Domain pill
  c.fillStyle = accent1 + '22'; rr(c, p1x, pillY - pH / 2, p1w, pH, pRad); c.fill()
  c.strokeStyle = accent1 + '50'; c.lineWidth = 1; rr(c, p1x, pillY - pH / 2, p1w, pH, pRad); c.stroke()
  c.fillStyle = '#4F7CF8'; c.textAlign = 'center'
  c.fillText(p1t, p1x + p1w / 2, pillY + 5)

  // Demand pill
  c.fillStyle = demColor + '22'; rr(c, p2x, pillY - pH / 2, p2w, pH, pRad); c.fill()
  c.strokeStyle = demColor + '55'; c.lineWidth = 1; rr(c, p2x, pillY - pH / 2, p2w, pH, pRad); c.stroke()
  c.fillStyle = demColor; c.textAlign = 'center'
  c.fillText(p2t, p2x + p2w / 2, pillY + 5)

  // ── Year progress arc — bottom right decorative element ──
  var arcX = W - 80, arcY = H - 80, arcR = 36
  // Track ring
  c.strokeStyle = 'rgba(148,163,184,0.18)'
  c.lineWidth = 3
  c.beginPath(); c.arc(arcX, arcY, arcR, 0, Math.PI * 2); c.stroke()
  // Progress arc (roughly Q1 of year = ~0.25 of circle)
  var arcGrad = c.createLinearGradient(arcX - arcR, arcY, arcX + arcR, arcY)
  arcGrad.addColorStop(0, accent1); arcGrad.addColorStop(1, accent2)
  c.strokeStyle = arcGrad; c.lineWidth = 3
  c.lineCap = 'round'
  c.beginPath()
  c.arc(arcX, arcY, arcR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.22)
  c.stroke()
  c.lineCap = 'butt'
  // "2026" inside arc
  c.font = 'bold 11px "Courier New", monospace'
  c.fillStyle = 'transparent'; c.textAlign = 'center'
  c.fillText('2026', arcX, arcY + 4)

  // ── Footer divider ───────────────────────────────────────
  var fY = H - 58
  c.strokeStyle = 'rgba(148,163,184,0.18)'; c.lineWidth = 1
  c.beginPath(); c.moveTo(44, fY); c.lineTo(W - 130, fY); c.stroke()

  // ── Footer — tagline left ────────────────────────────────
  c.fillStyle = 'transparent'
  c.font = '13px Arial, sans-serif'; c.textAlign = 'left'
  c.fillText('Backed by data. Decided with clarity.', 44, H - 28)

  // ── Footer — URL (not in arc zone) ───────────────────────
  c.fillStyle = 'transparent'
  c.font = 'bold 13px "Courier New", monospace'; c.textAlign = 'right'
  c.fillText('certifyroi.vercel.app', W - 140, H - 28)

  // ── Corner accents ───────────────────────────────────────
  var aLen = 40, aA = 'transparent'
  c.strokeStyle = aA; c.lineWidth = 1.5
  c.beginPath(); c.moveTo(W - 44, 10); c.lineTo(W - 44, 10 + aLen); c.stroke()
  c.beginPath(); c.moveTo(W - 10, 44); c.lineTo(W - 10 - aLen, 44); c.stroke()
  c.beginPath(); c.moveTo(10, H - 44); c.lineTo(10 + aLen, H - 44); c.stroke()
  c.beginPath(); c.moveTo(44, H - 10); c.lineTo(44, H - 10 - aLen); c.stroke()
}

// ─────────────────────────────────────────────────────────
// VARIANT B — "CAREER BADGE"
// More badge-like. Left-aligned layout.
// Looks like a verified credential / achievement card.
// What someone shares after completing — "I mapped this out."
// ─────────────────────────────────────────────────────────
function drawCardB(canvas, opts) {
  var certName = opts.certName || 'Your Certification'
  var domain   = opts.domain   || 'tech'
  var demand   = opts.demand   || 'High'

  var W = 1200, H = 628, SC = 2
  canvas.width = W * SC; canvas.height = H * SC
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  var c = canvas.getContext('2d')
  c.scale(SC, SC)

  var accents  = DOMAIN_ACCENTS[domain] || ['#4F7CF8', '#4F7CF8']
  var accent1  = accents[0]
  var accent2  = accents[1]
  var demColor = DEMAND_COLORS[demand] || '#94A3B8'
  var domLabel = DOMAIN_LABELS[domain] || domain
  var theme    = opts.theme || {}
  var isDark   = theme.mode !== 'light'

  // ── Background ───────────────────────────────────────────
  var bg = c.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, isDark ? '#0A0F20' : '#F3F4F6')
  bg.addColorStop(1, isDark ? '#070B18' : '#FFFFFF')
  c.fillStyle = bg; c.fillRect(0, 0, W, H)

  // Left panel background — slightly lighter
  c.fillStyle = 'rgba(148,163,184,0.08)'
  c.fillRect(0, 0, 420, H)

  // Left panel border line
  c.strokeStyle = 'rgba(148,163,184,0.18)'; c.lineWidth = 1
  c.beginPath(); c.moveTo(420, 0); c.lineTo(420, H); c.stroke()

  // Left panel domain glow
  var lGlow = c.createRadialGradient(210, H / 2, 0, 210, H / 2, 380)
  lGlow.addColorStop(0,   accent1 + '18')
  lGlow.addColorStop(0.6, accent1 + '08')
  lGlow.addColorStop(1,   'transparent')
  c.fillStyle = lGlow; c.fillRect(0, 0, W, H)

  // Right side subtle glow
  var rGlow = c.createRadialGradient(W * 0.7, H * 0.5, 0, W * 0.7, H * 0.5, 360)
  rGlow.addColorStop(0,   accent2 + '0C')
  rGlow.addColorStop(1,   'transparent')
  c.fillStyle = rGlow; c.fillRect(0, 0, W, H)

  // Scan lines
  for (var si = 0; si < H; si += 3) {
    c.fillStyle = 'transparent'; c.fillRect(0, si, W, 1)
  }

  // Inset frame
  c.strokeStyle = 'rgba(148,163,184,0.18)'; c.lineWidth = 1
  rr(c, 12, 12, W - 24, H - 24, 8); c.stroke()

  // ── Left accent bar (vertical) ───────────────────────────
  var lBar = c.createLinearGradient(0, 0, 0, H)
  lBar.addColorStop(0,   accent1 + '00')
  lBar.addColorStop(0.3, accent1)
  lBar.addColorStop(0.7, accent2)
  lBar.addColorStop(1,   accent2 + '00')
  c.fillStyle = lBar; c.fillRect(0, 0, 4, H)

  // ── LEFT PANEL CONTENT ───────────────────────────────────
  var lMid = H / 2

  // Big domain letter — giant background character
  c.font = 'bold 280px Arial'
  c.fillStyle = 'rgba(148,163,184,0.18)'
  c.textAlign = 'center'
  c.fillText(domLabel.charAt(0).toUpperCase(), 210, lMid + 90)

  // Domain label — vertical text simulation via normal text
  c.font = 'bold 13px "Courier New", monospace'
  c.fillStyle = accent1 + 'CC'
  c.textAlign = 'center'
  c.fillText(domLabel.toUpperCase(), 210, lMid - 130)

  // Separator micro line
  c.strokeStyle = accent1 + '40'; c.lineWidth = 1
  c.beginPath(); c.moveTo(130, lMid - 115); c.lineTo(290, lMid - 115); c.stroke()

  // Demand badge — centered in left panel
  var dbW = 140, dbH = 34, dbX = 210 - dbW / 2, dbY = lMid - 100
  c.fillStyle = demColor + '20'; rr(c, dbX, dbY, dbW, dbH, 17); c.fill()
  c.strokeStyle = demColor + '55'; c.lineWidth = 1; rr(c, dbX, dbY, dbW, dbH, 17); c.stroke()
  c.font = '11px "Courier New", monospace'
  c.fillStyle = demColor; c.textAlign = 'center'
  c.fillText(demand.toUpperCase() + ' DEMAND', 210, dbY + 22)

  // Certify badge — bottom of left panel
  var lgGrad = c.createLinearGradient(170, H - 100, 250, H - 50)
  lgGrad.addColorStop(0, '#4F7CF8'); lgGrad.addColorStop(1, '#4338CA')
  c.fillStyle = lgGrad; rr(c, 170, H - 98, 36, 36, 9); c.fill()
  c.fillStyle = 'white'; c.font = 'bold 18px Arial'; c.textAlign = 'center'
  c.fillText('↗', 188, H - 73)
  c.fillStyle = 'transparent'; c.font = '11px Arial'; c.textAlign = 'center'
  c.fillText('Certify', 210, H - 50)

  // ── RIGHT PANEL CONTENT ──────────────────────────────────
  var rx = 470, rw = W - rx - 60
  var ry = H / 2 - 80

  // Eyebrow
  c.font = '11px "Courier New", monospace'
  c.fillStyle = 'transparent'
  c.textAlign = 'left'
  c.fillText('CERT PATH  ·  MAPPED  ·  2026', rx, ry - 40)

  // Eyebrow underline
  c.strokeStyle = 'transparent'; c.lineWidth = 1
  c.beginPath(); c.moveTo(rx, ry - 28); c.lineTo(rx + 300, ry - 28); c.stroke()

  // Cert name
  var cLen = certName.length
  var cSize = cLen > 38 ? 52 : cLen > 28 ? 62 : cLen > 18 ? 72 : 82
  c.font = 'bold ' + cSize + 'px Arial, sans-serif'
  c.textAlign = 'left'
  var cLines = wrapLines(c, certName, rw)
  var lH = cSize * 1.15

  c.shadowColor = accent1 + '40'; c.shadowBlur = 28
  var tGrad = c.createLinearGradient(rx, 0, rx + rw, 0)
  tGrad.addColorStop(0,   '#FFFFFF')
  tGrad.addColorStop(0.6, '#E2E8F0')
  tGrad.addColorStop(1,   '#C7D2FE')
  c.fillStyle = tGrad
  cLines.forEach(function(line, i) {
    c.fillText(line, rx, ry + i * lH)
  })
  c.shadowBlur = 0

  var afterCert = ry + cLines.length * lH

  // Subtitle line
  c.font = '16px Arial, sans-serif'
  c.fillStyle = 'transparent'
  c.textAlign = 'left'
  c.fillText('Analysed · Data-backed · India Market', rx, afterCert + 28)

  // 3 micro verification dots
  var dotsY = afterCert + 60
  var dots = ['Data-backed decision', 'India market 2026', 'certifyroi.vercel.app']
  dots.forEach(function(dot, i) {
    var dx = rx + i * 220
    c.fillStyle = accent1 + 'CC'
    c.beginPath(); c.arc(dx, dotsY, 3, 0, Math.PI * 2); c.fill()
    c.font = '11px "Courier New", monospace'
    c.fillStyle = 'transparent'
    c.textAlign = 'left'
    c.fillText(dot, dx + 10, dotsY + 4)
  })

  // ── Bottom right — INDIA · 2026 badge ───────────────────
  c.font = '11px "Courier New", monospace'
  var bt = 'INDIA · 2026', btw = c.measureText(bt).width
  var bW = btw + 24, bH = 24, bX = W - bW - 24, bY = H - bH - 24
  c.fillStyle = 'transparent'
  rr(c, bX, bY, bW, bH, 6); c.fill()
  c.strokeStyle = 'transparent'; c.lineWidth = 1
  rr(c, bX, bY, bW, bH, 6); c.stroke()
  c.fillStyle = 'transparent'; c.textAlign = 'center'
  c.fillText(bt, bX + bW / 2, bY + 16)
}

// ─────────────────────────────────────────────────────────
// POST TIPS — different copy per variant
// ─────────────────────────────────────────────────────────
var POST_TIPS = {
  A: '"Ran the numbers before deciding. This is my 2026 cert move." — no salary, no bragging. Just looks like a researched career decision. Gets curiosity clicks.',
  B: '"Mapped out my cert path for 2026. Data says go." — feels like a confident professional announcement, not job hunting. Perfect for LinkedIn.',
}

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
function ShareROICard({ certName, domain, demand, name }) {
  var canvasRef             = useRef(null)
  var [open,    setOpen]    = useState(false)
  var [variant, setVariant] = useState('A')
  var [drawing, setDrawing] = useState(false)
  var [done,    setDone]    = useState(false)
  var [copied,  setCopied]  = useState(false)
  var theme                 = useCanvasTheme()

  // ── Draw ─────────────────────────────────────────────────
  var render = useCallback(async function() {
    var canvas = canvasRef.current
    if (!canvas || !certName) return
    setDrawing(true); setDone(false)
    try { await document.fonts.ready } catch(_) {}
    await new Promise(function(r) { return setTimeout(r, 100) })
    var drawFn = variant === 'B' ? drawCardB : drawCardA
    drawFn(canvas, {
      certName: certName,
      domain:   domain || 'tech',
      demand:   demand || 'High',
      name:     name   || '',
      theme,
    })
    setDrawing(false); setDone(true)
  }, [certName, domain, demand, name, variant])

  // Re-render when variant changes
  useEffect(function() {
    if (!open) return
    var id1 = requestAnimationFrame(function() {
      var id2 = requestAnimationFrame(function() { render() })
      return function() { cancelAnimationFrame(id2) }
    })
    return function() { cancelAnimationFrame(id1) }
  }, [open, variant]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Download ──────────────────────────────────────────────
  var download = function() {
    var canvas = canvasRef.current
    if (!canvas || !done) return
    var a = document.createElement('a')
    a.download = 'certifyroi-' + (certName || 'card').replace(/\s+/g, '-').toLowerCase() + '-' + variant.toLowerCase() + '.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
    try { trackShareCardGenerated({ certName, variant, method: 'download' }) } catch (_) {}
  }

  // ── Copy to clipboard ─────────────────────────────────────
  var copyImg = async function() {
    var canvas = canvasRef.current
    if (!canvas || !done) return
    try {
      var blob = await new Promise(function(res, rej) {
        canvas.toBlob(function(b) { return b ? res(b) : rej(new Error('blob')) }, 'image/png')
      })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true); setTimeout(function() { setCopied(false) }, 2500)
      try { trackShareCardGenerated({ certName, variant, method: 'copy' }) } catch (_) {}
    } catch(_) { download() }
  }

  var toggle = function() {
    var next = !open
    setOpen(next)
    if (!next) { setDone(false); setDrawing(false) }
  }

  if (!certName) return null

  return (
    <div style={{ marginTop: '8px' }}>

      {/* ── Trigger button ───────────────────────────────── */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: '11px',
          background: open
            ? 'transparent'
            : 'transparent',
          border: '1px solid ' + (open ? 'transparent' : 'var(--border)'),
          color: open ? 'var(--accent)' : 'var(--text-3)',
          fontSize: '13px', cursor: 'pointer', fontFamily: FH, fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '8px',
          transition: 'all 0.2s', letterSpacing: '-0.01em',
        }}
      >
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: open ? 'transparent' : 'var(--bg)',
          border: '1px solid ' + (open ? 'transparent' : 'var(--border)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.2s',
        }}>
          <Linkedin size={13} color={open ? '#0A66C2' : 'var(--text-4)'} />
        </div>
        Share on LinkedIn
        <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.5, fontFamily: FM, letterSpacing: '0.05em', fontWeight: '400' }}>
          PNG · 1200×628
        </span>
      </motion.button>

      {/* ── Expandable panel ─────────────────────────────── */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{   opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '12px' }}>

              {/* ── Variant switcher ─────────────────────── */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {[
                  { key: 'A', label: 'Cert Move', desc: 'Announcement' },
                  { key: 'B', label: 'Career Badge', desc: 'Credential' },
                ].map(function(v) {
                  var active = variant === v.key
                  return (
                    <motion.button
                      key={v.key}
                      onClick={function() { if (variant !== v.key) { setVariant(v.key); setDone(false) } }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: '9px', cursor: 'pointer',
                        background: active ? 'transparent' : 'transparent',
                        border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
                        display: 'flex', alignItems: 'center', gap: '7px',
                        transition: 'all 0.18s',
                      }}
                    >
                      <LayoutTemplate size={12} color={active ? 'var(--accent)' : 'var(--text-4)'} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: FH, fontWeight: '700', fontSize: '12px', color: active ? 'var(--accent)' : 'var(--text-3)' }}>
                          {v.label}
                        </div>
                        <div style={{ fontFamily: FM, fontSize: '9px', color: 'var(--text-4)', letterSpacing: '0.04em' }}>
                          {v.desc}
                        </div>
                      </div>
                      {active && (
                        <motion.div
                          layoutId="variantActive"
                          style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* ── Loading state ────────────────────────── */}
              {drawing ? (
                <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--linear-blue)' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: FB }}>Building your card...</span>
                </div>
              ) : null}

              {/* ── Canvas ───────────────────────────────── */}
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid var(--border)', display: done ? 'block' : 'none' }}
              />

              {/* ── Dimension label ──────────────────────── */}
              {done ? (
                <div style={{ marginTop: '6px', marginBottom: '10px', fontSize: '10px', color: 'var(--text-4)', fontFamily: FM, textAlign: 'center', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  LinkedIn Post Card · 1200 × 628 px · {variant === 'A' ? 'Cert Move' : 'Career Badge'}
                </div>
              ) : null}

              {/* ── Action buttons ───────────────────────── */}
              {done ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    onClick={download}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#4F7CF8', border: 'none', color: 'white', fontSize: '13px', cursor: 'pointer', fontFamily: FH, fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', letterSpacing: '-0.01em' }}
                  >
                    <Download size={14} /> Download PNG
                  </motion.button>
                  <motion.button
                    onClick={copyImg}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: copied ? 'transparent' : 'transparent', border: '1px solid ' + (copied ? 'transparent' : 'var(--border)'), color: copied ? 'var(--linear-blue)' : 'var(--text-2)', fontSize: '13px', cursor: 'pointer', fontFamily: FH, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'all 0.2s', letterSpacing: '-0.01em' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Image'}
                  </motion.button>
                </div>
              ) : null}

              {/* ── Post tip ─────────────────────────────── */}
              {done ? (
                <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent' }}>
                  <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: FM, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Post tip · {variant === 'A' ? 'Cert Move' : 'Career Badge'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: FB, lineHeight: '1.65' }}>
                    {POST_TIPS[variant]}
                  </div>
                </div>
              ) : null}

            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </div>
  )
}

export default ShareROICard