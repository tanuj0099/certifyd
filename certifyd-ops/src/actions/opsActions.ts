'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { getSession, createSession } from '../lib/auth/session';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

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
  channel: 'LinkedIn' | 'YouTube' | 'Email Outreach' | 'Instagram' | 'Sales Pitch';
  script_content: string;
  target_audience: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Live';
  assignee?: string;
  created_by: string;
  created_at: string;
  comments: { id: string; author: string; text: string; date: string }[];
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

// --- Persistent Fallback Cache for Dynamic Operation if SQL Tables are uncreated ---
const CACHE_DIRS = [
  path.join(process.cwd(), 'data', 'ops_cache'),
  path.join(process.cwd(), 'certifyd-ops', 'data', 'ops_cache'),
  path.join('/tmp', 'ops_cache'),
  path.join(process.cwd(), '.next', 'ops_cache'),
  path.resolve(__dirname, '../../../../data/ops_cache'),
  'C:\\Users\\Tanuj Rajdev\\Downloads\\certifyroi\\certifyroi\\certifyd-ops\\data\\ops_cache'
];

for (const dir of CACHE_DIRS) {
  try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
}

function getCacheFilePath(dir: string, table: string): string {
  return path.join(dir, `${table}.json`);
}

function readLocalCache<T>(table: string, defaultData: T[]): T[] {
  const seen = new Set<string>();
  const deduplicated: T[] = [];

  for (const dir of CACHE_DIRS) {
    try {
      const file = getCacheFilePath(dir, table);
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            const key = (item as any).id || (item as any).email || JSON.stringify(item);
            if (!seen.has(key)) {
              seen.add(key);
              deduplicated.push(item);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Error reading local ops cache for ${table} in ${dir}:`, e);
    }
  }
  if (deduplicated.length > 0) return deduplicated;
  writeLocalCache(table, defaultData);
  return defaultData;
}

function writeLocalCache<T>(table: string, data: T[]): void {
  const seen = new Set<string>();
  const deduplicated: T[] = [];
  for (const item of data) {
    const key = (item as any).id || (item as any).email || JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  }

  for (const dir of CACHE_DIRS) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = getCacheFilePath(dir, table);
      fs.writeFileSync(file, JSON.stringify(deduplicated, null, 2), 'utf-8');
    } catch (e) {
      console.warn(`Error writing local ops cache for ${table} in ${dir}:`, e);
    }
  }
}

// --- Initial Dynamic Data (if table is newly created or empty) ---
const INITIAL_TEAM: OpsTeamMember[] = [];

const INITIAL_TASKS: OpsTaskItem[] = [];

const INITIAL_EVENTS: OpsCalendarEvent[] = [];

const INITIAL_NOTES: OpsNoteThread[] = [];

const INITIAL_MARKETING_IDEAS: OpsMarketingIdea[] = [
  {
    id: 'mkt-demo-1',
    title: 'Q3 ROI Tool LinkedIn Ad Hook',
    channel: 'LinkedIn',
    script_content: 'Still guessing your placement metrics? Calculate exactly how much Certifyd boosts student job offers in 60 seconds -> [Link]',
    target_audience: 'College Deans & Placement Heads',
    status: 'Approved',
    created_by: 'marketing@certifyd.in',
    created_at: new Date().toISOString(),
    comments: [],
  },
];

const INITIAL_NOTIFICATIONS: OpsNotification[] = [
  {
    id: 'notif-1',
    recipient_email: 'all',
    recipient_name: 'All Team Members',
    title: 'Placement Cell Inquiry',
    message: 'New HIGH priority inquiry from Tier 1 Engineering College Placement Officer.',
    link_url: '/content/contacts',
    time: '10 min ago',
    read: false,
    priority: 'high',
    type: 'contact',
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    recipient_email: 'all',
    recipient_name: 'All Team Members',
    title: 'Submission Flagged',
    message: 'Resume submission #a3f2b1c9 flagged by team member for implausible CTC.',
    link_url: '/submissions/resumes',
    time: '25 min ago',
    read: false,
    priority: 'normal',
    type: 'submission',
    created_at: new Date().toISOString(),
  },
];

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
    const pass = m.temp_password || (m.permissions && typeof m.permissions === 'object' ? (m.permissions as any)._pass : undefined);
    map.set(cleanEmail, {
      ...existing,
      ...m,
      email: cleanEmail,
      temp_password: pass || existing?.temp_password,
      avatar_url: m.avatar_url || existing?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
    });
  }

  for (const dir of CACHE_DIRS) {
    try {
      const credsFile = path.join(dir, 'admin_credentials.json');
      if (fs.existsSync(credsFile)) {
        const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
        for (const [key, val] of Object.entries(creds || {})) {
          if (!key || typeof val !== 'string') continue;
          if (key.endsWith('_permissions')) {
            const cleanKey = key.replace('_permissions', '').toLowerCase().trim();
            const fullEmail = cleanKey.includes('@') ? cleanKey : `${cleanKey}@certifyd.in`;
            const existing = map.get(cleanKey) || map.get(fullEmail);
            if (existing) {
              try { existing.permissions = JSON.parse(val); } catch (e) {}
            }
            continue;
          }
          const cleanEmail = key.toLowerCase().trim();
          const fullEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@certifyd.in`;
          const existing = map.get(cleanEmail) || map.get(fullEmail);
          if (existing) {
            if (!existing.temp_password && val) existing.temp_password = val;
          } else {
            let parsedPerms = {
              access_marketing: true,
              access_technical: false,
              access_database: false,
              access_verifications: false,
              access_content: false,
              access_admin: false,
            };
            if (creds[`${cleanEmail}_permissions`] || creds[`${fullEmail}_permissions`]) {
              try { parsedPerms = JSON.parse(creds[`${cleanEmail}_permissions`] || creds[`${fullEmail}_permissions`]); } catch (e) {}
            }
            map.set(fullEmail, {
              id: `team-${fullEmail.replace(/[^a-z0-9]/g, '-')}`,
              email: fullEmail,
              name: fullEmail.split('@')[0] || fullEmail,
              role: fullEmail.includes('admin') || fullEmail === 'tanuj@certifyd.in' ? 'SUPER_ADMIN' : 'TEAM_MEMBER',
              permissions: parsedPerms,
              status: 'active',
              created_at: new Date().toISOString(),
              temp_password: val,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
            });
          }
        }
      }
    } catch (e) {}
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

export async function saveTeamMemberAction(member: OpsTeamMember): Promise<{ success: boolean; data: OpsTeamMember }> {
  const cleanEmail = member.email.toLowerCase().trim();
  const enhancedMember: OpsTeamMember = {
    ...member,
    email: cleanEmail,
    avatar_url: member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
  };

  try {
    const { error } = await supabaseAdmin.from('ops_team_members').upsert(enhancedMember).select().single();
    if (error) {
      const { temp_password, ...rest } = enhancedMember as any;
      await supabaseAdmin.from('ops_team_members').upsert(rest);
    }
  } catch (e) {}

  try {
    const permsPayload = enhancedMember.temp_password ? { ...(enhancedMember.permissions || {}), _pass: enhancedMember.temp_password } : enhancedMember.permissions;
    await supabaseAdmin.from('admin_users_allowlist').upsert({
      email: cleanEmail,
      role: enhancedMember.role || 'TEAM_MEMBER',
      permissions: JSON.stringify(permsPayload),
      added_at: enhancedMember.created_at || new Date().toISOString(),
    });
  } catch (e) {}

  const list = await getTeamMembersAction();
  const idx = list.findIndex((m) => m.id === enhancedMember.id || m.email.toLowerCase() === cleanEmail);
  if (idx >= 0) list[idx] = { ...list[idx], ...enhancedMember };
  else list.push(enhancedMember);
  writeLocalCache('ops_team_members', list);

  if (enhancedMember.temp_password || enhancedMember.permissions) {
    for (const dir of CACHE_DIRS) {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const credsFile = path.join(dir, 'admin_credentials.json');
        let creds: Record<string, string> = {};
        if (fs.existsSync(credsFile)) {
          creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
        }
        if (enhancedMember.temp_password) {
          creds[cleanEmail] = enhancedMember.temp_password;
          creds[cleanEmail.split('@')[0]] = enhancedMember.temp_password;
        }
        if (enhancedMember.permissions) {
          creds[`${cleanEmail}_permissions`] = JSON.stringify(enhancedMember.permissions);
          creds[`${cleanEmail.split('@')[0]}_permissions`] = JSON.stringify(enhancedMember.permissions);
        }
        fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2), 'utf-8');
      } catch (e) {}
    }
  }

  revalidatePath('/ops/team');
  revalidatePath('/ops/tasks');
  revalidatePath('/ops/calendar');
  revalidatePath('/ops/notes');
  revalidatePath('/marketing/ideas');
  revalidatePath('/ops/my-work');
  return { success: true, data: enhancedMember };
}

