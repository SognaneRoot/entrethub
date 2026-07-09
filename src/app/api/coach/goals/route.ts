import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getDbUserId(clerkId: string) {
  const db = supabaseAdmin();
  const { data } = await db.from('users').select('id').eq('clerk_id', clerkId).single();
  return data?.id ?? null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) return NextResponse.json([]);
  const db = supabaseAdmin();
  const { data } = await db.from('career_goals').select('*').eq('user_id', dbUserId).order('priority', { ascending: true }).order('created_at', { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { type, description, priority, deadline } = await req.json();
  if (!description) return NextResponse.json({ error: 'description requis' }, { status: 400 });
  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  const db = supabaseAdmin();
  const { data, error } = await db.from('career_goals').insert({ user_id: dbUserId, type: type ?? 'job_search', description, priority: priority ?? 2, deadline: deadline || null, progress: 0, completed: false }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
