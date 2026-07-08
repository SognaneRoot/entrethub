import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getDbUserId(clerkId: string) {
  const db = supabaseAdmin();
  const { data } = await db.from('users').select('id').eq('clerk_id', clerkId).single();
  return data?.id ?? null;
}

// GET /api/jobs
export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) return NextResponse.json([]);

  const db = supabaseAdmin();
  const { data } = await db
    .from('job_applications')
    .select('*')
    .eq('user_id', dbUserId)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

// POST /api/jobs
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { company, job_title } = body;
  if (!company || !job_title) {
    return NextResponse.json({ error: 'company et job_title requis' }, { status: 400 });
  }

  const dbUserId = await getDbUserId(userId);
  if (!dbUserId) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('job_applications')
    .insert({ ...body, user_id: dbUserId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
