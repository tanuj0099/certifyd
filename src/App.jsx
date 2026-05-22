import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import DynamicIslandNav from "./components/DynamicIslandNav";
import AuthModal from "./components/AuthModal.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import OnboardingGate from "./components/OnboardingGate.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  FileText,
  Map,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  Home,
  Info,
  Phone,
  BookOpen,
  Shield,
  ChevronRight,
  Sparkles,
  FileCheck,
  GraduationCap,
  Award,
  Building2,
  ArrowRight,
  Route as RouteIcon,
  Database,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { ThemeProvider, useTheme } from "./hooks/useTheme.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useJourneyStore } from "./store/useJourneyStore.js";
import { BLOG_POSTS, DOMAIN_FILTERS } from "./data/blogPosts.js";
import { FAQ_ITEMS, FAQ_CATEGORIES } from "./data/faqItems.js";
import LandingPage from "./components/LandingPage.jsx";
import ResumeAnalyzer from "./components/ResumeAnalyzer.jsx";
import Hero from "./components/Hero.jsx";
import Heatmap from "./components/Heatmap.jsx";
import ModeSelector, { ModePill } from "./components/ModeSelector.jsx";
import CollegeVsCorporate from "./components/CollegeVsCorporate.jsx";
import WaveBg from "./components/WaveBg.jsx";
import CertCompare from "./components/CertCompare.jsx";
import CareerSimulator from "./components/CareerSimulator.jsx";
import JobCertMap from "./components/JobCertMap.jsx";
import HikeVerifier from "./components/HikeVerifier.jsx";
import Dashboard from "./components/Dashboard.jsx";
import MarketIntelligenceTool from "./components/LiveMarketPulse.jsx";
import { AppSection } from "./components/SharedUI.jsx";
import { MarketingFooter } from "./components/MarketingPageShell.jsx";
const AboutPage = lazy(() => import("./pages/About.jsx"));
const FeaturesPage = lazy(() => import("./pages/Features.jsx"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorks.jsx"));
const PricingPage = lazy(() => import("./pages/Pricing.jsx"));
const ProfilePage = lazy(() => import("./pages/Profile.jsx"));
const UnauthorizedPage = lazy(() => import("./pages/Unauthorized.jsx"));
const ResumeTool = lazy(() => import("./pages/ResumeTool.jsx"));
const ROITool = lazy(() => import("./pages/ROITool.jsx"));
const HeatmapTool = lazy(() => import("./pages/HeatmapTool.jsx"));
const CompareTool = lazy(() => import("./pages/CompareTool.jsx"));
const CertRadarTool = lazy(() => import("./pages/CertRadarTool.jsx"));
const SimulatorTool = lazy(() => import("./pages/SimulatorTool.jsx"));
import NotFound from "./pages/NotFound.jsx";
const JobMapTool = lazy(() => import("./pages/JobMapTool.jsx"));
const CollegeTool = lazy(() => import("./pages/CollegeTool.jsx"));
const HikeVerifierTool = lazy(() => import("./pages/HikeVerifierTool.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const CertificationPage = lazy(() => import("./pages/CertificationPage.jsx"));
const OfferAnalysisPage = lazy(() => import("./pages/OfferAnalysisPage.jsx"));
const BlogPage = lazy(() => import("./pages/Blog.jsx"));
const FAQPage = lazy(() => import("./pages/FAQ.jsx"));
const ContactPage = lazy(() => import("./pages/Contact.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));
const OnboardingPage = lazy(() => import("./pages/Onboarding.jsx"));
const ToolsIndex = lazy(() => import("./pages/ToolsIndex.jsx"));

const T = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };
const FM = "'JetBrains Mono','Commit Mono',monospace";
const FH = "'Plus Jakarta Sans','Bricolage Grotesque',sans-serif";
const FB = "'Inter',sans-serif";
const NAV_H = 64;
const TABS_H = 88;

const hs = {
  fontFamily: FH,
  fontWeight: "800",
  letterSpacing: "-0.02em",
  color: "var(--text)",
  lineHeight: 1.05,
  marginBottom: "24px",
};

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty("--nav-h", NAV_H + "px");
}

function useIsMobile() {
  var [mobile, setMobile] = useState(function () {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });
  useEffect(function () {
    function check() {
      setMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", check);
    return function () {
      window.removeEventListener("resize", check);
    };
  }, []);
  return mobile;
}

const PageWrapper = function ({
  children,
  id = "00",
  title = "DOCUMENT",
  maxWidth,
  padding,
}) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        paddingTop: NAV_H + "px",
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <AppSection id={id} title={title.toUpperCase()} noBorderTop>
          <div style={{ maxWidth: maxWidth || "800px" }}>{children}</div>
        </AppSection>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// DATA FRESHNESS BADGE — shown in tools area
// ─────────────────────────────────────────────────────────
const DataFreshnessBadge = function () {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "8px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "var(--accent)",
        }}
      />
      <span
        className="mono-tag"
        style={{
          fontFamily: FM,
          fontSize: "10px",
          color: "var(--text-3)",
          letterSpacing: "0.06em",
          opacity: 1,
        }}
      >
        Data: Q1 2026 · LinkedIn India · NASSCOM · Naukri · AmbitionBox
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// TERMS + PRIVACY
// ─────────────────────────────────────────────────────────
const TermsPage = function () {
  return (
    <PageWrapper maxWidth="780px">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
      >
        <h1 style={{ ...hs, fontSize: "clamp(1.8rem,5vw,3.5rem)" }}>
          TERMS AND
          <br />
          <span style={{ color: "var(--indigo)" }}>CONDITIONS</span>
        </h1>
        {[
          {
            title: "1. Acceptance",
            body: "By using CertifyROI, you agree to these terms. We may update them at any time.",
          },
          {
            title: "2. Educational Purpose",
            body: "All ROI projections are approximations for educational purposes only, not financial advice. Results represent statistical medians — half of earners are above, half below. Always verify with a qualified career advisor before making financial decisions.",
          },
          {
            title: "3. AI Disclaimer",
            body: "AI-powered analysis is generated by large language models via Groq inference. Results may be inaccurate, incomplete, or contextually wrong. Verify all data before making career decisions. Do not treat AI output as professional career counselling.",
          },
          {
            title: "4. Data and Privacy",
            body: "Resume text is processed in real-time and not stored. We do not sell personal data. See our Privacy Policy for full details.",
          },
          {
            title: "5. Salary Data Limitations",
            body: "Salary figures are sourced from public reports including NASSCOM, LinkedIn India, and Naukri. These are median estimates based on self-reported and publicly available data. They do not account for company tier, negotiation outcomes, performance variation, or economic shifts. Your actual result may vary significantly.",
          },
          {
            title: "6. Limitation of Liability",
            body: "CertifyROI is not liable for career decisions made based on information on this platform. Use this as one data point among many.",
          },
          {
            title: "7. Contact",
            body: "Questions? Email us at hello@certifyroi.in",
          },
        ].map(function (s, i) {
          return (
            <div
              key={i}
              style={{
                padding: "18px 20px",
                marginBottom: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)"
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  color: "var(--text)",
                  fontFamily: FH,
                  fontWeight: "700",
                  marginBottom: "6px",
                  marginTop: "0",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-3)",
                  lineHeight: "1.7",
                  fontFamily: FB,
                  margin: "0",
                }}
              >
                {s.body}
              </p>
            </div>
          );
        })}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-4)",
            marginTop: "16px",
            textAlign: "center",
            fontFamily: FB,
          }}
        >
          Last updated: March 2026
        </p>
      </motion.div>
    </PageWrapper>
  );
};

