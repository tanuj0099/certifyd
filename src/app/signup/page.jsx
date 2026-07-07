'use client';

import { Suspense } from 'react';
import UnifiedAuth from '@/components/UnifiedAuth.jsx';
import SkeletonLoader from '@/components/SkeletonLoader.jsx';

export default function SignupPage() {
  return (
    <Suspense fallback={<SkeletonLoader type="dashboard" />}>
      <UnifiedAuth initialMode="signup" />
    </Suspense>
  );
}
