'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { assertPermission, logAudit } from '../lib/rbac/permissions';
import { revalidatePath } from 'next/cache';

export async function toggleFeatureFlagAction(flagKey: string, newStatus: boolean) {
  const session = await assertPermission('TOGGLE_FLAGS');

  const { data: oldRecord } = await supabaseAdmin
    .from('feature_flags')
    .select('*')
    .eq('flag_key', flagKey)
    .single();

  const updateData = {
    is_enabled: newStatus,
    updated_by: session.email,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('feature_flags')
    .upsert({ flag_key: flagKey, ...updateData });

  if (error) {
    throw new Error(`Failed to toggle feature flag: ${error.message}`);
  }

  await logAudit({
    action_type: `FLAG_TOGGLE_${newStatus ? 'ENABLED' : 'DISABLED'}`,
    target_table: 'feature_flags',
    target_id: flagKey,
    old_value: { is_enabled: oldRecord?.is_enabled },
    new_value: { is_enabled: newStatus, updated_by: session.email },
  });

  revalidatePath('/system/flags');
  return { success: true };
}

export async function addAdminUserAction(email: string, role: 'SUPER_ADMIN' | 'TEAM_MEMBER') {
  await assertPermission('MANAGE_TEAM');

  const { error } = await supabaseAdmin.from('admin_users_allowlist').upsert({
    email: email.toLowerCase().trim(),
    role,
    added_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to add admin user: ${error.message}`);
  }

  await logAudit({
    action_type: 'ADD_ADMIN_USER',
    target_table: 'admin_users_allowlist',
    target_id: email,
    new_value: { email, role },
  });

  revalidatePath('/system/settings');
  return { success: true };
}

export async function removeAdminUserAction(email: string) {
  const session = await assertPermission('MANAGE_TEAM');

  if (email.toLowerCase() === session.email.toLowerCase()) {
    throw new Error('Cannot remove your own active admin account.');
  }

  const { error } = await supabaseAdmin.from('admin_users_allowlist').delete().eq('email', email.toLowerCase().trim());
  if (error) {
    throw new Error(`Failed to remove admin user: ${error.message}`);
  }

  await logAudit({
    action_type: 'REMOVE_ADMIN_USER',
    target_table: 'admin_users_allowlist',
    target_id: email,
  });

  revalidatePath('/system/settings');
  return { success: true };
}

export async function clearOldFeedbackAction() {
  await assertPermission('DELETE_RECORD');

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabaseAdmin
    .from('feedback_reviews')
    .delete({ count: 'exact' })
    .eq('status', 'Resolved')
    .lt('created_at', ninetyDaysAgo);

  if (error) {
    throw new Error(`Failed to clear old feedback: ${error.message}`);
  }

  await logAudit({
    action_type: 'HYGIENE_CLEAR_OLD_FEEDBACK',
    target_table: 'feedback_reviews',
    new_value: { deleted_count: count || 0 },
  });

  revalidatePath('/content/feedback');
  return { success: true, count: count || 0 };
}
