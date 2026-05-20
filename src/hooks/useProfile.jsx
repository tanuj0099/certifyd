import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.jsx';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data && mounted) {
          setProfile(data);
        } else if (!data && mounted) {
          // Profile doesn't exist, create it
          const newProfile = {
            id: user.id,
            email: user.email,
            display_name: user.displayName || '',
            photo_url: user.photoURL || '',
            created_at: new Date().toISOString()
          };
          const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
          if (!insertError && mounted) setProfile(newProfile);
        }
      } catch (err) {
        console.error('Error fetching/creating profile:', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, ...updates }));
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { error: err.message };
    }
  };

  return { profile, loading, error, updateProfile };
}