export async function deleteTeamMemberAction(id: string): Promise<{ success: boolean }> {
  const list = readLocalCache<OpsTeamMember>('ops_team_members', INITIAL_TEAM);
  const memberToDelete = list.find((m) => m.id === id);
  const cleanEmail = memberToDelete?.email?.toLowerCase()?.trim() || '';

  try {
    await supabaseAdmin.from('ops_team_members').delete().eq('id', id);
    if (cleanEmail) {
      await supabaseAdmin.from('ops_team_members').delete().eq('email', cleanEmail);
      await supabaseAdmin.from('admin_users_allowlist').delete().eq('email', cleanEmail);
    }
  } catch (e) {}

  const filtered = list.filter((m) => m.id !== id && (!cleanEmail || m.email.toLowerCase() !== cleanEmail));
  writeLocalCache('ops_team_members', filtered);

  if (cleanEmail) {
    for (const dir of CACHE_DIRS) {
      try {
        const credsFile = path.join(dir, 'admin_credentials.json');
        if (fs.existsSync(credsFile)) {
          const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
          delete creds[cleanEmail];
          delete creds[cleanEmail.split('@')[0]];
          if (memberToDelete?.name) delete creds[memberToDelete.name.toLowerCase()];
          fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2), 'utf-8');
        }
      } catch (e) {}
    }
  }

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
    if (!error && data && data.length > 0) {
      return data as OpsTaskItem[];
    }
  } catch (e) {}
  return readLocalCache<OpsTaskItem>('ops_tasks', INITIAL_TASKS);
}

