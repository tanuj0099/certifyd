import React from 'react';
import { getSession } from '@/lib/auth/session';
import { getMarketingIdeasAction } from '@/actions/opsActions';
import { MarketingIdeasClient } from '@/components/marketing/MarketingIdeasClient';

export const revalidate = 0;

export default async function MarketingIdeasPage() {
  const session = await getSession();
  const userEmail = session?.email || 'marketing@certifyd.in';
  const initialIdeas = await getMarketingIdeasAction();

  return <MarketingIdeasClient initialIdeas={initialIdeas} userEmail={userEmail} />;
}
