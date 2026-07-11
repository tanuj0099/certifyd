# Certifyd — India's Tech Career Intelligence Engine ⚡

**Certifyd** is a real-time data and decision engine built specifically for India's tech ecosystem. Calculate exact certification ROI, benchmark career switch paths, simulate salary hikes, and safely audit offer letters with PII-protected AI analysis.

---

## 🔥 Key Capabilities

- **3D Certification ROI & Payback Engine** — Dynamic financial modeling that calculates exact break-even timelines, 5-year CTC delta gains, and Indian tech market payback horizons.
- **Offer Letter Risk & Equity Analyzer** — Privacy-first offer evaluation featuring nested-object PII sanitization before AI inference.
- **Live Market Pulse & Salary Benchmarks** — Calibrated against verified Indian engineering compensation tiers (Bengaluru, Hyderabad, NCR, Pune).
- **Career Switch Simulator & Hike Verifier** — Interactive decision matrices for transitioning across roles, tech stacks, and seniority levels.
- **Enterprise Security & Idempotent Architecture** — Zero-trust Supabase RLS policies, automated soft deletes, and Cloudflare Turnstile anti-bot verification.

---

## ⚡ Quick Start

```bash
# 1. Clone & install dependencies
git clone https://github.com/tanuj0099/certifyroi.git
cd certifyroi
npm install

# 2. Configure environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key

# 3. Launch local development server
npm run dev
# → Application live at http://localhost:3000
```

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Core Application** | Next.js 16 App Router · React 19 · Node.js |
| **Interactive UI & Motion** | Vanilla CSS Tokens · Framer Motion · Canvas Graphics |
| **Backend & Database** | Supabase PostgreSQL · Row Level Security (RLS) · Idempotent RPCs |
| **AI Intelligence Layer** | Server-side Groq Llama 3 Inference Pipelines |
| **Security & Observability** | Cloudflare Turnstile · Deep PII Scanners · Sentry · Vercel Analytics |

---

## 📁 System Structure

```
certifyroi/
├── src/
│   ├── app/                    # Next.js 16 App Router pages & API routes
│   │   ├── api/                # Server-side AI & secure data endpoints
│   │   ├── offer-analysis/     # Offer letter risk & CTC analyzer
│   │   ├── tools/              # Specialized career intelligence tools
│   │   └── user-profile/       # Secure user data & consent management
│   ├── components/             # Reusable UI & interactive visual components
│   │   ├── Hero.jsx            # Dynamic ROI modeling interface
│   │   ├── LandingPage.jsx     # Accelerated 3D certificate scroll experience
│   │   └── ResumeAnalyzer.jsx  # PII-safe candidate skill extraction
│   ├── data/                   # Calibrated Indian tech market benchmarks
│   ├── lib/                    # Core clients, analytics, and circuit breakers
│   └── services/               # Supabase, AI, Turnstile, and data services
├── migrations/                 # Idempotent database & RLS hardening schemas
└── next.config.mjs             # Strict Content Security Policy (CSP) & headers
```

---

## 🛡️ Security & Privacy First

- **PII Scrubbing**: Client-side & server-side object scanners (`src/utils/piiScanner.js`) strip names, contact numbers, and sensitive candidate identifiers prior to external AI evaluation.
- **Strict Content Security Policy**: Configured in `next.config.mjs` with explicit domain whitelisting to prevent unauthorized third-party scripts.
- **Data Sovereignty**: Built-in account soft-delete and instant GDPR/DPDP-compliant data erasure workflows.

---

## 🚀 Deployment

Built for instant zero-config deployment on **Vercel**:

```bash
npm run build && vercel --prod
```
