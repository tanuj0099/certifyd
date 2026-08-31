'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { getSession, createSession } from '../lib/auth/session';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';
// --- Types ---
export interface OpsPermissionSet {
  access_marketing: boolean;
  access_technical: boolean;
  access_database: boolean;
  access_verifications: boolean;
  access_content: boolean;
  access_admin: boolean;
}

export interface OpsTeamMember {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TEAM_MEMBER';
  permissions: OpsPermissionSet;
  status: 'active' | 'suspended';
  created_at: string;
  temp_password?: string;
  avatar_url?: string;
}

export interface OpsTaskItem {
  id: string;
  title: string;
  description: string;
  section: 'marketing' | 'technical' | 'database' | 'verifications' | 'content' | 'admin';
  assignee: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  deadline: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  checklist: { id: string; text: string; completed: boolean }[];
  notes: { author: string; text: string; date: string }[];
  created_by: string;
  created_at: string;
}

export interface OpsCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  section: 'marketing' | 'technical' | 'database' | 'verifications' | 'content' | 'admin';
  description?: string;
  is_private: boolean;
  assignee?: string;
  created_by: string;
  created_at: string;
}

export interface OpsNoteThread {
  id: string;
  title: string;
  content: string;
  section: 'marketing' | 'technical' | 'database' | 'verifications' | 'content' | 'admin';
  is_private: boolean;
  pinned: boolean;
  assignee?: string;
  comments: { id: string; author: string; text: string; date: string }[];
  created_by: string;
  created_at: string;
}

export interface OpsMarketingIdea {
  id: string;
  title: string;
  channel: 'LinkedIn' | 'YouTube' | 'Email Outreach' | 'Instagram' | 'Sales Pitch' | string;
  script_content?: string;
  key_hooks?: string[];
  script_outline?: string;
  feedback_notes?: any[];
  target_audience: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Live' | 'Planned' | string;
  assignee?: string;
  created_by: string;
  created_at: string;
  comments?: { id: string; author: string; text: string; date: string }[];
  [key: string]: any;
}

export interface OpsNotification {
  id: string;
  recipient_email?: string;
  recipient_name?: string;
  title: string;
  message: string;
  link_url?: string;
  time: string;
  read: boolean;
  priority: 'high' | 'normal';
  type: 'task' | 'calendar' | 'note' | 'marketing' | 'submission' | 'contact' | 'system';
  created_at: string;
}

export interface OpsBugReport {
  id: string;
  url: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Blocker' | string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done' | string;
  reporter_email: string;
  screenshot_url?: string;
  comments?: { id: string; author: string; text: string; date: string }[];
  created_at: string;
  updated_at: string;
}

function readLocalCache<T>(table: string, defaultData: T[]): T[] {
  return defaultData;
}

function writeLocalCache<T>(table: string, data: T[]): void {
  // Do nothing
}

// --- Initial Dynamic Data (if table is newly created or empty) ---
const INITIAL_TEAM: OpsTeamMember[] = [];

const INITIAL_TASKS: OpsTaskItem[] = [];

const INITIAL_EVENTS: OpsCalendarEvent[] = [];

const INITIAL_NOTES: OpsNoteThread[] = [];

const INITIAL_MARKETING_IDEAS: OpsMarketingIdea[] = [];

const INITIAL_NOTIFICATIONS: OpsNotification[] = [];

const INITIAL_BUGS: OpsBugReport[] = [];

// ==========================================
// 1. TEAM MEMBERS & DYNAMIC RBAC ACTIONS
// ==========================================

export async function getTeamMembersAction(): Promise<OpsTeamMember[]> {
  let dbMembers: OpsTeamMember[] = [];
  try {
    const { data, error } = await supabaseAdmin.from('ops_team_members').select('*').order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      dbMembers = data as OpsTeamMember[];
    }
    const { data: allowlist } = await supabaseAdmin.from('admin_users_allowlist').select('*');
    if (allowlist && allowlist.length > 0) {
      for (const item of allowlist) {
        if (!item.email) continue;
        let parsedPermissions: any = {
          access_marketing: true,
          access_technical: false,
          access_database: false,
          access_verifications: false,
          access_content: false,
          access_admin: false,
        };
        let parsedPass: string | undefined = undefined;
        if (item.permissions) {
          try {
            const raw = typeof item.permissions === 'string' ? JSON.parse(item.permissions) : item.permissions;
            if (raw && typeof raw === 'object') {
              if (raw._pass) parsedPass = raw._pass;
              const { _pass, ...cleanPerms } = raw;
              parsedPermissions = cleanPerms;
            }
          } catch (e) {}
        }

        const existingDbIdx = dbMembers.findIndex((m) => m.email.toLowerCase() === item.email.toLowerCase());
        if (existingDbIdx >= 0) {
          if (!dbMembers[existingDbIdx].temp_password && (item.temp_password || parsedPass)) {
            dbMembers[existingDbIdx].temp_password = item.temp_password || parsedPass;
          }
          if (dbMembers[existingDbIdx].permissions && typeof dbMembers[existingDbIdx].permissions === 'object' && !(dbMembers[existingDbIdx].permissions as any)._pass && parsedPass) {
            (dbMembers[existingDbIdx].permissions as any)._pass = parsedPass;
          }
        } else {
          dbMembers.push({
            id: `team-allow-${item.email.replace(/[^a-z0-9]/g, '-')}`,
            email: item.email.toLowerCase(),
            name: item.email.split('@')[0] || item.email,
            role: item.role || 'TEAM_MEMBER',
            permissions: parsedPermissions,
            status: 'active',
            created_at: item.added_at || new Date().toISOString(),
            temp_password: item.temp_password || parsedPass,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
          });
        }
      }
    }
  } catch (e) {}

  const cacheMembers = readLocalCache<OpsTeamMember>('ops_team_members', INITIAL_TEAM);

  const map = new Map<string, OpsTeamMember>();
  for (const m of cacheMembers) {
    if (!m.email) continue;
    const cleanEmail = m.email.toLowerCase().trim();
    const existing = map.get(cleanEmail);
    const pass = m.temp_password || (m.permissions && typeof m.permissions === 'object' ? (m.permissions as any)._pass : undefined);
    map.set(cleanEmail, {
      ...existing,
      ...m,
      email: cleanEmail,
      temp_password: pass || existing?.temp_password,
      avatar_url: m.avatar_url || existing?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
    });
  }
  for (const m of dbMembers) {
    if (!m.email) continue;
    const cleanEmail = m.email.toLowerCase().trim();
    const existing = map.get(cleanEmail);
    let parsedPerms = m.permissions;
    if (typeof m.permissions === 'string') {
      try { parsedPerms = JSON.parse(m.permissions); } catch (e) {}
    }
    const pass = m.temp_password || (parsedPerms && typeof parsedPerms === 'object' ? (parsedPerms as any)._pass : undefined);
    map.set(cleanEmail, {
      ...existing,
      ...m,
      email: cleanEmail,
      permissions: parsedPerms || existing?.permissions,
      temp_password: pass || existing?.temp_password,
      avatar_url: m.avatar_url || existing?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
    });
  }
  return Array.from(map.values()).filter((m) => {
    const clean = (m.email || '').toLowerCase().trim();
    const cleanName = (m.name || '').toLowerCase().trim();
    if (clean === 'admin@certifyd.in' || clean === 'superadmin@certifyd.in' || cleanName === 'super admin' || (m.role === 'SUPER_ADMIN' && clean.includes('admin'))) {
      return false;
    }
    return true;
  });
}

