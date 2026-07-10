import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateUser } from '@/lib/getUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const dbUserId = await getOrCreateUser(userId);
  if (!dbUserId) return NextResponse.json([]);

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('cvs')
    .select('*')
    .eq('user_id', dbUserId)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { title, content } = await req.json();
  if (!title || !content) return NextResponse.json({ error: 'title et content requis' }, { status: 400 });

  const dbUserId = await getOrCreateUser(userId);
  if (!dbUserId) return NextResponse.json({ error: 'Impossible de créer l\'utilisateur' }, { status: 500 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('cvs')
    .insert({ user_id: dbUserId, title, content, version: 1 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
