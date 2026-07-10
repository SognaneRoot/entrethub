import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from './supabase';

/**
 * Récupère ou crée l'utilisateur Supabase à partir du clerkId.
 * Remplace le webhook pour les cas où l'utilisateur n'existe pas encore en DB.
 */
export async function getOrCreateUser(clerkId: string): Promise<string | null> {
  const db = supabaseAdmin();

  // 1. Chercher l'utilisateur existant
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // 2. Récupérer les infos depuis Clerk et créer l'entrée
  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

    const { data: created, error } = await db
      .from('users')
      .insert({
        clerk_id:   clerkId,
        email,
        first_name: clerkUser.firstName  ?? null,
        last_name:  clerkUser.lastName   ?? null,
        avatar_url: clerkUser.imageUrl   ?? null,
        subscription: 'free',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[getOrCreateUser] insert error:', error.message);
      return null;
    }

    // Créer l'abonnement gratuit par défaut
    if (created?.id) {
      await db.from('subscriptions').insert({
        user_id: created.id,
        plan:    'free',
        status:  'active',
      });
    }

    return created?.id ?? null;
  } catch (err) {
    console.error('[getOrCreateUser] Clerk error:', err);
    return null;
  }
}