const PrivacyPage = function () {
  return (
    <PageWrapper maxWidth="780px">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
      >
        <h1 style={{ ...hs, fontSize: "clamp(1.8rem,5vw,3.5rem)" }}>
          PRIVACY
          <br />
          <span style={{ color: "var(--indigo)" }}>POLICY</span>
        </h1>
        {[
          {
            title: "What we collect",
            body: "Email address (if you sign in with Google) and anonymised usage data. Resume text is NOT stored — processed in real-time via Groq inference and immediately discarded. We never have access to your resume after the analysis completes.",
          },
          {
            title: "How we use your data",
            body: "Email is used for authentication only. We do not send marketing emails unless you explicitly opt in. Anonymised usage data helps us understand which tools are used most, not who uses them.",
          },
          {
            title: "Cookies and storage",
            body: "Essential cookies for authentication. We use localStorage to save your calculator preferences locally on your device. No third-party advertising cookies. No tracking pixels.",
          },
          {
            title: "Third-party services",
            body: "Groq (AI inference — resume text is not logged or stored by Groq per their data processing agreement), Firebase (authentication + profile storage), Vercel (hosting and edge functions).",
          },
          {
            title: "Your rights",
            body: "You can request deletion of your data at any time by emailing hello@certifyroi.in. Requests are processed within 7 business days.",
          },
          {
            title: "Contact",
            body: "Privacy questions? Email hello@certifyroi.in",
          },
        ].map(function (s, i) {
          return (
            <div
              key={i}
              style={{
                padding: "18px 20px",
                marginBottom: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)"
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  color: "var(--text)",
                  fontFamily: FH,
                  fontWeight: "700",
                  marginBottom: "6px",
                  marginTop: "0",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-3)",
                  lineHeight: "1.7",
                  fontFamily: FB,
                  margin: "0",
                }}
              >
                {s.body}
              </p>
            </div>
          );
        })}
      </motion.div>
    </PageWrapper>
  );
};

const CookiesPage = function () {
  return (
    <PageWrapper maxWidth="780px">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
      >
        <h1 style={{ ...hs, fontSize: "clamp(1.8rem,5vw,3.5rem)" }}>
          COOKIES &amp;
          <br />
          <span style={{ color: "var(--indigo)" }}>STORAGE</span>
        </h1>
        {[
          {
            title: "What are cookies?",
            body: "Cookies are small text files stored on your device by your web browser when you visit a website. CertifyROI uses a minimal set of cookies — no advertising, no tracking.",
          },
          {
            title: "Essential cookies",
            body: "We use Firebase Authentication session cookies to keep you signed in. These are required for the app to function if you are a signed-in user. You cannot opt out of these without signing out entirely.",
          },
          {
            title: "localStorage",
            body: "We use your browser's localStorage to remember your calculator preferences (city, salary range, mode selection) across sessions. This data never leaves your device and is never sent to our servers.",
          },
          {
            title: "No advertising cookies",
            body: "CertifyROI has no advertising partnerships, no affiliate tracking, and no retargeting pixels. We do not use Google Ads, Meta Pixel, or any third-party advertising network cookies.",
          },
          {
            title: "No cross-site tracking",
            body: "We do not track you across other websites. Our analytics are privacy-first: aggregated, anonymised page view data only — no heatmaps that identify individual sessions.",
          },
          {
            title: "How to manage cookies",
            body: "You can clear cookies at any time through your browser settings. Clearing cookies will sign you out of CertifyROI. Your localStorage preferences can also be cleared through browser DevTools (Application > Local Storage).",
          },
          {
            title: "Contact",
            body: "Cookie or privacy questions? Email hello@certifyroi.in",
          },
        ].map(function (s, i) {
          return (
            <div
              key={i}
              style={{
                padding: "18px 20px",
                marginBottom: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)"
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  color: "var(--text)",
                  fontFamily: FH,
                  fontWeight: "700",
                  marginBottom: "6px",
                  marginTop: "0",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-3)",
                  lineHeight: "1.7",
                  fontFamily: FB,
                  margin: "0",
                }}
              >
                {s.body}
              </p>
            </div>
          );
        })}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-4)",
            marginTop: "16px",
            textAlign: "center",
            fontFamily: FB,
          }}
        >
          Last updated: March 2026
        </p>
      </motion.div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────
// BLOG data → src/data/blogPosts.js  (BLOG_POSTS, DOMAIN_FILTERS)
// FAQ data  → src/data/faqItems.js   (FAQ_ITEMS, FAQ_CATEGORIES)
// ─────────────────────────────────────────────────────────

