import React from 'react';
import { getSession } from '@/lib/auth/session';
import { DemandClient } from '@/components/data/DemandClient';
import { getDemandObservationsAction } from '@/actions/demandActions';
import { ConfidentialDataShield } from '@/components/ui/ConfidentialDataShield';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DemandPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';
  const userEmail = session?.email || 'employee@certifyd.in';

  const observations = await getDemandObservationsAction();

  return (
    <ConfidentialDataShield userEmail={userEmail} userRole={userRole} sectionName="Demand Observations Database">
      <DemandClient initialObservations={JSON.parse(JSON.stringify(observations))} userRole={userRole} />
    </ConfidentialDataShield>
  );
}
