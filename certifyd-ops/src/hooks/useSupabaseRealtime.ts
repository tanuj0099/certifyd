'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Default mock client if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export function useSupabaseRealtime<T>(table: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);

  // Sync initialData changes from parent
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;

    // Check system channel connection status
    const channel = supabaseClient
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          if (!isMounted) return;
          
          if (payload.eventType === 'INSERT') {
            setData((prev) => {
              // Ensure we don't duplicate items if they were optimistically added
              const exists = prev.some((item: any) => item.id === payload.new.id);
              if (exists) return prev.map((item: any) => item.id === payload.new.id ? payload.new as unknown as T : item);
              return [payload.new as unknown as T, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item: any) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        if (isMounted) {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false);
          }
        }
      });

    return () => {
      isMounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, [table]);

  return { data, setData, isConnected };
}
