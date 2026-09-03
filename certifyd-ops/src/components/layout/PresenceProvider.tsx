'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export interface PresenceState {
  user_id: string;
  user_email: string;
  user_name: string;
  online_at: string;
}

export function PresenceProvider({ children, userEmail, userName }: { children: React.ReactNode, userEmail: string, userName: string }) {
  useEffect(() => {
    if (!userEmail) return;

    let isMounted = true;
    
    // Create a Supabase channel for presence
    const channel = supabaseClient.channel('ops_presence', {
      config: {
        presence: {
          key: userEmail,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Sync event fired
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted) {
          const presenceData: PresenceState = {
            user_id: userEmail,
            user_email: userEmail,
            user_name: userName,
            online_at: new Date().toISOString(),
          };
          
          await channel.track(presenceData);
        }
      });

    return () => {
      isMounted = false;
      channel.untrack();
      supabaseClient.removeChannel(channel);
    };
  }, [userEmail, userName]);

  return <>{children}</>;
}