export async function saveOpsTaskAction(task: OpsTaskItem): Promise<{ success: boolean; data: OpsTaskItem }> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_tasks').upsert(task).select().single();
    if (!error && data) {
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
      return { success: true, data: data as OpsTaskItem };
    }
  } catch (e) {}

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
    await supabaseAdmin.from('ops_tasks').delete().eq('id', id);
  } catch (e) {}

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
    if (!error && data && data.length > 0) {
      return data as OpsCalendarEvent[];
    }
  } catch (e) {}
  return readLocalCache<OpsCalendarEvent>('ops_calendar_events', INITIAL_EVENTS);
}

export async function saveCalendarEventAction(event: OpsCalendarEvent): Promise<{ success: boolean; data: OpsCalendarEvent }> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_calendar_events').upsert(event).select().single();
    if (!error && data) {
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
      return { success: true, data: data as OpsCalendarEvent };
    }
  } catch (e) {}

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
    await supabaseAdmin.from('ops_calendar_events').delete().eq('id', id);
  } catch (e) {}

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
    if (!error && data && data.length > 0) {
      return data as OpsNoteThread[];
    }
  } catch (e) {}
  return readLocalCache<OpsNoteThread>('ops_notes', INITIAL_NOTES);
}

export async function saveOpsNoteAction(note: OpsNoteThread): Promise<{ success: boolean; data: OpsNoteThread }> {
  try {
    const { data, error } = await supabaseAdmin.from('ops_notes').upsert(note).select().single();
    if (!error && data) {
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
      return { success: true, data: data as OpsNoteThread };
    }
  } catch (e) {}

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
    await supabaseAdmin.from('ops_notes').delete().eq('id', id);
  } catch (e) {}

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
    const { data: note } = await supabaseAdmin.from('ops_notes').select('*').eq('id', noteId).single();
    if (note) {
      const updatedComments = [...(note.comments || []), comment];
      await supabaseAdmin.from('ops_notes').update({ comments: updatedComments }).eq('id', noteId);
      revalidatePath('/ops/notes');
      return { success: true };
    }
  } catch (e) {}

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

  for (const dir of CACHE_DIRS) {
    const authCacheFile = path.join(dir, 'admin_credentials.json');
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let creds: Record<string, string> = {};
      if (fs.existsSync(authCacheFile)) {
        creds = JSON.parse(fs.readFileSync(authCacheFile, 'utf-8'));
      }
      creds[cleanEmail] = newPassword;
      
      const isMasterAdmin =
        cleanEmail === 'admin@certifyd.in' ||
        cleanEmail === 'admin' ||
        cleanEmail === 'superadmin@certifyd.in' ||
        cleanEmail === 'superadmin' ||
        cleanEmail === (process.env.ADMIN_USERNAME || '').toLowerCase() ||
        (creds.custom_admin_email && cleanEmail === creds.custom_admin_email.toLowerCase()) ||
        cleanEmail.includes('admin');

      if (isMasterAdmin) {
        creds['admin@certifyd.in'] = newPassword;
        creds['admin'] = newPassword;
        creds['superadmin@certifyd.in'] = newPassword;
        creds['superadmin'] = newPassword;
        if (creds.custom_admin_email) {
          creds[creds.custom_admin_email] = newPassword;
        }
      }
      fs.writeFileSync(authCacheFile, JSON.stringify(creds, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to update admin_credentials.json in', dir, e);
    }
  }

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
  for (const dir of CACHE_DIRS) {
    const authCacheFile = path.join(dir, 'admin_credentials.json');
    try {
      if (fs.existsSync(authCacheFile)) {
        const creds = JSON.parse(fs.readFileSync(authCacheFile, 'utf-8'));
        const activeEmail = creds.custom_admin_email || defaultEmail;
        const hasCustom = !!(creds[activeEmail.toLowerCase()] || creds[defaultEmail.toLowerCase()] || creds['admin@certifyd.in']);
        return { email: activeEmail, hasCustomPassword: hasCustom };
      }
    } catch (e) {}
  }
  return { email: defaultEmail, hasCustomPassword: false };
}

