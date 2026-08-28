'use server';

import { supabaseAdmin } from '../lib/supabase/server';
import { getSession } from '../lib/auth/session';

export async function saveSubscriptionAction(subscription: any): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabaseAdmin
      .from('ops_push_subscriptions')
      .upsert({
        user_email: session.email,
        subscription_object: subscription,
      }, {
        onConflict: 'user_email, subscription_object'
      });

    if (error) {
      console.error('Failed to save subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception in saveSubscriptionAction:', err);
    return { success: false, error: err.message };
  }
}
