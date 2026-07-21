'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth.jsx';
import { ThemeProvider, useTheme } from '@/hooks/useTheme.jsx';
import DynamicIslandNav from '@/components/DynamicIslandNav.jsx';
import { MarketingFooter } from '@/components/MarketingPageShell.jsx';
import OfflineBanner from '@/components/OfflineBanner.jsx';
import CookieBanner from '@/components/CookieBanner.jsx';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';
import { isClientTestMode } from '@/lib/testMode.js';
import { AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '@/hooks/useNetworkStatus.js';
import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb.jsx';
import { GlobalSearchCapsule } from '@/components/GlobalSearchCapsule.jsx';
import OnboardingGate from '@/components/OnboardingGate.jsx';

function GlobalUI({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isOnline = useNetworkStatus();

  // Route matching logic ported from App.jsx
  const isAuthPage = ['/login', '/signup', '/onboarding'].includes(pathname);
  
  const getPageFromPath = () => {
    const path = (pathname || "").toLowerCase();
    if (path === "/" || path === "") return "home";
    if (path === "/app") return "app";
    if (path === "/tools" || path.startsWith("/tools/")) return path.slice(1);
    if (path.startsWith("/")) return path.slice(1);
    return "home";
  };
  const currentPage = getPageFromPath();

  const PAGES_WITH_OWN_FOOTER = new Set([
    'app', 'about', 'features', 'how-it-works', 'pricing', 'blog', 
    'faq', 'contact', 'profile', 'cert-radar', 'tools',
    'dashboard', 'offer-analysis', 'market-pulse', 'choose-path',
    'privacy', 'terms', 'cookies', 'unauthorized', 'not-found',
    'sentry-example-page', 'user-profile', 'onboarding', 'trust'
  ]);

  const isToolPage = currentPage.startsWith('tools/') ||
    ['tools/resume','tools/roi','tools/heatmap','tools/compare',
     'tools/cert-radar','tools/simulator','tools/jobmap','tools/college',
     'tools/hike','tools/market'].includes(currentPage);

  const isRoadmapPage = pathname?.startsWith('/roadmap') || pathname === '/roadmaps';
  const isCertPage = pathname?.startsWith('/cert/') || 
                     pathname?.startsWith('/certification/') || 
                     pathname?.startsWith('/cert-radar/');

  const shouldRenderGlobalFooter =
    !isAuthPage &&
    !PAGES_WITH_OWN_FOOTER.has(currentPage) &&
    !isToolPage &&
    !isRoadmapPage &&
    !isCertPage;

  const requiresOnboardingGate = ['/dashboard', '/profile', '/user-profile', '/offer-analysis', '/roadmaps', '/cert-radar', '/app'].some(p => pathname?.startsWith(p));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AnimatePresence>
        {mounted && !isOnline && <OfflineBanner key="offline" />}
      </AnimatePresence>
      
      {!isAuthPage && (
        <DynamicIslandNav
          isDark={isDark}
          toggleTheme={toggleTheme}
          currentPage={currentPage}
          user={user}
          onSignOut={signOut}
          onSignIn={() => router.push('/login')}
          onSignUp={() => router.push('/signup')}
        />
      )}

      <main style={{ flex: 1 }}>
        <DynamicBreadcrumb />
        {requiresOnboardingGate ? (
          <OnboardingGate>{children}</OnboardingGate>
        ) : (
          children
        )}
      </main>

      <GlobalSearchCapsule />

      {shouldRenderGlobalFooter && <MarketingFooter />}
      {mounted && <CookieBanner />}
    </div>
  );
}

export function Providers({ children }) {
  useEffect(() => {
    const TEST_MODE = isClientTestMode();
    const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const POSTHOG_API_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
    const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

    let sentryInitialized = false;

    const checkAndInit = () => {
      try {
        const saved = localStorage.getItem('certifyd_cookie_preferences');
        if (saved) {
          const prefs = JSON.parse(saved);

          // Only initialize PostHog if analytics consent is granted
          if (prefs.analytics && POSTHOG_KEY && !TEST_MODE) {
            // Check if already initialized to prevent double init
            if (!posthog.__loaded) {
              posthog.init(POSTHOG_KEY, {
                api_host: POSTHOG_API_HOST,
                person_profiles: 'identified_only',
                capture_pageview: true,
                autocapture: false,
              });
            }
          }

          // Initialize Sentry if performance/functional consent is granted (or map as needed, typically functional/analytics)
          if ((prefs.functional || prefs.analytics) && SENTRY_DSN && !TEST_MODE) {
            if (!sentryInitialized) {
              sentryInitialized = true;
              Sentry.init({
                dsn: SENTRY_DSN,
                integrations: [
                  Sentry.browserTracingIntegration(),
                  Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true,
                  }),
                ],
                beforeSend(event) {
                  if (event.user) {
                    delete event.user.email;
                    delete event.user.ip_address;
                  }
                  return event;
                },
                tracesSampleRate: 1.0, 
                replaysSessionSampleRate: 0.1,
                replaysOnErrorSampleRate: 1.0,
              });
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    };

    // Run on initial mount
    checkAndInit();

    // Listen for consent updates
    window.addEventListener('certifydConsentUpdated', checkAndInit);
    return () => {
      window.removeEventListener('certifydConsentUpdated', checkAndInit);
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <GlobalUI>
          {children}
        </GlobalUI>
      </ThemeProvider>
    </AuthProvider>
  );
}