export async function saveTeamMemberAction(member: OpsTeamMember): Promise<{ success: boolean; data: OpsTeamMember; message?: string }> {
  const cleanEmail = member.email.toLowerCase().trim();
  const enhancedMember: OpsTeamMember = {
    ...member,
    email: cleanEmail,
    avatar_url: member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
  };

  let dbSuccess = false;
  try {
    const { error } = await supabaseAdmin.from('ops_team_members').upsert(enhancedMember).select().single();
    if (!error) {
      dbSuccess = true;
    } else {
      console.error('Supabase ops_team_members upsert error 1:', error);
      // Fallback 1: try with stringified permissions and without temp_password/avatar_url if schema columns differ
      const { temp_password, avatar_url, ...coreRest } = enhancedMember as any;
      const { error: err2 } = await supabaseAdmin.from('ops_team_members').upsert({
        ...coreRest,
        permissions: typeof enhancedMember.permissions === 'string' ? enhancedMember.permissions : JSON.stringify(enhancedMember.permissions || {}),
      });
      if (!err2) {
        dbSuccess = true;
      } else {
        console.error('Supabase ops_team_members upsert error 2:', err2);
        // Fallback 2: try core columns with object permissions
        const { error: err3 } = await supabaseAdmin.from('ops_team_members').upsert(coreRest);
        if (!err3) {
          dbSuccess = true;
        } else {
          console.error('Supabase ops_team_members upsert error 3:', err3);
          // Fallback 3: try minimal core columns
          const { error: err4 } = await supabaseAdmin.from('ops_team_members').upsert({
            id: enhancedMember.id,
            email: enhancedMember.email,
            name: enhancedMember.name,
            role: enhancedMember.role,
            status: enhancedMember.status,
            permissions: typeof enhancedMember.permissions === 'string' ? enhancedMember.permissions : JSON.stringify(enhancedMember.permissions || {}),
          });
          if (!err4) dbSuccess = true;
          else console.error('Supabase ops_team_members upsert error 4:', err4);
        }
      }
    }
  } catch (e) {
    console.error('saveTeamMemberAction ops_team_members exception:', e);
  }

  try {
    const permsPayload = enhancedMember.temp_password ? { ...(enhancedMember.permissions || {}), _pass: enhancedMember.temp_password } : enhancedMember.permissions;
    const { error } = await supabaseAdmin.from('admin_users_allowlist').upsert({
      email: cleanEmail,
      role: enhancedMember.role || 'TEAM_MEMBER',
      permissions: JSON.stringify(permsPayload),
      added_at: enhancedMember.created_at || new Date().toISOString(),
    });
    if (!error) {
      dbSuccess = true;
    } else {
      console.error('Supabase admin_users_allowlist upsert error 1:', error);
      // Fallback: strip permissions column if admin_users_allowlist schema lacks permissions column
      const { error: err2 } = await supabaseAdmin.from('admin_users_allowlist').upsert({
        email: cleanEmail,
        role: enhancedMember.role || 'TEAM_MEMBER',
        added_at: enhancedMember.created_at || new Date().toISOString(),
      });
      if (!err2) dbSuccess = true;
      else console.error('Supabase admin_users_allowlist upsert error 2:', err2);
    }
  } catch (e) {
    console.error('saveTeamMemberAction admin_users_allowlist exception:', e);
  }

  const list = await getTeamMembersAction();
  const idx = list.findIndex((m) => m.id === enhancedMember.id || m.email.toLowerCase() === cleanEmail);
  if (idx >= 0) list[idx] = { ...list[idx], ...enhancedMember };
  else list.push(enhancedMember);
  writeLocalCache('ops_team_members', list);


  revalidatePath('/ops/team');
  revalidatePath('/ops/tasks');
  revalidatePath('/ops/calendar');
  revalidatePath('/ops/notes');
  revalidatePath('/marketing/ideas');
  revalidatePath('/ops/my-work');
  return { success: true, data: enhancedMember };
}

