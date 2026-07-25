'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { assertPermission, logAudit } from '../lib/rbac/permissions';
import { getSession } from '../lib/auth/session';
import { revalidatePath } from 'next/cache';
import { saveSubmissionOverride, getSubmissionOverrides } from '../lib/cache/submissionsCache';

export async function updateSubmissionStatusAction(
  table: 'resume_submissions' | 'offer_letter_submissions',
  id: string,
  status: 'approved' | 'rejected' | 'flagged',
  rejectionReason?: string
) {
  let session;
  try {
    if (status === 'approved') {
      session = await assertPermission('APPROVE_SUBMISSION');
    } else if (status === 'rejected') {
      session = await assertPermission('REJECT_SUBMISSION');
    } else {
      session = await assertPermission('FLAG_SUBMISSION');
    }
  } catch (permErr: any) {
    throw new Error(permErr?.message || 'Permission denied.');
  }

  const updateData: any = { status };
  if (rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  // 1. Update persistent local cache immediately
  saveSubmissionOverride(id, { status, rejection_reason: rejectionReason });

  // 2. Safely attempt to update all applicable Supabase tables without throwing on missing rows or schemas
  const tablesToUpdate: string[] =
    table === 'resume_submissions'
      ? ['resume_submissions', 'resumes']
      : ['offer_letter_submissions', 'offer_analyses', 'offer_letters'];

  let oldStatus = 'pending';
  for (const targetTable of tablesToUpdate) {
    try {
      const { data: oldRecord } = await supabaseAdmin.from(targetTable).select('status').eq('id', id).maybeSingle();
      if (oldRecord?.status) {
        oldStatus = oldRecord.status;
      }
      await supabaseAdmin.from(targetTable).update(updateData).eq('id', id);
    } catch (dbErr) {
      console.warn(`Safe DB update warning for table ${targetTable} id ${id}:`, dbErr);
    }
  }

  // 3. Log audit
  try {
    await logAudit({
      action_type: `SUBMISSION_${status.toUpperCase()}`,
      target_table: table,
      target_id: id,
      old_value: { status: oldStatus },
      new_value: { status, rejection_reason: rejectionReason || null },
    });
  } catch (auditErr) {}

  // 4. Safely trigger UI revalidation
  try {
    revalidatePath('/submissions/resumes');
    revalidatePath('/submissions/offers');
  } catch (revErr) {}

  return { success: true };
}

export async function addSubmissionNoteAction(
  table: 'resume_submissions' | 'offer_letter_submissions' | 'feedback_reviews' | 'contact_submissions',
  id: string,
  noteText: string
) {
  let session;
  try {
    session = await assertPermission('VIEW_SUBMISSIONS');
  } catch (permErr: any) {
    throw new Error(permErr?.message || 'Permission denied.');
  }

  let existingNotes: Array<{ author: string; text: string; timestamp: string }> = [];

  // Check cache first
  const overrides = getSubmissionOverrides();
  if (overrides[id]?.internal_notes) {
    existingNotes = overrides[id].internal_notes!;
  } else {
    try {
      const { data: record } = await supabaseAdmin.from(table).select('internal_notes').eq('id', id).maybeSingle();
      if (record && Array.isArray(record.internal_notes)) {
        existingNotes = record.internal_notes;
      }
    } catch (fetchErr) {}
  }

  const newNote = {
    author: session?.email || 'admin@certifyd.in',
    text: noteText,
    timestamp: new Date().toISOString(),
  };

  const updatedNotes = [...existingNotes, newNote];

  // 1. Update persistent local cache
  saveSubmissionOverride(id, { internal_notes: updatedNotes });

  // 2. Safely attempt DB update
  try {
    await supabaseAdmin.from(table).update({ internal_notes: updatedNotes }).eq('id', id);
  } catch (dbErr) {}

  // 3. Log audit
  try {
    await logAudit({
      action_type: 'ADD_INTERNAL_NOTE',
      target_table: table,
      target_id: id,
      new_value: newNote,
    });
  } catch (auditErr) {}

  // 4. Safely revalidate
  try {
    revalidatePath('/submissions/resumes');
    revalidatePath('/submissions/offers');
    revalidatePath('/content/feedback');
    revalidatePath('/content/contacts');
  } catch (revErr) {}

  return { success: true, notes: updatedNotes };
}
