# AGENTS.md — CertifyROI

## Commands
- `npm run dev` — Vite dev server (localhost:5173)
- `npm run build` — Production build → `dist/`
- `npm run preview` — Preview production build
- No test runner exists. No lint script in package.json (eslint is installed but not wired).
- **Order**: edit → `npm run build` to verify → deploy

## Architecture
- **React 18 SPA** with `react-router-dom`. Single entry: `src/main.jsx` → `src/App.jsx`.
- **Routing hub**: `App.jsx` (~2000+ lines) contains all route definitions, page components for Terms/Privacy/Cookies, and the main layout shell.
- **State**: Zustand store at `src/store/useJourneyStore.js` — single source of truth for salary/certCost/hikePercent sliders, mode (student/switcher/professional), active tab, and resume context. Persisted slices go to localStorage under key `certify-roi-journey`.
- **Lazy-loaded pages**: All `src/pages/*.jsx` routes are lazy-imported in App.jsx.
- **Pages (20)**: About, AdminDashboard, Blog, CertRadarTool, CollegeTool, CompareTool, Contact, FAQ, Features, HeatmapTool, HikeVerifierTool, HowItWorks, JobMapTool, NotFound, Pricing, Profile, ResumeTool, ROITool, SimulatorTool, Unauthorized.
- **Components (41)**: `src/components/` — key ones: LandingPage, Hero, ModeSelector, DynamicIslandNav, AuthModal, Dashboard, CareerSimulator, CertCompare, Heatmap, ResumeAnalyzer, ShareROICard.
- **API routes**: `api/` directory — Vercel serverless functions. Key routes: `/api/groq`, `/api/demand`, `/api/certifications`, `/api/domains`, `/api/admin/data`, `/api/verify-turnstile`, `/api/update-salaries`.
- **Supabase**: `supabase/user_profiles_and_feedback.sql` — raw SQL for schema. API routes in `api/` use `_supabase.js` helper.

## Env Setup
- Copy `.env.example` → `.env`. Minimum: `VITE_GROQ_API_KEY`.
- Firebase (`VITE_FIREBASE_*`) needed for auth. Supabase (`VITE_SUPABASE_*`) for profile/feedback sync.
- Without GROQ key, app runs in demo mode with mock responses.
- Without Firebase, auth UI shows but sign-in fails gracefully.

## Vercel Config
- `vercel.json` handles SPA rewrites, CSP headers, CORS on `/api/*`, and a weekly cron for `/api/update-salaries` (Mondays 6 AM).
- **CSP is a production concern only** — handled by vercel.json. Do NOT add CSP headers in `vite.config.js` (breaks HMR/eval in dev).
- `api/update-salaries.js` has `maxDuration: 300` (5 min).

## Vite Quirks
- `@/` alias resolves to `./src/` (configured in `vite.config.js`).
- `postcss.config.js` is required — without it Tailwind's `@tailwind` directives emit invalid CSS.
- Do NOT set CSP headers in vite.config.js (see Vercel Config above).

## Design System
- CSS custom properties via `var(--bg)`, `var(--text)`, `var(--indigo)`, `var(--accent)`, `var(--border)`, etc. defined in `src/index.css`.
- Theme system: `src/hooks/useTheme.jsx` — light/dark mode. All pages must support both.
- Fonts: Plus Jakarta Sans/Bricolage Grotesque (headings), Inter (body), JetBrains Mono/Commit Mono (monospace tags).
- Design tokens + cert data: `src/tokens.js`.
- Blog data: `src/data/blogPosts.js`. FAQ data: `src/data/faqItems.js`.

## Instruction Sources (read before editing)
- `PRD.md` — product truth, design rules, functional requirements
- `REVIEW.md` — confirmed current issues
- `TASKS.md` — prioritized task list (P0/P1/P2), done criteria, output format
- `CLAUDE.md` — project/design/implementation rules

## Working Approach
1. Read PRD.md, REVIEW.md, TASKS.md before changes.
2. Audit broken routes/components before editing.
3. Fix P0 → P1 → P2.
4. Preserve valid content; only fix broken/blank/inconsistent content.
5. Landing page is visual source of truth for all internal pages.
6. Treat the app as premium, editorial, restrained — no AI-slop, no neon/glow effects, no emoji-heavy styling.

## Known Gotchas
- App.jsx is very large (~2000+ lines). When adding routes or pages, be surgical.
- `_Old*` prefixed components in App.jsx (e.g. `_OldBlogPage`, `_OldFAQPage`) are legacy — replaced by lazy imports from `src/pages/`.
- `MarketingFooter` from `MarketingPageShell.jsx` is the site-wide footer component.
- DynamicIslandNav is the top navigation component.
- `NAV_H = 64`, `TABS_H = 88` — nav/tab heights used in layout calculations.
- Guest users get 3 free AI analyses (env: `VITE_GUEST_FREE_LIMIT`).