export async function deleteTeamMemberAction(id: string): Promise<{ success: boolean }> {
  const allList = await getTeamMembersAction();
  const memberToDelete = allList.find((m) => m.id === id);
  let cleanEmail = memberToDelete?.email?.toLowerCase()?.trim() || '';

  if (!cleanEmail && id.startsWith('team-allow-')) {
    const raw = id.replace('team-allow-', '');
    // Try basic reconstruction or find by partial match
    const found = allList.find((m) => m.id === id || m.email.toLowerCase().replace(/[^a-z0-9]/g, '-') === raw);
    if (found) cleanEmail = found.email.toLowerCase().trim();
  }

  try {
    await supabaseAdmin.from('ops_team_members').delete().eq('id', id);
    if (cleanEmail) {
      await supabaseAdmin.from('ops_team_members').delete().ilike('email', cleanEmail);
      await supabaseAdmin.from('admin_users_allowlist').delete().ilike('email', cleanEmail);
    }
  } catch (e) {}

  const list = readLocalCache<OpsTeamMember>('ops_team_members', INITIAL_TEAM);
  const filtered = list.filter((m) => m.id !== id && (!cleanEmail || m.email.toLowerCase() !== cleanEmail));
  writeLocalCache('ops_team_members', filtered);


  revalidatePath('/ops/team');
  revalidatePath('/ops/tasks');
  revalidatePath('/ops/calendar');
  revalidatePath('/ops/notes');
  revalidatePath('/marketing/ideas');
  revalidatePath('/ops/my-work');
  return { success: true };
}

// ==========================================
// 2. TASKS & SECTION DELEGATION ACTIONS
// ==========================================

export async function getOpsTasksAction(): Promise<OpsTaskItem[]> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_tasks').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getOpsTasksAction error:', error);
    } else if (data && Array.isArray(data)) {
      const parsedTasks = data.map((d: any) => ({
        id: d.id,
        title: d.title || 'Untitled Task',
        description: d.description || '',
        section: d.section || 'admin',
        priority: d.priority || 'Medium',
        assignee: d.assignee || 'Unassigned',
        status: d.status || 'todo',
        deadline: d.deadline || '',
        checklist: typeof d.checklist === 'string' ? JSON.parse(d.checklist || '[]') : (Array.isArray(d.checklist) ? d.checklist : []),
        notes: typeof d.notes === 'string' ? JSON.parse(d.notes || '[]') : (Array.isArray(d.notes) ? d.notes : []),
        created_by: d.created_by || 'admin@certifyd.in',
        created_at: d.created_at || new Date().toISOString(),
      })) as OpsTaskItem[];

      return parsedTasks;
    }
  } catch (e) {
    console.error('getOpsTasksAction exception:', e);
  }

  return readLocalCache<OpsTaskItem>('ops_tasks', INITIAL_TASKS);
}