const _OldBlogPage = function () {
  var [filter, setFilter] = useState("All");
  var [expandedPost, setExpandedPost] = useState(null);
  var [domainFilter, setDomainFilter] = useState("All");
  var _DOMAIN_FILTERS_LOCAL = [
    "All",
    "Cloud & Tech",
    "Data & AI",
    "Cybersecurity",
    "Finance",
    "Management",
    "Govt & PSU",
    "Medical",
    "Architecture",
    "Engineering",
    "Marketing",
    "HR & People",
  ];
  var filtered = BLOG_POSTS.filter(function (p) {
    var modeOk = filter === "All" || p.forWho === filter;
    var domainOk = domainFilter === "All" || p.tag === domainFilter;
    return modeOk && domainOk;
  });
  return (
    <PageWrapper maxWidth="1060px">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
      >
        <h1 style={{ ...hs, fontSize: "clamp(2rem,5.5vw,3.8rem)" }}>
          THE CERTIFYROI
          <br />
          <span style={{ color: "var(--indigo)" }}>BLOG</span>
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-3)",
            marginBottom: "6px",
            fontFamily: FB,
          }}
        >
          {BLOG_POSTS.length} data-driven career guides. No affiliate links. No
          sponsored recommendations. Just numbers.
        </p>
        {/* Phase C: data freshness */}
        <div style={{ marginBottom: "20px" }}>
          <DataFreshnessBadge />
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          {["All", "Student", "Switcher", "Professional"].map(function (t) {
            return (
              <button
                key={t}
                onClick={function () {
                  setFilter(t);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: FB,
                  fontWeight: "600",
                  transition: "all 0.18s",
                  background:
                    filter === t ? "var(--indigo-dim)" : "transparent",
                  border:
                    "1px solid " +
                    (filter === t ? "var(--border-accent)" : "var(--border)"),
                  color: filter === t ? "var(--indigo-light)" : "var(--text-4)",
                  minHeight: "36px",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          {DOMAIN_FILTERS.map(function (d) {
            return (
              <button
                key={d}
                onClick={function () {
                  setDomainFilter(d);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: FM,
                  letterSpacing: "0.03em",
                  transition: "all 0.18s",
                  background: "transparent",
                  border:
                    "1px solid " +
                    (domainFilter === d
                      ? "transparent"
                      : "var(--border)"),
                  color: domainFilter === d ? "var(--accent)" : "var(--text-4)",
                  minHeight: "32px",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(min(300px,100%),1fr))",
            gap: "16px",
          }}
        >
          {filtered.map(function (post, i) {
            var isExpanded = expandedPost === post.id;
            var paragraphs = post.excerpt.split("\n\n");
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)"
                }}
                onClick={function () {
                  setExpandedPost(isExpanded ? null : post.id);
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: post.tagColor + "18",
                    color: post.tagColor,
                    display: "inline-block",
                    marginBottom: "12px",
                    fontFamily: FM,
                    letterSpacing: "0.06em",
                  }}
                >
                  {post.tag}
                </div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--text)",
                    marginBottom: "10px",
                    lineHeight: "1.45",
                    fontFamily: FH,
                    flex: 1,
                    marginTop: "0",
                  }}
                >
                  {post.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-3)",
                    lineHeight: "1.7",
                    marginBottom: "12px",
                    fontFamily: FB,
                  }}
                >
                  {paragraphs[0]}
                </p>
                <AnimatePresence>
                  {isExpanded ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      {paragraphs.slice(1).map(function (para, pi) {
                        return (
                          <p
                            key={pi}
                            style={{
                              fontSize: "13px",
                              color: "var(--text-3)",
                              lineHeight: "1.75",
                              marginBottom: "12px",
                              fontFamily: FB,
                            }}
                          >
                            {para}
                          </p>
                        );
                      })}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: "10px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-4)",
                      fontFamily: FB,
                    }}
                  >
                    {post.date} · {post.readTime} read
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--indigo)",
                      fontWeight: "700",
                      fontFamily: FH,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    {isExpanded ? "Close" : "Read more"}
                    <motion.span
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: "inline-flex" }}
                    >
                      <ChevronRight size={12} />
                    </motion.span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              color: "var(--text-4)",
              fontFamily: FB,
            }}
          >
            No posts match your current filters.
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────
// FAQ — 20 questions, Phase B: specific not generic
// ─────────────────────────────────────────────────────────
const _OldFAQPage = function () {
  var [open, setOpen] = useState(null);
  var faqs = [
    {
      category: "Product",
      q: "Is CertifyROI free?",
      a: "Yes. The ROI calculator, city demand heatmap, cert comparison, career simulator, and job-cert map are all free with no account required. You get 3 free AI analyses as a guest. Sign in with Google for unlimited free AI analyses.",
    },
    {
      category: "Product",
      q: "What is the difference between Resume AI and the ROI Calculator?",
      a: "Resume AI (Step 1) is for discovery — you don't know which cert to pursue. You upload your resume and the AI reads your background and recommends the top 3 certifications. ROI Calculator (Step 2) is for validation — you already know which cert and want the exact financial numbers: break-even to the month, 5-year net gain, monthly salary delta, and an AI verdict.",
    },
    {
      category: "Product",
      q: "Why does Student Mode exist?",
      a: "Standard ROI calculators assume you have a salary to compare against. Students don't. Student Mode removes salary sliders entirely and reframes the calculation around time-to-first-offer, fresher benchmarks in your city, and career investment ROI. The cert recommendations also shift — Student Mode prioritises certs with strong fresher hiring signals over certs that maximise salary hikes for experienced professionals.",
    },
    {
      category: "Product",
      q: "What is Pitch Your Boss?",
      a: "Pitch Your Boss generates a professional email for professionals who need to justify a certification to their manager for company sponsorship. You enter the cert name, your current role, and expected ROI, and it produces a data-backed email you can send or adapt. Only available in Professional mode because that's the context where this conversation actually happens.",
    },
    {
      category: "Product",
      q: "What is the Cert to Job Map?",
      a: "The Job-Cert Map shows which certifications are required or preferred for specific roles across government positions (UPSC, SSC, PSU exams) and private sector roles at major Indian employers. Government data is from official recruitment notifications. Private sector data is employee-reported via LinkedIn and AmbitionBox.",
    },
    {
      category: "Product",
      q: "How is Career Simulator different from the ROI Calculator?",
      a: "ROI Calculator analyses one certification: what does THIS cert do to your salary over 5 years. Career Simulator models a multi-cert trajectory: if you do AWS SAA now, then CKA in 18 months, then AWS DevOps Pro after that, what does your salary curve look like at each milestone. It's for planning a 3–5 year path, not evaluating a single decision.",
    },
    {
      category: "Data & Accuracy",
      q: "How accurate are the salary figures?",
      a: "Salary data is sourced from LinkedIn Economic Graph India, NASSCOM 2026 talent survey, Naukri salary insights, and AmbitionBox self-reported data. All figures are medians — half of earners are above, half below. Individual results vary based on company tier, negotiation skill, and market conditions. We update quarterly. We do not guarantee these numbers will match your specific situation.",
    },
    {
      category: "Data & Accuracy",
      q: "Is my resume stored anywhere?",
      a: "No. Resume text is processed in real-time via Groq inference and is not stored, logged, or retained. The text goes in, analysis comes out, and the data is gone. We do not have access to your resume after the analysis completes — this is how the system is architecturally designed, not just a policy statement.",
    },
    {
      category: "Data & Accuracy",
      q: "My city isn't one of the 8. What happens?",
      a: "We have city-specific data for Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai, Kolkata, and Ahmedabad. If your city isn't in our database, we use the Haversine formula — a geographic distance calculation using latitude and longitude — to find the nearest city and show that data with a clear disclosure. India national median is also shown below for comparison.",
    },
    {
      category: "Data & Accuracy",
      q: "How often is the cert database updated?",
      a: "The certification list is reviewed quarterly. New certs are added when they appear in 50+ job postings on Naukri in a 30-day period. Salary hike data updates quarterly. Demand data (job posting counts) updates monthly. The last full update was Q1 2026.",
    },
    {
      category: "Career Questions",
      q: "I have no tech background. Can I still use CertifyROI?",
      a: "Yes. CertifyROI covers finance (CFA, FMVA, CMA, CA, NISM), management (PMP, CSM, Six Sigma), marketing (Google, HubSpot, Meta), HR (SHRM, People Analytics), product management, architecture (LEED), medical (DNB, USMLE, ACRP), law, civil and mechanical engineering, and government exam prep (GATE, UPSC, SSC, IBPS). Tech is one of 17 domains.",
    },
    {
      category: "Career Questions",
      q: "I want to switch careers completely. Where do I start?",
      a: "Upload your resume in Step 1 and select Switcher mode. The AI will identify your transferable skills and suggest the fastest viable certification path to your target domain. The fastest ROI switches we've seen data on: ops/finance → data analytics (IBM Data Science, 5 months), backend dev → cloud (AWS SAA, 3 months), MBBS → clinical research (ACRP CRA, 4 months).",
    },
    {
      category: "Career Questions",
      q: "For switchers and professionals, are long-term certs like CA or CFA shown?",
      a: 'For Switchers and Professionals, fast-track certifications (completable in under 6 months) are shown first by default. Long-term programs (CA, CFA, ACCA) are hidden unless you explicitly toggle "Show long-term options." Someone looking to move in the next 6 months shouldn\'t be pushed toward a 3-year program.',
    },
    {
      category: "Career Questions",
      q: "Can CertifyROI help with government exam planning?",
      a: "We can show you the ROI profile of government exams — starting salaries, allowances, career trajectories, prep costs, and realistic success rates. We can't help with actual exam preparation content. Use us to decide if a government path makes sense for your profile and situation — not to prepare for it.",
    },
    {
      category: "Technical",
      q: "The AI analysis gave me a weird result. What should I do?",
      a: "AI responses vary slightly each time. If the result looks wrong, refresh and re-run. If you're getting consistently poor results, the issue is likely the resume input: very short resumes (under 150 words), PDF extraction errors, or heavily formatted PDFs with tables produce poor analysis. Try pasting your resume text directly into the text area.",
    },
    {
      category: "Technical",
      q: "My PDF isn't being read correctly. Why?",
      a: "PDF text extraction works on standard text-based PDFs. Issues occur with: scanned PDFs (image-based, no text layer), complex table layouts, custom embedded fonts, and password-protected files. If extraction fails, paste your resume text directly — same results, none of the PDF issues.",
    },
    {
      category: "Technical",
      q: "Why does the app ask me to choose Student, Switcher, or Professional?",
      a: "Your mode changes how the tool works fundamentally, not just cosmetically. Student Mode removes salary assumptions and focuses on first-offer benchmarks. Switcher Mode surfaces fast-track certs and filters long programs. Professional Mode enables Pitch Your Boss and shows full hike data. Wrong mode = inaccurate recommendations. Pick the one that honestly describes where you are.",
    },
    {
      category: "Technical",
      q: "Is there a mobile app?",
      a: "CertifyROI is a mobile-optimised web app. Open certifyroi.vercel.app in your mobile browser — all tools work fully on any screen size. You can add it to your home screen from Safari or Chrome for an app-like experience without an App Store install.",
    },
    {
      category: "Technical",
      q: "Why does my session reset when I close the tab?",
      a: "Guest preferences are stored in localStorage and persist across sessions on the same device. Guest AI analysis count resets if you clear browser data. Sign in with Google to save your analysis history, cert preferences, and profile across all devices permanently.",
    },
    {
      category: "Technical",
      q: "I found incorrect salary data. How do I report it?",
      a: "We want to know. Use the Contact page and include: the cert name, your city, the figure you saw on CertifyROI, and a link to a data source you believe is more accurate. We review all reported corrections and update the database quarterly. Your correction may help thousands of other professionals make a better decision.",
    },
  ];
  var categories = [
    "Product",
    "Data & Accuracy",
    "Career Questions",
    "Technical",
  ];
  return (
    <PageWrapper maxWidth="760px">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
      >
        <h1 style={{ ...hs, fontSize: "clamp(2rem,5.5vw,3.8rem)" }}>
          FREQUENTLY
          <br />
          <span style={{ color: "var(--indigo)" }}>ASKED</span>
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-3)",
            marginBottom: "12px",
            fontFamily: FB,
          }}
        >
          {faqs.length} questions answered. No corporate speak.
        </p>
        <div style={{ marginBottom: "28px" }}>
          <DataFreshnessBadge />
        </div>
        {categories.map(function (cat) {
          var catFaqs = faqs.filter(function (f) {
            return f.category === cat;
          });
          return (
            <div key={cat} style={{ marginBottom: "32px" }}>
              <div
                style={{
                  fontFamily: FM,
                  fontSize: "10px",
                  color: "var(--text-4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    height: "1px",
                    width: "24px",
                    background: "var(--border)",
                  }}
                />
                {cat}
                <div
                  style={{
                    height: "1px",
                    flex: 1,
                    background: "var(--border)",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {catFaqs.map(function (faq, i) {
                  var idx = cat + "-" + i;
                  var isOpen = open === idx;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ overflow: "hidden", cursor: "pointer", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                      onClick={function () {
                        setOpen(isOpen ? null : idx);
                      }}
                    >
                      <div
                        style={{
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "14px",
                          minHeight: "52px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: isOpen
                              ? "var(--indigo-light)"
                              : "var(--text)",
                            fontFamily: FH,
                            lineHeight: "1.45",
                            flex: 1,
                          }}
                        >
                          {faq.q}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ flexShrink: 0, marginTop: "2px" }}
                        >
                          <ChevronRight size={15} color="var(--text-4)" />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {isOpen ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div
                              style={{
                                padding: "0 20px 18px",
                                paddingTop: "14px",
                                fontSize: "14px",
                                color: "var(--text-2)",
                                borderTop: "1px solid var(--border)",
                                fontFamily: FB,
                                lineHeight: "1.8",
                              }}
                            >
                              {faq.a}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────────────────────
const _OldContactPage = function () {
  var [sent, setSent] = useState(false);
  var [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General feedback",
    message: "",
  });
  var inputStyle = {
    width: "100%",
    padding: "11px 14px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: FB,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.18s",
  };
  var labelStyle = {
    fontSize: "11px",
    color: "var(--text-4)",
    display: "block",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: FM,
  };
  return (
    <PageWrapper maxWidth="600px">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T}
      >
        <h1 style={{ ...hs, fontSize: "clamp(2rem,5.5vw,3.8rem)" }}>
          CONTACT
          <br />
          <span style={{ color: "var(--indigo)" }}>US</span>
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-3)",
            marginBottom: "28px",
            fontFamily: FB,
          }}
        >
          Feedback, data corrections, bug reports, or partnership enquiries.
        </p>
        {sent ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)"
            }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>✅</div>
            <h3
              style={{
                fontSize: "1.4rem",
                color: "var(--text)",
                fontFamily: FH,
                fontWeight: "800",
                marginBottom: "8px",
                marginTop: "0",
              }}
            >
              Sent.
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-3)",
                fontFamily: FB,
                lineHeight: "1.6",
              }}
            >
              We\'ll reply within 48 hours at the email you provided.
            </p>
          </div>
        ) : (
          <div style={{
            padding: "clamp(20px,4vw,32px)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)"
          }}>
            {[
              { key: "name", label: "Name", type: "text", ph: "Your name" },
              {
                key: "email",
                label: "Email",
                type: "email",
                ph: "you@email.com",
              },
            ].map(function (f) {
              return (
                <div key={f.key} style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.ph}
                    value={formData[f.key]}
                    onChange={function (e) {
                      setFormData(function (p) {
                        var n = { ...p };
                        n[f.key] = e.target.value;
                        return n;
                      });
                    }}
                    style={inputStyle}
                    onFocus={function (e) {
                      e.target.style.borderColor = "#10B981";
                    }}
                    onBlur={function (e) {
                      e.target.style.borderColor = "var(--border)";
                    }}
                  />
                </div>
              );
            })}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Subject</label>
              <select
                value={formData.subject}
                onChange={function (e) {
                  setFormData(function (p) {
                    return { ...p, subject: e.target.value };
                  });
                }}
                style={{ ...inputStyle, background: "transparent" }}
              >
                <option>General feedback</option>
                <option>Data correction</option>
                <option>Bug report</option>
                <option>Partnership / B2B</option>
                <option>Press enquiry</option>
              </select>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Message</label>
              <textarea
                rows={5}
                placeholder="Tell us what's on your mind..."
                value={formData.message}
                onChange={function (e) {
                  setFormData(function (p) {
                    return { ...p, message: e.target.value };
                  });
                }}
                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
                onFocus={function (e) {
                  e.target.style.borderColor = "#10B981";
                }}
                onBlur={function (e) {
                      e.target.style.borderColor = "var(--border)";
                }}
              />
            </div>
            <button
              className="btn-primary"
              style={{ width: "100%", padding: "14px" }}
              onClick={function () {
                setSent(true);
              }}
            >
              Send Message
            </button>
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
};

