'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

export function useUser() {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (!error && data) setProfile(data as UserProfile);
      setLoading(false);
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, clerkUser]);

  return { profile, loading, clerkUser, isSignedIn };
}
