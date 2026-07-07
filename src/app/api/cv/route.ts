import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ── GET /api/cv — liste des CVs de l'utilisateur ─────────────────────────
export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const { data, error } = await db
    .from('cvs')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── POST /api/cv — créer un nouveau CV ───────────────────────────────────
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'title et content requis' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', userId).single();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const { data, error } = await db
    .from('cvs')
    .insert({ user_id: user.id, title, content, version: 1 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