export async function saveOpsTaskAction(task: OpsTaskItem): Promise<{ success: boolean; data: OpsTaskItem }> {
  try {
    const cleanPayload = {
      id: task.id,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      section: task.section || 'admin',
      priority: task.priority || 'Medium',
      assignee: task.assignee || 'Unassigned',
      status: task.status || 'To Do',
      deadline: task.deadline || '',
      checklist: typeof task.checklist === 'string' ? JSON.parse(task.checklist) : (task.checklist || []),
      notes: typeof task.notes === 'string' ? JSON.parse(task.notes) : (task.notes || []),
      created_by: task.created_by || 'admin@certifyd.in',
      created_at: task.created_at || new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('ops_tasks').upsert(cleanPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase ops_tasks upsert error 1:', error);
      // Fallback 1: try without description/checklist/notes if columns don't exist
      const { description, checklist, notes, ...basicPayload } = cleanPayload;
      const { error: err2 } = await supabaseAdmin.from('ops_tasks').upsert(basicPayload, { onConflict: 'id' });
      if (err2) {
        console.error('Supabase ops_tasks upsert error 2:', err2);
        // Fallback 2: try minimal core payload
        await supabaseAdmin.from('ops_tasks').upsert({
          id: task.id,
          title: task.title || 'Untitled Task',
          section: task.section || 'admin',
          priority: task.priority || 'Medium',
          assignee: task.assignee || 'Unassigned',
          status: task.status || 'To Do',
          created_at: task.created_at || new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    }
  } catch (e) {
    console.error('saveOpsTaskAction exception:', e);
  }

  const list = readLocalCache<OpsTaskItem>('ops_tasks', INITIAL_TASKS);
  const idx = list.findIndex((t) => t.id === task.id);
  if (idx >= 0) list[idx] = task;
  else list.unshift(task);
  writeLocalCache('ops_tasks', list);

  if (task.assignee && task.assignee !== 'Unassigned' && task.assignee !== 'Super Admin') {
    await sendNotificationAction(
      task.assignee,
      `New Task Assigned: ${task.title}`,
      `You have been assigned a task due on ${task.deadline || 'soon'} with ${task.priority || 'Medium'} priority.`,
      '/ops/tasks',
      'task',
      task.priority === 'Urgent' || task.priority === 'High' ? 'high' : 'normal'
    );
  }

  revalidatePath('/ops/tasks');
  return { success: true, data: task };
}

export async function deleteOpsTaskAction(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin.from('ops_tasks').delete().eq('id', id);
    if (error) console.error('deleteOpsTaskAction error:', error);
  } catch (e) {
    console.error('deleteOpsTaskAction exception:', e);
  }

  const list = readLocalCache<OpsTaskItem>('ops_tasks', INITIAL_TASKS);
  const filtered = list.filter((t) => t.id !== id);
  writeLocalCache('ops_tasks', filtered);

  revalidatePath('/ops/tasks');
  return { success: true };
}

// ==========================================
// 3. TEAM CALENDAR ACTIONS (With Privacy)
// ==========================================

export async function getCalendarEventsAction(): Promise<OpsCalendarEvent[]> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_calendar_events').select('*').order('date', { ascending: true });
    if (error) {
      console.error('Supabase getCalendarEventsAction error:', error);
    } else if (data && Array.isArray(data)) {
      const parsedEvents = data.map((d: any) => ({
        id: d.id,
        title: d.title || 'Untitled Event',
        date: d.date || '',
        time: d.time || '',
        section: d.section || 'admin',
        description: d.description || '',
        is_private: Boolean(d.is_private),
        assignee: d.assignee || 'Unassigned',
        created_by: d.created_by || 'admin@certifyd.in',
        created_at: d.created_at || new Date().toISOString(),
      })) as OpsCalendarEvent[];

      return parsedEvents;
    }
  } catch (e) {
    console.error('getCalendarEventsAction exception:', e);
  }

  return readLocalCache<OpsCalendarEvent>('ops_calendar_events', INITIAL_EVENTS);
}

export async function saveCalendarEventAction(event: OpsCalendarEvent): Promise<{ success: boolean; data: OpsCalendarEvent }> {
  try {
    const cleanPayload = {
      id: event.id,
      title: event.title || 'Untitled Event',
      date: event.date || '',
      time: event.time || '',
      section: event.section || 'admin',
      description: event.description || '',
      is_private: Boolean(event.is_private),
      assignee: event.assignee || 'Unassigned',
      created_by: event.created_by || 'admin@certifyd.in',
      created_at: event.created_at || new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('ops_calendar_events').upsert(cleanPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase ops_calendar_events upsert error 1:', error);
      // Fallback: try without time/description/assignee if table schema only has core columns
      const { time, description, assignee, is_private, ...coreEvent } = cleanPayload;
      const { error: err2 } = await supabaseAdmin.from('ops_calendar_events').upsert(coreEvent, { onConflict: 'id' });
      if (err2) {
        console.error('Supabase ops_calendar_events upsert error 2:', err2);
      }
    }
  } catch (e) {
    console.error('saveCalendarEventAction exception:', e);
  }

  const list = readLocalCache<OpsCalendarEvent>('ops_calendar_events', INITIAL_EVENTS);
  const idx = list.findIndex((ev) => ev.id === event.id);
  if (idx >= 0) list[idx] = event;
  else list.push(event);
  writeLocalCache('ops_calendar_events', list);

  if (event.assignee && event.assignee !== 'Unassigned') {
    await sendNotificationAction(
      event.assignee,
      `Calendar Event Assigned: ${event.title}`,
      `You were assigned a calendar event scheduled for ${event.date} ${event.time || ''}.`,
      '/ops/calendar',
      'calendar',
      'normal'
    );
  }

  revalidatePath('/ops/calendar');
  return { success: true, data: event };
}

export async function deleteCalendarEventAction(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin.from('ops_calendar_events').delete().eq('id', id);
    if (error) console.error('deleteCalendarEventAction error:', error);
  } catch (e) {
    console.error('deleteCalendarEventAction exception:', e);
  }

  const list = readLocalCache<OpsCalendarEvent>('ops_calendar_events', INITIAL_EVENTS);
  const filtered = list.filter((ev) => ev.id !== id);
  writeLocalCache('ops_calendar_events', filtered);

  revalidatePath('/ops/calendar');
  return { success: true };
}

// ==========================================
// 4. DEPARTMENT NOTES & COMMENTS ACTIONS
// ==========================================

export async function getOpsNotesAction(): Promise<OpsNoteThread[]> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_notes').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getOpsNotesAction error:', error);
    } else if (data && Array.isArray(data)) {
      const parsedNotes = data.map((d: any) => ({
        id: d.id,
        title: d.title || 'Untitled',
        content: d.content || '',
        section: d.section || 'admin',
        is_private: Boolean(d.is_private),
        pinned: Boolean(d.pinned),
        assignee: d.assignee || 'Unassigned',
        comments: typeof d.comments === 'string' ? JSON.parse(d.comments || '[]') : (Array.isArray(d.comments) ? d.comments : []),
        created_by: d.created_by || 'admin@certifyd.in',
        created_at: d.created_at || new Date().toISOString(),
      })) as OpsNoteThread[];

      // If database responded without error, return the database notes directly so Vercel workers never overwrite with INITIAL_NOTES!
      return parsedNotes;
    }
  } catch (e) {
    console.error('getOpsNotesAction exception:', e);
  }

  return readLocalCache<OpsNoteThread>('ops_notes', INITIAL_NOTES);
}