// ─────────────────────────────────────────────────────────
// NAV + TAB CONSTANTS — Study Tracker removed
// ─────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: "home", label: "Home", icon: Home },
  { id: "app", label: "Tools", icon: TrendingUp },
  { id: "blog", label: "Blog", icon: BookOpen },
  { id: "faq", label: "FAQ", icon: Sparkles },
  { id: "about", label: "About", icon: Info },
  { id: "contact", label: "Contact", icon: Phone },
];

const STEP_TABS = [
  {
    id: "resume",
    num: "1",
    label: "Find Cert",
    icon: FileText,
    desc: "AI picks from resume",
  },
  {
    id: "calculator",
    num: "2",
    label: "Calculate ROI",
    icon: TrendingUp,
    desc: "Break-even and 5yr gain",
  },
  {
    id: "heatmap",
    num: "3",
    label: "City Demand",
    icon: Map,
    desc: "Is it hot in your city?",
  },
];

const TOOL_TABS = [
  {
    id: "compare",
    label: "Compare Certs",
    icon: Award,
    desc: "Two certs side by side",
  },
  {
    id: "simulate",
    label: "Career Path",
    icon: RouteIcon,
    desc: "Multi-cert salary trajectory",
  },
  {
    id: "jobmap",
    label: "Cert to Job Map",
    icon: Building2,
    desc: "Which cert gets which role",
  },
  {
    id: "college",
    label: "Degree vs Certs",
    icon: GraduationCap,
    desc: "MBA vs certifications",
  },
  {
    id: "hikeverifier",
    label: "Verify Hike",
    icon: TrendingUp,
    desc: "Did the cert pay off?",
  },
];

