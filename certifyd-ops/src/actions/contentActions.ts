'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { assertPermission, logAudit } from '../lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

export async function updateContentStatusAction(
  table: 'feedback_reviews' | 'contact_submissions',
  id: string,
  status: string
) {
  await assertPermission(table === 'feedback_reviews' ? 'VIEW_CONTACTS' : 'REPLY_CONTACTS');

  const { error } = await supabaseAdmin.from(table).update({ status }).eq('id', id);
  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  await logAudit({
    action_type: `UPDATE_${table.toUpperCase()}_STATUS`,
    target_table: table,
    target_id: id,
    new_value: { status },
  });

  revalidatePath('/content/feedback');
  revalidatePath('/content/contacts');
  return { success: true };
}

export async function replyToContactAction(
  id: string,
  email: string,
  subject: string,
  body: string
) {
  const session = await assertPermission('REPLY_CONTACTS');

  // If Resend API key is configured, we could send an email. For local/test, we log and save the reply.
  console.log(`[EMAIL SIMULATION] To: ${email} | Subject: Re: ${subject}\n\n${body}`);

  const replyRecord = {
    replied_by: session.email,
    replied_at: new Date().toISOString(),
    body,
  };

  const { error } = await supabaseAdmin
    .from('contact_submissions')
    .update({
      status: 'Replied',
      replied_by: session.email,
      replied_at: replyRecord.replied_at,
      reply_body: body,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to record contact reply: ${error.message}`);
  }

  await logAudit({
    action_type: 'CONTACT_EMAIL_REPLIED',
    target_table: 'contact_submissions',
    target_id: id,
    new_value: replyRecord,
  });

  revalidatePath('/content/contacts');
  return { success: true };
}