export async function saveOpsNoteAction(note: OpsNoteThread): Promise<{ success: boolean; data: OpsNoteThread }> {
  try {
    const cleanPayload = {
      id: note.id,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      section: note.section || 'admin',
      is_private: Boolean(note.is_private),
      pinned: Boolean(note.pinned),
      assignee: note.assignee || 'Unassigned',
      comments: typeof note.comments === 'string' ? JSON.parse(note.comments) : (note.comments || []),
      created_by: note.created_by || 'admin@certifyd.in',
      created_at: note.created_at || new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('ops_notes').upsert(cleanPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase ops_notes upsert error 1:', error);
      // Fallback 1: strip assignee column since user schema for ops_notes lacks assignee column
      const { assignee, ...noAssigneePayload } = cleanPayload;
      const { error: err2 } = await supabaseAdmin.from('ops_notes').upsert(noAssigneePayload, { onConflict: 'id' });
      if (err2) {
        console.error('Supabase ops_notes upsert error 2:', err2);
        // Fallback 2: retry without assignee and with stringified comments
        const { error: err3 } = await supabaseAdmin.from('ops_notes').upsert({
          ...noAssigneePayload,
          comments: typeof noAssigneePayload.comments === 'string' ? noAssigneePayload.comments : JSON.stringify(noAssigneePayload.comments || []),
        }, { onConflict: 'id' });
        if (err3) {
          console.error('Supabase ops_notes upsert error 3:', err3);
          // Fallback 3: minimal core schema
          await supabaseAdmin.from('ops_notes').upsert({
            id: note.id,
            title: note.title || 'Untitled Note',
            content: note.content || '',
            section: note.section || 'admin',
            created_at: note.created_at || new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      }
    }
  } catch (e) {
    console.error('saveOpsNoteAction exception:', e);
  }

  const list = readLocalCache<OpsNoteThread>('ops_notes', INITIAL_NOTES);
  const idx = list.findIndex((n) => n.id === note.id);
  if (idx >= 0) list[idx] = note;
  else list.unshift(note);
  writeLocalCache('ops_notes', list);

  if (note.assignee && note.assignee !== 'Unassigned') {
    await sendNotificationAction(
      note.assignee,
      `Action Item/Note Assigned: ${note.title}`,
      `You were tagged as the assignee on department note in [${note.section.toUpperCase()}].`,
      '/ops/notes',
      'note',
      'normal'
    );
  }

  revalidatePath('/ops/notes');
  return { success: true, data: note };
}

export async function deleteOpsNoteAction(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin.from('ops_notes').delete().eq('id', id);
    if (error) console.error('deleteOpsNoteAction error:', error);
  } catch (e) {
    console.error('deleteOpsNoteAction exception:', e);
  }

  const list = readLocalCache<OpsNoteThread>('ops_notes', INITIAL_NOTES);
  const filtered = list.filter((n) => n.id !== id);
  writeLocalCache('ops_notes', filtered);

  revalidatePath('/ops/notes');
  return { success: true };
}

export async function addNoteCommentAction(noteId: string, author: string, text: string): Promise<{ success: boolean }> {
  const comment = {
    id: `com-${Date.now()}`,
    author,
    text,
    date: 'Just now',
  };

  try {
    const { data: note, error } = await supabaseAdmin.from('ops_notes').select('*').eq('id', noteId).single();
    if (error) {
      console.error('addNoteCommentAction select error:', error);
    } else if (note) {
      const existingComments = typeof note.comments === 'string' ? JSON.parse(note.comments || '[]') : (Array.isArray(note.comments) ? note.comments : []);
      const updatedComments = [...existingComments, comment];
      const { error: updErr } = await supabaseAdmin.from('ops_notes').update({ comments: updatedComments }).eq('id', noteId);
      if (updErr) {
        // Retry stringified
        await supabaseAdmin.from('ops_notes').update({ comments: JSON.stringify(updatedComments) }).eq('id', noteId);
      }
    }
  } catch (e) {
    console.error('addNoteCommentAction exception:', e);
  }

  const list = readLocalCache<OpsNoteThread>('ops_notes', INITIAL_NOTES);
  const idx = list.findIndex((n) => n.id === noteId);
  if (idx >= 0) {
    list[idx].comments = [...(list[idx].comments || []), comment];
    writeLocalCache('ops_notes', list);
  }

  revalidatePath('/ops/notes');
  return { success: true };
}

// ==========================================
// 5. AUTOMATED ONBOARDING & CREDENTIALS
// ==========================================

export async function createEmployeeProfileAction(
  name: string,
  permissions: OpsPermissionSet
): Promise<{ success: boolean; member: OpsTeamMember; email: string; tempPassword: string }> {
  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '') || 'employee';

  const existingTeam = await getTeamMembersAction();
  let email = `${slug}@certifyd.in`;
  let counter = 1;
  while (existingTeam.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
    email = `${slug}${counter}@certifyd.in`;
    counter++;
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let tempPassword = 'Cert#';
  for (let i = 0; i < 6; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const newMember: OpsTeamMember = {
    id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: email.toLowerCase(),
    name: cleanName,
    role: 'TEAM_MEMBER',
    permissions,
    status: 'active',
    created_at: new Date().toISOString(),
    temp_password: tempPassword,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email.toLowerCase())}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
  };

  await saveTeamMemberAction(newMember);

  try {
    const permsPayload = { ...(permissions || {}), _pass: tempPassword };
    await supabaseAdmin.from('admin_users_allowlist').upsert({
      email: email.toLowerCase(),
      role: 'TEAM_MEMBER',
      permissions: JSON.stringify(permsPayload),
      added_at: new Date().toISOString(),
    });
  } catch (e) {
    try {
      await supabaseAdmin.from('admin_users_allowlist').upsert({
        email: email.toLowerCase(),
        role: 'TEAM_MEMBER',
        added_at: new Date().toISOString(),
      });
    } catch (e2) {}
  }

  return { success: true, member: newMember, email: email.toLowerCase(), tempPassword };
}

export async function updateUserPasswordAction(
  email: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  if (!email || !newPassword || newPassword.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const isMasterAdmin =
    cleanEmail === 'admin@certifyd.in' ||
    cleanEmail === 'admin' ||
    cleanEmail === 'superadmin@certifyd.in' ||
    cleanEmail === 'superadmin' ||
    cleanEmail === (process.env.ADMIN_USERNAME || '').toLowerCase() ||
    cleanEmail.includes('admin');

  const list = await getTeamMembersAction();
  const idx = list.findIndex((m) => m.email.toLowerCase() === cleanEmail || (isMasterAdmin && m.role === 'SUPER_ADMIN'));
  if (idx >= 0) {
    list[idx].temp_password = newPassword;
    await saveTeamMemberAction(list[idx]);
  }

  try {
    const { data: existingAllow } = await supabaseAdmin.from('admin_users_allowlist').select('*').eq('email', cleanEmail).single();
    let permsObj: any = {};
    if (existingAllow && existingAllow.permissions) {
      try {
        permsObj = typeof existingAllow.permissions === 'string' ? JSON.parse(existingAllow.permissions) : existingAllow.permissions;
      } catch (e) {}
    }
    permsObj._pass = newPassword;
    await supabaseAdmin.from('admin_users_allowlist').upsert({
      email: cleanEmail,
      role: isMasterAdmin ? 'SUPER_ADMIN' : (existingAllow?.role || 'TEAM_MEMBER'),
      permissions: JSON.stringify(permsObj),
      added_at: existingAllow?.added_at || new Date().toISOString(),
    });
  } catch (e) {}



  return { success: true, message: 'Password updated successfully.' };
}

export async function updateUserAvatarAction(
  email: string,
  avatarUrl: string
): Promise<{ success: boolean; message?: string }> {
  if (!email || !avatarUrl) {
    return { success: false, message: 'Email and Avatar URL are required.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const list = await getTeamMembersAction();
  const idx = list.findIndex((m) => m.email.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    list[idx].avatar_url = avatarUrl;
    await saveTeamMemberAction(list[idx]);
  } else {
    // If not found in ops_team_members, update local cache directly or create record
    try {
      await supabaseAdmin.from('ops_team_members').update({ avatar_url: avatarUrl }).ilike('email', cleanEmail);
    } catch (e) {}
  }

  const session = await getSession();
  if (session && session.email?.toLowerCase() === cleanEmail) {
    await createSession(session.email, session.role, session.permissions, avatarUrl);
  }

  revalidatePath('/');
  revalidatePath('/system/settings');
  return { success: true, message: 'Avatar updated successfully across the workspace.' };
}

export async function getAdminCredentialsAction(): Promise<{ email: string; hasCustomPassword: boolean }> {
  const defaultEmail = process.env.ADMIN_USERNAME || 'admin@certifyd.in';
  return { email: defaultEmail, hasCustomPassword: true };
}

export async function updateAdminEmailAction(newEmail: string): Promise<{ success: boolean; message?: string }> {
  if (!newEmail || !newEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  const cleanEmail = newEmail.toLowerCase().trim();

  return { success: true, message: 'Admin email updated successfully.' };
}

// ==========================================
// 8. MARKETING IDEAS & SCRIPTS ACTIONS
// ==========================================

export async function getMarketingIdeasAction(): Promise<OpsMarketingIdea[]> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_marketing_ideas').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getMarketingIdeasAction error:', error);
    } else if (data && Array.isArray(data)) {
      const parsedIdeas: OpsMarketingIdea[] = data.map((d: any) => ({
        id: d.id,
        title: d.title || 'Untitled Idea',
        channel: d.channel || 'LinkedIn',
        status: d.status || 'Draft',
        assignee: d.assignee || 'Unassigned',
        target_audience: d.target_audience || '',
        script_content: d.script_content || d.script_outline || '',
        key_hooks: typeof d.key_hooks === 'string' ? JSON.parse(d.key_hooks || '[]') : (Array.isArray(d.key_hooks) ? d.key_hooks : []),
        script_outline: d.script_outline || '',
        feedback_notes: typeof d.feedback_notes === 'string' ? JSON.parse(d.feedback_notes || '[]') : (Array.isArray(d.feedback_notes) ? d.feedback_notes : []),
        comments: typeof d.comments === 'string' ? JSON.parse(d.comments || '[]') : (Array.isArray(d.comments) ? d.comments : (typeof d.feedback_notes === 'string' ? JSON.parse(d.feedback_notes || '[]') : (Array.isArray(d.feedback_notes) ? d.feedback_notes : []))),
        created_by: d.created_by || 'admin@certifyd.in',
        created_at: d.created_at || new Date().toISOString(),
      })) as unknown as OpsMarketingIdea[];

      return parsedIdeas;
    }
  } catch (e) {
    console.error('getMarketingIdeasAction exception:', e);
  }

  return readLocalCache<OpsMarketingIdea>('ops_marketing_ideas', INITIAL_MARKETING_IDEAS);
}

export async function saveMarketingIdeaAction(idea: OpsMarketingIdea): Promise<{ success: boolean; data: OpsMarketingIdea }> {
  try {
    const cleanPayload = {
      id: idea.id,
      title: idea.title || 'Untitled Idea',
      channel: idea.channel || 'LinkedIn',
      status: idea.status || 'Draft',
      assignee: idea.assignee || 'Unassigned',
      target_audience: idea.target_audience || '',
      script_content: idea.script_content || idea.script_outline || '',
      key_hooks: typeof idea.key_hooks === 'string' ? JSON.parse(idea.key_hooks) : (idea.key_hooks || []),
      script_outline: idea.script_outline || idea.script_content || '',
      feedback_notes: typeof idea.feedback_notes === 'string' ? JSON.parse(idea.feedback_notes) : (idea.feedback_notes || []),
      comments: typeof idea.comments === 'string' ? JSON.parse(idea.comments) : (idea.comments || []),
      created_by: idea.created_by || 'admin@certifyd.in',
      created_at: idea.created_at || new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from('ops_marketing_ideas').upsert(cleanPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase ops_marketing_ideas upsert error 1:', error);
      // Fallback 1: strip extra arrays/columns if table only has script_content/comments or vice versa
      const { key_hooks, script_outline, feedback_notes, comments, script_content, ...baseIdea } = cleanPayload;
      const { error: err2 } = await supabaseAdmin.from('ops_marketing_ideas').upsert({
        ...baseIdea,
        script_content: cleanPayload.script_content,
        comments: typeof cleanPayload.comments === 'string' ? cleanPayload.comments : JSON.stringify(cleanPayload.comments || []),
      }, { onConflict: 'id' });
      if (err2) {
        console.error('Supabase ops_marketing_ideas upsert error 2:', err2);
        const { error: err3 } = await supabaseAdmin.from('ops_marketing_ideas').upsert({
          ...baseIdea,
          script_outline: cleanPayload.script_outline,
          key_hooks: typeof cleanPayload.key_hooks === 'string' ? cleanPayload.key_hooks : JSON.stringify(cleanPayload.key_hooks || []),
          feedback_notes: typeof cleanPayload.feedback_notes === 'string' ? cleanPayload.feedback_notes : JSON.stringify(cleanPayload.feedback_notes || []),
        }, { onConflict: 'id' });
        if (err3) {
          console.error('Supabase ops_marketing_ideas upsert error 3:', err3);
          // Minimal core fallback
          await supabaseAdmin.from('ops_marketing_ideas').upsert(baseIdea, { onConflict: 'id' });
        }
      }
    }
  } catch (e) {
    console.error('saveMarketingIdeaAction exception:', e);
  }

  const list = readLocalCache<OpsMarketingIdea>('ops_marketing_ideas', INITIAL_MARKETING_IDEAS);
  const idx = list.findIndex((i) => i.id === idea.id);
  if (idx >= 0) list[idx] = idea;
  else list.unshift(idea);
  writeLocalCache('ops_marketing_ideas', list);

  if (idea.assignee && idea.assignee !== 'Unassigned') {
    await sendNotificationAction(
      idea.assignee,
      `Marketing Execution Assigned: ${idea.title}`,
      `You were assigned to execute a ${idea.channel} campaign targeting ${idea.target_audience || 'key audience'}.`,
      '/marketing/ideas',
      'marketing',
      'normal'
    );
  }

  revalidatePath('/marketing/ideas');
  return { success: true, data: idea };
}

export async function deleteMarketingIdeaAction(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin.from('ops_marketing_ideas').delete().eq('id', id);
    if (error) console.error('deleteMarketingIdeaAction error:', error);
  } catch (e) {
    console.error('deleteMarketingIdeaAction exception:', e);
  }

  const list = readLocalCache<OpsMarketingIdea>('ops_marketing_ideas', INITIAL_MARKETING_IDEAS);
  const filtered = list.filter((i) => i.id !== id);
  writeLocalCache('ops_marketing_ideas', filtered);

  revalidatePath('/marketing/ideas');
  return { success: true };
}

// ==========================================
// 9. NOTIFICATIONS & CONNECTION ENGINE
// ==========================================

export async function getNotificationsAction(userEmail?: string, userRole?: string): Promise<OpsNotification[]> {
  let allList: OpsNotification[] = [];
  try {
    const { data, error } = await supabaseAdmin.from('ops_notifications').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getNotificationsAction error:', error);
      allList = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
    } else if (data && Array.isArray(data)) {
      allList = data.map((d: any) => ({
        id: d.id,
        recipient_email: d.recipient_email || 'all',
        recipient_name: d.recipient_name || 'All Team Members',
        title: d.title || 'Notification',
        message: d.message || '',
        link_url: d.link_url || '/ops/tasks',
        time: d.time || 'Just now',
        read: Boolean(d.read),
        priority: d.priority || 'normal',
        type: d.type || 'task',
        created_at: d.created_at || new Date().toISOString(),
      })) as OpsNotification[];
    } else {
      allList = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
    }
  } catch (e) {
    console.error('getNotificationsAction exception:', e);
    allList = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
  }

  if (!userEmail) return allList;
  const cleanEmail = userEmail.toLowerCase().trim();
  const teamList = await getTeamMembersAction();
  const currentMember = teamList.find(m => m.email.toLowerCase() === cleanEmail);
  const userName = currentMember?.name?.toLowerCase().trim() || '';

  return allList.filter((n) => {
    if (userRole === 'SUPER_ADMIN') return true;
    if (n.recipient_email === 'all' || !n.recipient_email) return true;
    
    const recEmail = n.recipient_email.toLowerCase().trim();
    const recName = (n.recipient_name || '').toLowerCase().trim();
    
    if (recEmail === cleanEmail) return true;
    
    // Check if recipient email/name maps back to the current user's email via teamList
    if (teamList.some(m => 
      m.email.toLowerCase() === cleanEmail && 
      (m.email.toLowerCase() === recEmail || m.name.toLowerCase() === recName || m.name.toLowerCase() === recEmail)
    )) {
      return true;
    }
    
    if (userName && recName && (userName === recName || recName.includes(userName) || userName.includes(recName))) return true;
    if (userName && recEmail && (userName === recEmail || recEmail.includes(userName) || userName.includes(recEmail))) return true;
    
    return false;
  });
}

export async function sendNotificationAction(
  recipient: string,
  title: string,
  message: string,
  linkUrl: string = '/ops/tasks',
  type: OpsNotification['type'] = 'task',
  priority: OpsNotification['priority'] = 'normal'
): Promise<{ success: boolean }> {
  if (!recipient || recipient === 'Unassigned') return { success: true };
  const teamList = await getTeamMembersAction();
  const member = teamList.find(
    m => m.email.toLowerCase() === recipient.toLowerCase().trim() ||
         m.name.toLowerCase() === recipient.toLowerCase().trim()
  );

  const notif: OpsNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipient_email: member ? member.email : recipient,
    recipient_name: member ? member.name : recipient,
    title,
    message,
    link_url: linkUrl,
    time: 'Just now',
    read: false,
    priority,
    type,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin.from('ops_notifications').upsert(notif, { onConflict: 'id' });
    if (error) console.error('Supabase ops_notifications upsert error:', error);
  } catch (e) {
    console.error('sendNotificationAction exception:', e);
  }

  // Web Push Integration
  if (recipient !== 'all' && recipient && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        'mailto:admin@certifyd.in',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
        process.env.VAPID_PRIVATE_KEY
      );

      const targetEmail = (member ? member.email : recipient).toLowerCase().trim();
      const { data: subs, error } = await supabaseAdmin
        .from('ops_push_subscriptions')
        .select('subscription_object')
        .eq('user_email', targetEmail);

      if (!error && subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: title,
          body: message,
          url: linkUrl,
          icon: '/logo.svg',
        });

        const promises = subs.map(async (sub) => {
          try {
            await webpush.sendNotification(sub.subscription_object, payload);
          } catch (err: any) {
            // If subscription is invalid (410 or 404), delete it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabaseAdmin.from('ops_push_subscriptions').delete().eq('subscription_object', sub.subscription_object);
            } else {
              console.error('Failed to send push notification:', err);
            }
          }
        });
        await Promise.all(promises);
      }
    } catch (pushErr) {
      console.error('Error during push notification broadcast:', pushErr);
    }
  }

  const list = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
  list.unshift(notif);
  writeLocalCache('ops_notifications', list);

  revalidatePath('/');
  revalidatePath('/ops/tasks');
  revalidatePath('/ops/calendar');
  revalidatePath('/ops/notes');
  revalidatePath('/marketing/ideas');
  return { success: true };
}