const StepArrow = function ({ active }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        padding: "0 1px",
      }}
    >
      <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
        <path
          d="M0 6 H14 M10 1 L16 6 L10 11"
          stroke={active ? "#6366F1" : "transparent"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={active ? "0" : "3 3"}
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MOBILE DRAWER
// ─────────────────────────────────────────────────────────
const MobileDrawer = function ({
  open,
  onClose,
  currentPage,
  onNavigate,
}) {
  // Read directly from store — no prop drilling needed
  const activeTab = useJourneyStore((s) => s.activeTab);
  const onTabChange = useJourneyStore((s) => s.setActiveTab);
  var drawerRef = useRef(null);

  useEffect(
    function () {
      if (!open) return;
      function handleClick(e) {
        if (drawerRef.current && !drawerRef.current.contains(e.target))
          onClose();
      }
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("touchstart", handleClick);
      return function () {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("touchstart", handleClick);
      };
    },
    [open, onClose],
  );

  useEffect(
    function () {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return function () {
        document.body.style.overflow = "";
      };
    },
    [open],
  );

  function go(pageId) {
    onNavigate(pageId);
    onClose();
  }
  function tab(tabId) {
    onTabChange(tabId);
    onNavigate("app");
    onClose();
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--overlay-scrim, rgba(0, 0, 0, 0.55))",
              zIndex: 298,
            }}
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        ref={drawerRef}
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(300px,82vw)",
          zIndex: 299,
          background: "var(--bg-elevated)",
          borderRight: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <button
            onClick={function () {
              go("home");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "var(--accent)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={13} color="var(--bg)" />
            </div>
            <span
              style={{
                fontFamily: FH,
                fontWeight: "800",
                fontSize: "16px",
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              Certify<span style={{ color: "var(--indigo)" }}>ROI</span>
            </span>
          </button>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              padding: "7px",
              cursor: "pointer",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              minWidth: "36px",
              minHeight: "36px",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontFamily: FM,
              fontSize: "9px",
              color: "var(--text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
              marginTop: "4px",
            }}
          >
            Core Flow
          </div>
          {STEP_TABS.map(function (t) {
            var isActive = activeTab === t.id && currentPage === "app";
            return (
              <button
                key={t.id}
                onClick={function () {
                  tab(t.id);
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  background: "transparent",
                  border:
                    "1px solid " +
                    (isActive ? "var(--border-accent)" : "var(--border)"),
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minHeight: "48px",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: isActive ? "var(--accent)" : "transparent",
                    border:
                      "1px solid " +
                      (isActive ? "var(--border-accent)" : "var(--border)"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "700",
                    color: isActive ? "white" : "var(--text-4)",
                    flexShrink: 0,
                    fontFamily: FM,
                  }}
                >
                  {t.num}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: isActive ? "var(--accent)" : "var(--text)",
                      fontFamily: FH,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-4)",
                      fontFamily: FB,
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}

          <div
            style={{
              fontFamily: FM,
              fontSize: "9px",
              color: "var(--text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
              marginTop: "10px",
            }}
          >
            Tools
          </div>
          {TOOL_TABS.map(function (t) {
            var isActive = activeTab === t.id && currentPage === "app";
            return (
              <button
                key={t.id}
                onClick={function () {
                  tab(t.id);
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  background: "transparent",
                  border:
                    "1px solid " +
                    (isActive ? "var(--border-accent)" : "var(--border)"),
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minHeight: "48px",
                }}
              >
                <t.icon
                  size={16}
                  color={isActive ? "#10B981" : "#9CA3AF"}
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: isActive ? "var(--accent)" : "var(--text)",
                      fontFamily: FH,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-4)",
                      fontFamily: FB,
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}

          <div
            style={{
              fontFamily: FM,
              fontSize: "9px",
              color: "var(--text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "6px",
              marginTop: "10px",
            }}
          >
            Navigate
          </div>
          {[
            { id: "blog", label: "Blog", icon: BookOpen },
            { id: "faq", label: "FAQ", icon: Sparkles },
            { id: "about", label: "About", icon: Info },
            { id: "contact", label: "Contact", icon: Phone },
            { id: "terms", label: "Terms", icon: FileCheck },
            { id: "privacy", label: "Privacy", icon: Shield },
          ].map(function (item) {
            var isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={function () {
                  go(item.id);
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "4px",
                  background: "transparent",
                  border:
                    "1px solid " +
                    (isActive ? "var(--border-accent)" : "var(--border)"),
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: isActive ? "var(--text)" : "var(--text-3)",
                  fontSize: "13px",
                  fontFamily: FB,
                  minHeight: "44px",
                  transition: "all 0.15s",
                }}
              >
                <item.icon
                  size={14}
                  color={isActive ? "var(--text)" : "var(--text-4)"}
                />
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <DataFreshnessBadge />
        </div>
      </motion.div>
    </>
  );
};

// ─────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────
const NavBar = function ({ currentPage, onNavigate, onTabChange }) {
  var [drawerOpen, setDrawerOpen] = useState(false);
  var [signingIn, setSigningIn] = useState(false);
  var isMobile = useIsMobile();
  var { user, signInGoogle, signOut, loading } = useAuth();
  // activeTab consumed from store inside MobileDrawer directly

  var go = function (id) {
    onNavigate(id);
  };
  var switchTab = function (id) {
    onTabChange(id);
  };

  var handleSignIn = async function () {
    setSigningIn(true);
    try {
      await signInGoogle();
    } catch (e) { }
    setSigningIn(false);
  };

  return (
    <>
      <MobileDrawer
        open={drawerOpen}
        onClose={function () {
          setDrawerOpen(false);
        }}
        currentPage={currentPage}
        onNavigate={go}
      />

      {/* DynamicIslandNav handles all fixed navigation */}

      {currentPage === "app" ? (
        <div>
          {/* Row 1: Core Flow — CENTERED */}
          <div
            style={{
              borderTop: "1px solid #E5E7EB",
              background: "var(--bg-elevated)",
            }}
          >
            <div
              style={{
                maxWidth: "1240px",
                margin: "0 auto",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "46px",
                overflowX: "auto",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
                gap: "2px",
              }}
              className="tab-row-scroll"
            >
              {STEP_TABS.map(function (tab, i) {
                var active = activeTab === tab.id;
                var isCompleted =
                  STEP_TABS.findIndex(function (t) {
                    return t.id === activeTab;
                  }) > i;
                return (
                  <div
                    key={tab.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i > 0 ? (
                      <StepArrow active={isCompleted || active} />
                    ) : null}
                    <button
                      onClick={function () {
                        switchTab(tab.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 11px",
                        borderRadius: "8px",
                        border:
                          "1px solid " +
                          (active ? "#10B981" : "transparent"),
                        background: "transparent",
                        color: active
                          ? "#10B981"
                          : isCompleted
                            ? "#10B981"
                            : "var(--text-3)",
                        cursor: "pointer",
                        fontFamily: FH,
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        minHeight: "36px",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: active
                            ? "var(--accent)"
                            : "transparent",
                          border:
                            "1px solid " +
                            (active
                              ? "var(--border-accent)"
                              : isCompleted
                                ? "var(--border-accent)"
                                : "var(--border)"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "700",
                          color: active
                            ? "white"
                            : isCompleted
                              ? "var(--indigo-light)"
                              : "var(--text-4)",
                          flexShrink: 0,
                          fontFamily: FM,
                        }}
                      >
                        {tab.num}
                      </div>
                      <tab.icon size={11} />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: active ? "700" : "500",
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2: Tools — CENTERED */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--bg-elevated)",
            }}
          >
            <div
              style={{
                maxWidth: "1240px",
                margin: "0 auto",
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "40px",
                overflowX: "auto",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
                gap: "2px",
              }}
              className="tab-row-scroll"
            >
              {TOOL_TABS.map(function (tab) {
                var active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={function () {
                      switchTab(tab.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 11px",
                      borderRadius: "6px",
                      border: "none",
                      borderBottom:
                        "2px solid " +
                        (active ? "#10B981" : "transparent"),
                      background: "transparent",
                      color: active ? "#10B981" : "#9CA3AF",
                      fontSize: "12px",
                      fontWeight: active ? "700" : "400",
                      cursor: "pointer",
                      fontFamily: FH,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      letterSpacing: "-0.01em",
                      height: "100%",
                      minHeight: "36px",
                    }}
                  >
                    <tab.icon size={11} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

// ─────────────────────────────────────────────────────────
// APP PAGE — Phase C: data freshness badge in tools header
// ─────────────────────────────────────────────────────────
const AppPage = function ({ onCertSelected }) {
  // ── Read all journey state from store (no more prop drilling) ──
  const activeTab = useJourneyStore((s) => s.activeTab);
  const onTabChange = useJourneyStore((s) => s.setActiveTab);
  const mode = useJourneyStore((s) => s.mode);
  const modeLocked = useJourneyStore((s) => s.modeLocked);
  const onModeSelect = useJourneyStore((s) => s.setMode);
  const onModeReset = useJourneyStore((s) => s.resetMode);
  const prefilledCert = useJourneyStore((s) => s.prefilledCert);
  const resumeCity = useJourneyStore((s) => s.resumeCity);
  const resumeDomain = useJourneyStore((s) => s.resumeDomain);
  const resumeName = useJourneyStore((s) => s.resumeName);
  const currentStepNum = STEP_TABS.findIndex((t) => t.id === activeTab);

  return (
    <div
      style={{
        paddingTop: NAV_H + "px",
        minHeight: "100vh",
        background: "var(--bg)",
        position: "relative",
      }}
    >
      {/* ─── PREMIUM FLOATING NAVIGATION BAR ─── */}
      {modeLocked && (
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "0 16px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Brand Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "2px",
                  background: "linear-gradient(135deg, var(--accent) 0%, #8A8F98 100%)",
                  boxShadow: "0 0 12px rgba(94, 106, 210, 0.4)",
                }}
              />
              <span
                style={{
                  fontFamily: FH,
                  fontWeight: "700",
                  fontSize: "13px",
                  letterSpacing: "0.05em",
                  color: "var(--text)",
                  textTransform: "uppercase",
                }}
              >
                CertifyROI
              </span>
            </div>

            {/* Spacer */}
            <div style={{ width: "100px" }} />
          </div>
        </nav>
      )}

      <AnimatePresence>
        {!modeLocked ? <ModeSelector onSelect={onModeSelect} /> : null}
      </AnimatePresence>

      {modeLocked ? (
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <AppSection id="APP" title="TOOL FLOW" noBorderTop>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "32px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <ModePill mode={mode} onReset={onModeReset} />
                  <DataFreshnessBadge />
                </div>

                {/* Modern Flow Header */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  {/* Primary Tools (The Flow of 3) */}
                  {currentStepNum !== -1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        flexWrap: "wrap",
                        marginBottom: "32px",
                      }}
                    >
                      {STEP_TABS.map((tab, i) => {
                        const active = activeTab === tab.id;
                        const isCompleted = currentStepNum > i;
                        return (
                          <div
                            key={tab.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                            }}
                          >
                            {i > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  opacity: isCompleted || active ? 1 : 0.5,
                                }}
                              >
                                <div
                                  style={{
                                    width: "6px",
                                    height: "1px",
                                    background: "var(--text)",
                                  }}
                                />
                                <ArrowRight size={14} color="var(--text)" />
                                <div
                                  style={{
                                    width: "6px",
                                    height: "1px",
                                    background: "var(--text)",
                                  }}
                                />
                              </div>
                            )}
                            <button
                              onClick={() => onTabChange(tab.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 20px",
                                borderRadius: "100px",
                                border: active
                                  ? "1px solid var(--border-accent)"
                                  : "1px solid var(--border)",
                                background: "transparent",
                                color: active
                                  ? "var(--accent)"
                                  : isCompleted
                                    ? "var(--text-3)"
                                    : "var(--text-4)",
                                cursor: "pointer",
                                fontFamily: FH,
                                transition: "all 0.3s ease",
                                boxShadow: active
                                  ? "none"
                                  : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  background: active
                                    ? "var(--accent)"
                                    : "transparent",
                                  border: active ? "none" : "1px solid var(--border)",
                                  color:
                                    active
                                      ? "var(--bg)"
                                      : isCompleted
                                        ? "var(--text-2)"
                                        : "var(--text-4)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  fontFamily: FM,
                                  fontWeight: "700",
                                }}
                              >
                                {isCompleted ? "✓" : tab.num}
                              </div>
                              <tab.icon size={16} />
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: active ? "700" : "600",
                                  fontVariantNumeric: "tabular-nums",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {tab.label}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={T}
                  >
                    {activeTab === "dashboard" ? (
                      <Dashboard />
                    ) : null}

                    {activeTab === "resume" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <ResumeAnalyzer
                          mode={mode}
                          onCertSelected={function (
                            certName,
                            city,
                            domain,
                            name,
                          ) {
                            onCertSelected(certName, city, domain, name);
                          }}
                        />
                      </div>
                    ) : null}

                    {activeTab === "calculator" ? (
                      <div>
                        <Hero
                          mode={mode}
                          prefilledCert={prefilledCert}
                          resumeName={resumeName}
                          resumeCity={resumeCity}
                          resumeDomain={resumeDomain}
                        />
                        {/* Step 2 → Step 3 */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.4 }}
                          style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <motion.button
                            onClick={function () {
                              onTabChange("heatmap");
                            }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "9px",
                              padding: "13px 24px",
                              borderRadius: "12px",
                              background: "var(--accent)",
                              border: "1px solid var(--accent)",
                              color: "var(--bg)",
                              fontSize: "14px",
                              fontFamily: FH,
                              fontWeight: "700",
                              cursor: "pointer",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            <Map size={15} />
                            Next: See City Demand
                            <ArrowRight size={15} />
                          </motion.button>
                        </motion.div>
                      </div>
                    ) : null}

                    {activeTab === "heatmap" ? (
                      <div>
                        <div
                          style={{
                            padding: "clamp(16px,3vw,28px)",
                            background: "transparent",
                            border: "none"
                          }}
                        >
                          <Heatmap
                            prefilledCity={resumeCity}
                            prefilledDomain={resumeDomain}
                            certName={prefilledCert}
                            resumeName={resumeName}
                          />
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          style={{ marginTop: "20px" }}
                        >
                          <motion.button
                            onClick={function () {
                              onTabChange("calculator");
                            }}
                            whileHover={{ x: -4 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              padding: "11px 18px",
                              borderRadius: "10px",
                              background: "transparent",
                              border: "1px solid var(--border)",
                              color: "var(--text-4)",
                              fontSize: "13px",
                              fontFamily: FH,
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            ← Back to ROI Calculator
                          </motion.button>
                        </motion.div>
                      </div>
                    ) : null}

                    {activeTab === "compare" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <CertCompare
                          salary={mode === "student" ? 4.8 : 8}
                          prefilledCert={prefilledCert}
                        />
                      </div>
                    ) : null}

                    {activeTab === "simulate" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <CareerSimulator
                          initialSalary={mode === "student" ? 4.8 : 8}
                        />
                      </div>
                    ) : null}

                    {activeTab === "jobmap" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <JobCertMap />
                      </div>
                    ) : null}

                    {activeTab === "college" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <CollegeVsCorporate />
                      </div>
                    ) : null}

                    {activeTab === "hikeverifier" ? (
                      <div
                        style={{
                          padding: "clamp(16px,3vw,28px)",
                          background: "transparent",
                          border: "none"
                        }}
                      >
                        <HikeVerifier prefilledCert={prefilledCert} />
                      </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

                {/* Secondary Tools removed — keep a subtle micro divider */}
                <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '28px' }} />
              </div>
            </AppSection>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// FOOTER — Phase B: no "Powered by AI", specific credits
// ─────────────────────────────────────────────────────────
const Footer = function ({ onNavigate }) {
  const navigate = useNavigate();
  const nav =
    onNavigate ||
    ((pageId) => navigate(pageId === "home" ? "/" : "/" + pageId));
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "40px 16px 24px",
        marginTop: "auto",
        background: "var(--bg)",
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: "28px",
            marginBottom: "32px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  background: "var(--accent)",
                  borderRadius: "7px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={13} color="var(--bg)" />
              </div>
              <span
                style={{
                  fontFamily: FH,
                  fontWeight: "800",
                  fontSize: "15px",
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                }}
              >
                Certify<span style={{ color: "var(--indigo)" }}>ROI</span>
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-4)",
                fontFamily: FB,
                lineHeight: "1.7",
                maxWidth: "240px",
                marginBottom: "10px",
              }}
            >
              India's first AI-powered cert ROI calculator. Built in Bangalore.
            </p>
            {/* Phase B: specific credits, not generic "AI" */}
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-4)",
                fontFamily: FM,
                opacity: 0.55,
                lineHeight: "1.6",
              }}
            >
              Inference: Groq LPU
              <br />
              Data: LinkedIn · NASSCOM · Naukri · AmbitionBox · WEF 2026
            </p>
          </div>

          <div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "14px",
                fontFamily: FM,
              }}
            >
              Tools
            </div>
            {[
              "Resume AI",
              "ROI Calculator",
              "City Demand",
              "Compare Certs",
              "Career Simulator",
              "Cert to Job Map",
              "Verify Hike",
            ].map(function (l) {
              return (
                <button
                  key={l}
                  onClick={function () {
                    nav("app");
                  }}
                  style={{
                    display: "block",
                    background: "none",
                    border: "none",
                    color: "var(--text-4)",
                    fontSize: "13px",
                    cursor: "pointer",
                    marginBottom: "8px",
                    fontFamily: FB,
                    padding: 0,
                    textAlign: "left",
                    transition: "color 0.15s",
                    minHeight: "28px",
                  }}
                  onMouseEnter={function (e) {
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={function (e) {
                    e.currentTarget.style.color = "var(--text-4)";
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>

          <div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "14px",
                fontFamily: FM,
              }}
            >
              Company
            </div>
            {["about", "blog", "faq", "contact"].map(function (id) {
              return (
                <button
                  key={id}
                  onClick={function () {
                    nav(id);
                  }}
                  style={{
                    display: "block",
                    background: "none",
                    border: "none",
                    color: "var(--text-4)",
                    fontSize: "13px",
                    cursor: "pointer",
                    marginBottom: "8px",
                    fontFamily: FB,
                    padding: 0,
                    textAlign: "left",
                    transition: "color 0.15s",
                    minHeight: "28px",
                  }}
                  onMouseEnter={function (e) {
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={function (e) {
                    e.currentTarget.style.color = "var(--text-4)";
                  }}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              );
            })}
          </div>

          <div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "14px",
                fontFamily: FM,
              }}
            >
              Legal
            </div>
            {["terms", "privacy", "cookies"].map(function (id) {
              return (
                <button
                  key={id}
                  onClick={function () {
                    nav(id);
                  }}
                  style={{
                    display: "block",
                    background: "none",
                    border: "none",
                    color: "var(--text-4)",
                    fontSize: "13px",
                    cursor: "pointer",
                    marginBottom: "8px",
                    fontFamily: FB,
                    padding: 0,
                    textAlign: "left",
                    transition: "color 0.15s",
                    minHeight: "28px",
                  }}
                  onMouseEnter={function (e) {
                    e.currentTarget.style.color = "var(--text)";
                  }}
                  onMouseLeave={function (e) {
                    e.currentTarget.style.color = "var(--text-4)";
                  }}
                >
                  {id === "terms"
                    ? "Terms & Conditions"
                    : id === "privacy"
                      ? "Privacy Policy"
                      : "Cookie Policy"}
                </button>
              );
            })}
            <div
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--indigo-light)",
                  fontFamily: FM,
                  marginBottom: "4px",
                }}
              >
                CONTACT
              </div>
              <a
                href="mailto:hello@certifyroi.in"
                style={{
                  fontSize: "12px",
                  color: "var(--text-3)",
                  fontFamily: FB,
                  textDecoration: "none",
                }}
              >
                hello@certifyroi.in
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {/* Phase C: honest disclaimer */}
          <p
            style={{ fontSize: "12px", color: "var(--text-4)", fontFamily: FB }}
          >
            © 2026 CertifyROI. Salary figures are medians, not guarantees. Not
            financial advice.
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-4)",
              fontFamily: FM,
              opacity: 0.4,
            }}
          >
            Built in Bangalore for India's professionals
          </p>
        </div>
      </div>
    </footer>
  );
};

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────
const SignInModal = function ({ isOpen, onClose, onSignIn, loading }) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--overlay-scrim, rgba(0, 0, 0, 0.55))",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "32px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "none",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "var(--text-3)",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <X size={20} />
        </button>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "transparent",
            color: "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <User size={24} />
        </div>
        <h3
          style={{
            fontSize: "22px",
            fontFamily: FH,
            fontWeight: "800",
            color: "var(--text)",
            marginBottom: "12px",
            marginTop: 0,
          }}
        >
          Sign in to continue
        </h3>
        <p
          style={{
            fontSize: "14px",
            fontFamily: FB,
            color: "var(--text-2)",
            marginBottom: "28px",
            lineHeight: "1.6",
          }}
        >
          Get personalized ROI analysis and access premium career tools for
          free.
        </p>
        <button
          onClick={onSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "100px",
            background: "#10B981",
            color: "#FFFFFF",
            border: "none",
            fontSize: "15px",
            fontFamily: FH,
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? "Signing In..." : "Continue with Google"}
        </button>
      </motion.div>
    </div>
  );
};

function AppRoot() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  // ── Journey state now lives in Zustand ────────────────
  const activeTab = useJourneyStore((s) => s.activeTab);
  const setActiveTab = useJourneyStore((s) => s.setActiveTab);
  const setResumeContext = useJourneyStore((s) => s.setResumeContext);

  useEffect(() => {
    if (location.state?.authRequired) {
      setShowSignIn(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setActiveTab('dashboard')
    }
  }, [location.pathname, setActiveTab])

  var goToApp = function (tab) {
    setActiveTab(tab || "dashboard");
    navigate("/app");
  };

  var handleCertSelected = function (certName, city, domain, name) {
    setResumeContext({ certName, city, domain, name });
    setActiveTab("calculator");
    navigate("/app");
  };

  // Determine current page for nav highlighting
  const getPageFromPath = () => {
    const path = (location.pathname || "").toLowerCase();
    if (path === "/" || path === "") return "home";
    if (path === "/app") return "app";
    if (path === "/tools" || path.startsWith("/tools/")) return path.slice(1);
    if (path.startsWith("/")) return path.slice(1);
    return "home";
  };
  const currentPage = getPageFromPath();

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <AnimatePresence>
        <AuthModal
          isOpen={showSignIn}
          onClose={() => setShowSignIn(false)}
          loading={loading}
        />
      </AnimatePresence>
      <DynamicIslandNav
        isDark={isDark}
        toggleTheme={toggleTheme}
        onNavigate={(pageId) =>
          navigate(pageId === "home" ? "/" : "/" + pageId)
        }
        currentPage={currentPage}
        user={user}
        onSignIn={() => navigate('/login')}
        onSignOut={signOut}
      />
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={T}
          >
            <Suspense fallback={
              <div style={{
                minHeight: '60vh', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexDirection: 'column', gap: '14px',
                background: 'var(--bg)',
              }}>
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--text-4)',
                  animation: 'pdot 1.4s ease-in-out infinite',
                }} />
              </div>
            }>
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <LandingPage
                      isDark={isDark}
                      onEnter={() => goToApp("resume")}
                      onNavigate={(p) => navigate(p === "home" ? "/" : "/" + p)}
                    />
                  }
                />
                <Route
                  path="/app"
                  element={
                    <AppPage
                      onCertSelected={handleCertSelected}
                    />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/tools/resume" element={<ResumeTool />} />
                <Route path="/tools/roi" element={<ROITool />} />
                <Route path="/tools/heatmap" element={<HeatmapTool />} />
                <Route path="/tools/compare" element={<CompareTool />} />
                <Route path="/tools/cert-radar" element={<CertRadarTool />} />
                <Route path="/tools/simulator" element={<SimulatorTool />} />
                <Route path="/tools/jobmap" element={<JobMapTool />} />
                <Route path="/tools/college" element={<CollegeTool />} />
                <Route path="/tools/hike" element={<HikeVerifierTool />} />
                <Route path="/tools/market" element={<MarketIntelligenceTool />} />
                <Route path="/dashboard" element={
                  <OnboardingGate>
                    <DashboardPage />
                  </OnboardingGate>
                } />
                <Route path="/cert/:slug" element={<CertificationPage />} />
                <Route path="/certification/:slug" element={<CertificationPage />} />
                <Route path="/offer-analysis" element={<OfferAnalysisPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/tools" element={<ToolsIndex />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/cookies" element={<CookiesPage />} />
                <Route path="/FAQ" element={<Navigate to="/faq" replace />} />
                <Route
                  path="/About"
                  element={<Navigate to="/about" replace />}
                />
                <Route
                  path="/Features"
                  element={<Navigate to="/features" replace />}
                />
                <Route
                  path="/How-It-Works"
                  element={<Navigate to="/how-it-works" replace />}
                />
                <Route
                  path="/Pricing"
                  element={<Navigate to="/pricing" replace />}
                />
                <Route
                  path="/Contact"
                  element={<Navigate to="/contact" replace />}
                />
                <Route
                  path="/Terms"
                  element={<Navigate to="/terms" replace />}
                />
                <Route
                  path="/Privacy"
                  element={<Navigate to="/privacy" replace />}
                />
                <Route
                  path="*"
                  element={
                    <NotFound isDark={isDark} />
                  }
                />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      {currentPage === "app" || currentPage === "home" ? (
        <MarketingFooter />
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoot />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
