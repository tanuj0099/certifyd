
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import SkeletonLoader from './SkeletonLoader.jsx';

/**
 * OnboardingGate - wraps protected routes that require a completed profile.
 * Works natively with Next.js App Router.
 */
export default function OnboardingGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const userId = user?.uid || user?.id || null;
  const lastCheckedRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
      const publicPaths = ['/', '/login', '/signup', '/onboarding', '/verify-email', '/offer-analysis', '/offer-letter-analyzer', '/roi-calculator'];
      if (!isDemo && !publicPaths.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
        router.replace('/login');
      }
      return;
    }
    if (lastCheckedRef.current === userId) return;
    if (!supabase) {
      lastCheckedRef.current = userId;
      setProfileChecked(true);
      return;
    }

    let cancelled = false;
    lastCheckedRef.current = userId;

    async function checkProfile() {
      try {
        const [{ data: userProfile }, { data: profile }] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        ]);

        if (cancelled) return;

        const isComplete = Boolean(
          userProfile?.onboarding_complete === true ||
          profile?.onboarding_complete === true ||
          (userProfile?.target_domain && userProfile?.target_domain !== '' && userProfile?.job_role && userProfile?.job_role !== '' && userProfile?.job_role !== 'Student') ||
          (profile?.career_focus && profile?.career_focus !== '' && profile?.workspace_slug)
        );

        if (!isComplete) {
          setNeedsOnboarding(true);
          if (pathname !== '/onboarding') {
            router.replace('/onboarding');
          }
        } else {
          setNeedsOnboarding(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Profile gate check exception:", err);
        }
      } finally {
        if (!cancelled) {
          setProfileChecked(true);
        }
      }
    }

    checkProfile();
    return () => {
      cancelled = true;
      lastCheckedRef.current = null;
    };
  }, [userId, authLoading, pathname, router]);

  useEffect(() => {
    if (profileChecked && needsOnboarding && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [profileChecked, needsOnboarding, pathname, router]);

  if (authLoading || (!profileChecked && userId)) {
    return <SkeletonLoader type="dashboard" />;
  }

  const isDemo = typeof window !== 'undefined' && window.location.search.includes('demo=true');
  const publicPaths = ['/', '/login', '/signup', '/onboarding', '/verify-email', '/offer-analysis', '/offer-letter-analyzer', '/roi-calculator'];
  if (!user && !isDemo && !publicPaths.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
    return null;
  }

  if (needsOnboarding && pathname !== '/onboarding') {
    return <SkeletonLoader type="dashboard" />;
  }

  return children;
}