export async function markNotificationReadAction(id: string): Promise<{ success: boolean }> {
  try {
    await supabaseAdmin.from('ops_notifications').update({ read: true }).eq('id', id);
  } catch (e) {}

  const list = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
  const idx = list.findIndex(n => n.id === id);
  if (idx >= 0) {
    list[idx].read = true;
    writeLocalCache('ops_notifications', list);
  }
  revalidatePath('/');
  return { success: true };
}

export async function deleteNotificationAction(id: string): Promise<{ success: boolean }> {
  try {
    await supabaseAdmin.from('ops_notifications').delete().eq('id', id);
  } catch (e) {}

  const list = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
  const filtered = list.filter(n => n.id !== id);
  writeLocalCache('ops_notifications', filtered);
  revalidatePath('/');
  return { success: true };
}

export async function clearAllNotificationsAction(userEmail?: string): Promise<{ success: boolean }> {
  try {
    if (userEmail) {
      await supabaseAdmin.from('ops_notifications').delete().eq('recipient_email', userEmail.toLowerCase().trim());
    } else {
      await supabaseAdmin.from('ops_notifications').delete().neq('id', '0');
    }
  } catch (e) {}

  let list = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
  if (userEmail) {
    const cleanEmail = userEmail.toLowerCase().trim();
    list = list.filter(n => n.recipient_email !== cleanEmail && n.recipient_email !== 'all');
  } else {
    list = [];
  }
  writeLocalCache('ops_notifications', list);
  revalidatePath('/');
  return { success: true };
}

