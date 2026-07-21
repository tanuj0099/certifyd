import React from 'react';
import { getSession } from '@/lib/auth/session';
import { DemandClient } from '@/components/data/DemandClient';
import { getDemandObservationsAction } from '@/actions/demandActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DemandPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  const observations = await getDemandObservationsAction();

  return <DemandClient initialObservations={observations} userRole={userRole} />;
}
