'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { assertPermission, logAudit } from '../lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

export async function saveStagingRecordAction(
  table: 'certifications_staging' | 'market_jobs_staging',
  record: any
) {
  await assertPermission('EDIT_STAGING');

  const { data, error } = await supabaseAdmin.from(table).upsert(record).select().single();
  if (error) {
    throw new Error(`Failed to save staging record: ${error.message}`);
  }

  await logAudit({
    action_type: 'SAVE_STAGING_RECORD',
    target_table: table,
    target_id: record.id || data.id,
    new_value: record,
  });

  revalidatePath('/data/certifications');
  revalidatePath('/data/jobs');
  return { success: true, data };
}

export async function pushStagingToLiveAction(
  type: 'certifications' | 'jobs'
) {
  const session = await assertPermission('PUSH_STAGING_LIVE');

  const stagingTable = type === 'certifications' ? 'certifications_staging' : 'market_jobs_staging';
  const liveTable = type === 'certifications' ? 'certifications_live' : 'market_jobs_live';

  // 1. Fetch all staging records
  const { data: stagingRecords, error: fetchErr } = await supabaseAdmin.from(stagingTable).select('*');
  if (fetchErr) {
    throw new Error(`Failed to fetch staging records: ${fetchErr.message}`);
  }

  if (!stagingRecords || stagingRecords.length === 0) {
    return { success: true, count: 0, message: 'No records in staging to push.' };
  }

  // 2. Upsert into live table (strip staging-specific fields if any)
  const cleanRecords = stagingRecords.map((r) => {
    const { staged_by, staged_at, diff_summary, ...rest } = r;
    return { ...rest, last_verified: new Date().toISOString() };
  });

  const { error: liveErr } = await supabaseAdmin.from(liveTable).upsert(cleanRecords);
  if (liveErr) {
    throw new Error(`Failed to push to live production table: ${liveErr.message}`);
  }

  // 3. Clear staging table
  const { error: delErr } = await supabaseAdmin.from(stagingTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.warn('Failed to clear staging table after push:', delErr.message);
  }

  await logAudit({
    action_type: `PUSH_${type.toUpperCase()}_TO_LIVE`,
    target_table: liveTable,
    new_value: { count: cleanRecords.length, pushed_by: session.email },
  });

  revalidatePath('/data/certifications');
  revalidatePath('/data/jobs');
  return { success: true, count: cleanRecords.length };
}

export async function addDataNoteAction(table: string, id: string, noteText: string, authorEmail: string, fullRecord?: any) {
  const authorName = authorEmail.split('@')[0];
  const newNote = `[${new Date().toLocaleDateString()}] ${authorName}: ${noteText}`;
  
  // Fetch existing notes
  const { data, error } = await supabaseAdmin.from(table).select('internal_notes').eq('id', id).maybeSingle();

  const existingNotes = data && Array.isArray(data.internal_notes) ? data.internal_notes : [];
  const updatedNotes = [...existingNotes, newNote];

  // If we have fullRecord, upsert it. Otherwise upsert just the ID and notes to create a skeleton record if it doesn't exist
  const payload = fullRecord ? { ...fullRecord, internal_notes: updatedNotes } : { id, internal_notes: updatedNotes };
  
  const { error: updateError } = await supabaseAdmin.from(table).upsert(payload);
  if (updateError) throw new Error(`Failed to save note: ${updateError.message}`);

  revalidatePath('/data/certifications');
  revalidatePath('/data/jobs');
  return { success: true, notes: updatedNotes };
}

export async function updateLiveRecordAction(table: string, record: any) {
  await assertPermission('EDIT_STAGING'); // Using same permission check for now
  
  const { id, ...rest } = record;
  const { data, error } = await supabaseAdmin.from(table).upsert(record).select().single();
  
  if (error) throw new Error(`Failed to update live record: ${error.message}`);
  
  await logAudit({
    action_type: 'UPDATE_LIVE_RECORD',
    target_table: table,
    target_id: id,
    new_value: rest,
  });

  revalidatePath('/data/certifications');
  revalidatePath('/data/jobs');
  return { success: true, data };
}
