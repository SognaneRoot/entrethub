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
  const { data } = await db.from('cover_letters').select('id,title,job_title,company,tone,created_at').eq('user_id', dbUserId).order('created_at', { ascending: false });
  return NextResponse.json(data ?? []);
}
