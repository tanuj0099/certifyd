'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { getSession } from '../lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function recordHeartbeatAction(activeSecondsToAdd: number): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const userEmail = session.email;
    const sessionDate = new Date().toISOString().split('T')[0];
    
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('ops_time_logs')
      .select('active_seconds, id')
      .eq('user_email', userEmail)
      .eq('session_date', sessionDate)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching time log:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingRecord) {
      const { error: updateError } = await supabaseAdmin
        .from('ops_time_logs')
        .update({
          last_ping: new Date().toISOString(),
          active_seconds: existingRecord.active_seconds + activeSecondsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Error updating time log:', updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('ops_time_logs')
        .insert({
          user_email: userEmail,
          session_date: sessionDate,
          session_start: new Date().toISOString(),
          last_ping: new Date().toISOString(),
          active_seconds: activeSecondsToAdd,
        });

      if (insertError) {
        console.error('Error inserting time log:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Exception in recordHeartbeatAction:', error);
    return { success: false, error: error.message };
  }
}

export async function getAttendanceLogsAction(dateString?: string): Promise<{ logs: any[], serverTime: string }> {
  try {
    const sessionDate = dateString || new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('ops_time_logs')
      .select('*')
      .eq('session_date', sessionDate)
      .order('last_ping', { ascending: false });

    if (error) {
      console.error('Error fetching attendance logs:', error);
      return { logs: [], serverTime: new Date().toISOString() };
    }
    
    return { logs: data || [], serverTime: new Date().toISOString() };
  } catch (error) {
    console.error('Exception in getAttendanceLogsAction:', error);
    return { logs: [], serverTime: new Date().toISOString() };
  }
}
