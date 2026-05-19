import { supabase } from '../lib/supabase.js'

export async function submitFeedback({ name, email, subject, message, source = 'profile_dashboard' }) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('feedback_messages')
    .insert({
      name,
      email,
      subject,
      message,
      source,
    })
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}
