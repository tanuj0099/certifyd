'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { assertPermission, logAudit } from '../lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

export async function updateSubmissionStatusAction(
  table: 'resume_submissions' | 'offer_letter_submissions',
  id: string,
  status: 'approved' | 'rejected' | 'flagged',
  rejectionReason?: string
) {
  // Check permission based on target status
  if (status === 'approved') {
    await assertPermission('APPROVE_SUBMISSION');
  } else if (status === 'rejected') {
    await assertPermission('REJECT_SUBMISSION');
  } else {
    await assertPermission('FLAG_SUBMISSION');
  }

  const updateData: any = { status };
  if (rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  const { data: oldRecord } = await supabaseAdmin.from(table).select('*').eq('id', id).single();

  const { error } = await supabaseAdmin.from(table).update(updateData).eq('id', id);

  if (error) {
    throw new Error(`Failed to update submission status: ${error.message}`);
  }

  await logAudit({
    action_type: `SUBMISSION_${status.toUpperCase()}`,
    target_table: table,
    target_id: id,
    old_value: { status: oldRecord?.status },
    new_value: { status, rejection_reason: rejectionReason || null },
  });

  revalidatePath('/submissions/resumes');
  revalidatePath('/submissions/offers');
  return { success: true };
}

export async function addSubmissionNoteAction(
  table: 'resume_submissions' | 'offer_letter_submissions' | 'feedback_messages' | 'contact_submissions',
  id: string,
  noteText: string
) {
  const session = await assertPermission('VIEW_SUBMISSIONS');
  
  const { data: record, error: fetchErr } = await supabaseAdmin.from(table).select('internal_notes').eq('id', id).single();
  if (fetchErr) {
    throw new Error(`Failed to fetch record: ${fetchErr.message}`);
  }

  const existingNotes: Array<{ author: string; text: string; timestamp: string }> = Array.isArray(record?.internal_notes)
    ? record.internal_notes
    : [];

  const newNote = {
    author: session.email,
    text: noteText,
    timestamp: new Date().toISOString(),
  };

  const updatedNotes = [...existingNotes, newNote];

  const { error } = await supabaseAdmin.from(table).update({ internal_notes: updatedNotes }).eq('id', id);
  if (error) {
    throw new Error(`Failed to save note: ${error.message}`);
  }

  await logAudit({
    action_type: 'ADD_INTERNAL_NOTE',
    target_table: table,
    target_id: id,
    new_value: newNote,
  });

  revalidatePath('/submissions/resumes');
  revalidatePath('/submissions/offers');
  revalidatePath('/content/feedback');
  revalidatePath('/content/contacts');
  return { success: true, notes: updatedNotes };
}
