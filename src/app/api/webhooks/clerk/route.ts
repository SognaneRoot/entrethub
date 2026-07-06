import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabaseAdmin } from '@/lib/supabase';

// Ce endpoint est appelé automatiquement par Clerk à chaque événement
// (user.created, user.updated, user.deleted)
// → Configure l'URL dans Clerk Dashboard > Webhooks

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }

  // Vérification signature Svix
  const headerPayload = headers();
  const svix_id        = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await req.json();
  const body    = JSON.stringify(payload);

  let evt: any;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(body, {
      'svix-id':        svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // ── user.created ────────────────────────────────────────────────────────
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? '';

    const { error } = await db.from('users').insert({
      clerk_id:   id,
      email,
      first_name: first_name ?? null,
      last_name:  last_name  ?? null,
      avatar_url: image_url  ?? null,
    });

    if (error) {
      console.error('[Webhook] user.created error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Créer abonnement free par défaut
    const { data: user } = await db
      .from('users')
      .select('id')
      .eq('clerk_id', id)
      .single();

    if (user) {
      await db.from('subscriptions').insert({
        user_id: user.id,
        plan:    'free',
        status:  'active',
      });
    }

    console.log('[Webhook] user.created →', email);
  }

  // ── user.updated ────────────────────────────────────────────────────────
  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? '';

    const { error } = await db
      .from('users')
      .update({
        email,
        first_name: first_name ?? null,
        last_name:  last_name  ?? null,
        avatar_url: image_url  ?? null,
      })
      .eq('clerk_id', id);

    if (error) console.error('[Webhook] user.updated error:', error);
    console.log('[Webhook] user.updated →', email);
  }

  // ── user.deleted ────────────────────────────────────────────────────────
  if (evt.type === 'user.deleted') {
    const { id } = evt.data;
    const { error } = await db.from('users').delete().eq('clerk_id', id);
    if (error) console.error('[Webhook] user.deleted error:', error);
    console.log('[Webhook] user.deleted →', id);
  }

  return NextResponse.json({ received: true });
}
