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
  const { data } = await db.from('progress_tracking').select('*').eq('user_id', dbUserId).order('created_at',{ ascending:false }).limit(100);
  return NextResponse.json(data ?? []);
}
