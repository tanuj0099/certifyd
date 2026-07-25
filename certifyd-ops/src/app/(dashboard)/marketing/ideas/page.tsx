import React from 'react';
import { getSession } from '@/lib/auth/session';
import { getMarketingIdeasAction, getTeamMembersAction } from '@/actions/opsActions';
import { MarketingIdeasClient } from '@/components/marketing/MarketingIdeasClient';

export const revalidate = 0;

export default async function MarketingIdeasPage() {
  const session = await getSession();
  const userEmail = session?.email || 'marketing@certifyd.in';
  const [initialIdeas, teamMembers] = await Promise.all([
    getMarketingIdeasAction(),
    getTeamMembersAction(),
  ]);

  return <MarketingIdeasClient initialIdeas={initialIdeas} userEmail={userEmail} teamMembers={teamMembers} />;
}
