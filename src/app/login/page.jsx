'use client';

import { Suspense } from 'react';
import UnifiedAuth from '@/components/UnifiedAuth.jsx';
import SkeletonLoader from '@/components/SkeletonLoader.jsx';

export default function LoginPage() {
  return (
    <Suspense fallback={<SkeletonLoader type="dashboard" />}>
      <UnifiedAuth initialMode="login" />
    </Suspense>
  );
}
