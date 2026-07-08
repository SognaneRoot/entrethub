import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();
  if (!user) return NextResponse.json([]);

  const { data } = await db
    .from('progress_tracking')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json(data ?? []);
}
