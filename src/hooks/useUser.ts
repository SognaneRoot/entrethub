'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

export function useUser() {
  const { user: clerkUser, isLoaded, isSignedIn } = useClerkUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      // maybeSingle() retourne null si aucun résultat
      // au lieu de lancer une erreur 406 comme .single()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUser.id)
        .maybeSingle();

      if (error) {
        console.warn('[useUser] Supabase error:', error.message);
      }

      // Si l'utilisateur n'existe pas encore en DB (webhook pas encore déclenché)
      // on construit un profil minimal depuis les données Clerk
      if (!data) {
        setProfile({
          id: '',
          clerk_id: clerkUser.id,
          first_name: clerkUser.firstName ?? null,
          last_name: clerkUser.lastName ?? null,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
          avatar_url: clerkUser.imageUrl ?? null,
          current_job: null,
          seniority: null,
          target_job: null,
          subscription: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setProfile(data as UserProfile);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, clerkUser]);

  return { profile, loading, clerkUser, isSignedIn };
}
