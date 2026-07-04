import { getSession } from '../auth/session';
import { supabaseAdmin } from '../supabase/server';
import { headers } from 'next/headers';

export type ActionType =
  | 'VIEW_SUBMISSIONS'
  | 'FLAG_SUBMISSION'
  | 'APPROVE_SUBMISSION'
  | 'REJECT_SUBMISSION'
  | 'EDIT_STAGING'
  | 'PUSH_STAGING_LIVE'
  | 'VIEW_CONTACTS'
  | 'REPLY_CONTACTS'
  | 'TOGGLE_FLAGS'
  | 'EXPORT_DATA'
  | 'VIEW_AUDIT_LOG'
  | 'MANAGE_TEAM'
  | 'DELETE_RECORD'
  | 'VIEW_ANALYTICS';

const PERMISSION_MATRIX: Record<ActionType, { SUPER_ADMIN: boolean; TEAM_MEMBER: boolean }> = {
  VIEW_SUBMISSIONS: { SUPER_ADMIN: true, TEAM_MEMBER: true },
  FLAG_SUBMISSION: { SUPER_ADMIN: true, TEAM_MEMBER: true },
  APPROVE_SUBMISSION: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  REJECT_SUBMISSION: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  EDIT_STAGING: { SUPER_ADMIN: true, TEAM_MEMBER: true },
  PUSH_STAGING_LIVE: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  VIEW_CONTACTS: { SUPER_ADMIN: true, TEAM_MEMBER: true },
  REPLY_CONTACTS: { SUPER_ADMIN: true, TEAM_MEMBER: true },
  TOGGLE_FLAGS: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  EXPORT_DATA: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  VIEW_AUDIT_LOG: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  MANAGE_TEAM: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  DELETE_RECORD: { SUPER_ADMIN: true, TEAM_MEMBER: false },
  VIEW_ANALYTICS: { SUPER_ADMIN: true, TEAM_MEMBER: true },
};

export function hasPermission(role: 'SUPER_ADMIN' | 'TEAM_MEMBER', action: ActionType): boolean {
  return !!PERMISSION_MATRIX[action]?.[role];
}

export async function logAudit(params: {
  action_type: string;
  target_table?: string;
  target_id?: string;
  old_value?: any;
  new_value?: any;
}) {
  try {
    const session = await getSession();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const email = session?.email || 'system@certifyd-ops';
    const role = session?.role || 'SYSTEM';

    await supabaseAdmin.from('audit_log').insert({
      admin_email: email,
      admin_role: role,
      action_type: params.action_type,
      target_table: params.target_table || null,
      target_id: params.target_id || null,
      old_value: params.old_value || null,
      new_value: params.new_value || null,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.error('Audit logging failure:', e);
  }
}

export async function assertPermission(action: ActionType) {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized: No active admin session');
  }

  if (!hasPermission(session.role, action)) {
    // Log permission violation attempt
    await logAudit({
      action_type: `PERMISSION_DENIED_${action}`,
      target_table: 'security',
      old_value: { role: session.role, attempted_action: action },
    });
    throw new Error(`Forbidden: Role ${session.role} does not have permission for ${action}`);
  }

  return session;
}