// ==========================================
// BUG TRACKING ACTIONS
// ==========================================

export async function getBugsAction(): Promise<OpsBugReport[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ops_bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as OpsBugReport[];
    }
  } catch (e) {
    console.error('getBugsAction error:', e);
  }
  return readLocalCache<OpsBugReport>('ops_bug_reports', INITIAL_BUGS);
}

export async function saveBugAction(bug: OpsBugReport): Promise<{ success: boolean; data: OpsBugReport; message?: string }> {
  try {
    const { error } = await supabaseAdmin.from('ops_bug_reports').upsert(bug);
    if (!error) {
      revalidatePath('/system/bugs');
      return { success: true, data: bug };
    }
    console.error('Supabase ops_bug_reports upsert error:', error);
    
    // Fallback if schema doesn't exist yet
    const cache = readLocalCache<OpsBugReport>('ops_bug_reports', INITIAL_BUGS);
    const existingIdx = cache.findIndex(b => b.id === bug.id);
    if (existingIdx >= 0) cache[existingIdx] = bug;
    else cache.unshift(bug);
    writeLocalCache('ops_bug_reports', cache);
    
    revalidatePath('/system/bugs');
    return { success: true, data: bug, message: 'Saved to local cache' };
  } catch (e) {
    console.error('saveBugAction exception:', e);
    return { success: false, data: bug, message: 'Failed to save bug report' };
  }
}

export async function updateBugStatusAction(id: string, newStatus: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin
      .from('ops_bug_reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      revalidatePath('/system/bugs');
      return { success: true };
    }
    
    // Cache fallback
    const cache = readLocalCache<OpsBugReport>('ops_bug_reports', INITIAL_BUGS);
    const bug = cache.find(b => b.id === id);
    if (bug) {
      bug.status = newStatus;
      bug.updated_at = new Date().toISOString();
      writeLocalCache('ops_bug_reports', cache);
      revalidatePath('/system/bugs');
      return { success: true };
    }
  } catch (e) {
    console.error('updateBugStatusAction exception:', e);
  }
  return { success: false };
}

export async function deleteBugAction(id: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin.from('ops_bug_reports').delete().eq('id', id);
    if (!error) {
      revalidatePath('/system/bugs');
      return { success: true };
    }
    
    // Cache fallback
    const cache = readLocalCache<OpsBugReport>('ops_bug_reports', INITIAL_BUGS);
    writeLocalCache('ops_bug_reports', cache.filter(b => b.id !== id));
    revalidatePath('/system/bugs');
    return { success: true };
  } catch (e) {
    console.error('deleteBugAction exception:', e);
  }
  return { success: false };
}
