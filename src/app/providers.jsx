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
    'faq', 'contact', 'profile', 'cert-radar', 'tools'
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
        {children}
      </main>

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

    if (POSTHOG_KEY && !TEST_MODE) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_API_HOST,
        person_profiles: 'identified_only',
        capture_pageview: true,
        autocapture: false,
      });
    }

    const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (SENTRY_DSN && !TEST_MODE) {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0, 
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }
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
