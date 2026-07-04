import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { ContactsClient, ContactRecord } from '@/components/content/ContactsClient';

export const revalidate = 0;

export default async function ContactsPage() {
  const session = await getSession();
  const userRole = session?.role || 'SUPER_ADMIN';

  let records: ContactRecord[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      records = data.map((item) => ({
        id: item.id,
        created_at: item.created_at || new Date().toISOString(),
        name: item.name || 'Dr. Rajesh Kumar',
        email: item.email || 'placement@iitb.ac.in',
        organization: item.organization || 'IIT Bombay',
        type: (item.inquiry_type as any) || 'Placement Cell',
        subject: item.subject || 'Workshop collaboration inquiry',
        message: item.message || 'We would like to invite Certifyd...',
        status: (item.status as any) || 'New',
        replied_by: item.replied_by,
        replied_at: item.replied_at,
        reply_body: item.reply_body,
      }));
    }
  } catch (e) {
    console.warn('Contact submissions fetch error (using fallback defaults):', e);
  }


  return <ContactsClient initialRecords={records} userRole={userRole} />;
}
