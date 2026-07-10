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
  const { data } = await db.from('job_applications').select('*').eq('user_id', dbUserId).order('created_at',{ ascending:false });
  return NextResponse.json(data ?? []);
}
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const body = await req.json();
  const { company, job_title } = body;
  if (!company || !job_title) return NextResponse.json({ error: 'company et job_title requis' }, { status: 400 });
  const dbUserId = await getOrCreateUser(userId);
  if (!dbUserId) return NextResponse.json({ error: 'Erreur utilisateur' }, { status: 500 });
  const db = supabaseAdmin();
  const { data, error } = await db.from('job_applications').insert({ ...body, user_id:dbUserId }).select().single();
  if (error) return NextResponse.json({ error:error.message },{ status:500 });
  return NextResponse.json(data,{ status:201 });
}