export async function updateAdminEmailAction(newEmail: string): Promise<{ success: boolean; message?: string }> {
  if (!newEmail || !newEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  const cleanEmail = newEmail.toLowerCase().trim();
  for (const dir of CACHE_DIRS) {
    const authCacheFile = path.join(dir, 'admin_credentials.json');
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let creds: Record<string, string> = {};
      if (fs.existsSync(authCacheFile)) {
        creds = JSON.parse(fs.readFileSync(authCacheFile, 'utf-8'));
      }
      const oldEmail = creds.custom_admin_email || 'admin@certifyd.in';
      const existingPass = creds[oldEmail] || creds['admin@certifyd.in'] || 'admin123';
      
      creds.custom_admin_email = cleanEmail;
      creds[cleanEmail] = existingPass;
      fs.writeFileSync(authCacheFile, JSON.stringify(creds, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to update admin email in', dir, e);
    }
  }
  return { success: true, message: 'Admin email updated successfully.' };
}

// ==========================================
// 8. MARKETING IDEAS & SCRIPTS ACTIONS
// ==========================================

export async function getMarketingIdeasAction(): Promise<OpsMarketingIdea[]> {
  let dbIdeas: OpsMarketingIdea[] = [];
  try {
    const { data, error } = await supabaseAdmin.from('ops_marketing_ideas').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      dbIdeas = data as OpsMarketingIdea[];
    }
  } catch (e) {}

  const cacheIdeas = readLocalCache<OpsMarketingIdea>('ops_marketing_ideas', INITIAL_MARKETING_IDEAS);
  const map = new Map<string, OpsMarketingIdea>();
  for (const item of cacheIdeas) map.set(item.id, item);
  for (const item of dbIdeas) map.set(item.id, item);

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function saveMarketingIdeaAction(idea: OpsMarketingIdea): Promise<{ success: boolean; data: OpsMarketingIdea }> {
  try {
    await supabaseAdmin.from('ops_marketing_ideas').upsert(idea);
  } catch (e) {}

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
    await supabaseAdmin.from('ops_marketing_ideas').delete().eq('id', id);
  } catch (e) {}

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
  let dbNotifs: OpsNotification[] = [];
  try {
    const { data, error } = await supabaseAdmin.from('ops_notifications').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      dbNotifs = data as OpsNotification[];
    }
  } catch (e) {}

  const cacheNotifs = readLocalCache<OpsNotification>('ops_notifications', INITIAL_NOTIFICATIONS);
  const map = new Map<string, OpsNotification>();
  for (const n of cacheNotifs) map.set(n.id, n);
  for (const n of dbNotifs) map.set(n.id, n);

  const allList = Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!userEmail) return allList;
  const cleanEmail = userEmail.toLowerCase().trim();
  const teamList = await getTeamMembersAction();
  const currentMember = teamList.find(m => m.email.toLowerCase() === cleanEmail);
  const userName = currentMember?.name?.toLowerCase().trim() || '';

  return allList.filter((n) => {
    if (n.recipient_email === 'all' || !n.recipient_email) return true;
    const recEmail = n.recipient_email.toLowerCase().trim();
    const recName = (n.recipient_name || '').toLowerCase().trim();
    if (recEmail === cleanEmail) return true;
    if (userName && recName && (userName === recName || recName.includes(userName) || userName.includes(recName))) return true;
    if (userName && recEmail && (userName === recEmail || recEmail.includes(userName) || userName.includes(recEmail))) return true;
    if (userRole === 'SUPER_ADMIN') return true;
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
    await supabaseAdmin.from('ops_notifications').upsert(notif);
  } catch (e) {}

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
