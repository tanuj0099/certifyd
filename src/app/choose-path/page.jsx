'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJourneyStore } from '@/store/useJourneyStore';
import ModeSelector from '@/components/ModeSelector';
import SEOHead from '@/components/SEOHead';

function ChoosePathContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setMode = useJourneyStore(s => s.setMode);

  const handleSelect = (mode) => {
    setMode(mode);
    const returnTo = searchParams?.get('returnTo');
    if (returnTo) {
      router.replace(returnTo);
    } else {
      router.push('/tools/roi');
    }
  };

  return (
    <>
      <SEOHead 
        title="Choose Your Path | Certifyd" 
        description="Select your career stage to get personalized certification ROI recommendations."
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ModeSelector onSelect={handleSelect} />
      </div>
    </>
  );
}

export default function ChoosePathPage() {
  return (
    <Suspense fallback={<div style={{ flex: 1 }} />}>
      <ChoosePathContent />
    </Suspense>
  );
}
