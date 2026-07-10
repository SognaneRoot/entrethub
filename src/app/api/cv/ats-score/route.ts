import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateUser } from '@/lib/getUser';
import type { CVContent } from '@/types';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { cv_id, content, job_offer } = await req.json() as { cv_id: string; content: CVContent; job_offer?: string };
  const cvText = buildCVText(content);

  const userPrompt = `Analyse ce CV et donne un score ATS.\n\nCV :\n${cvText}\n\n${job_offer ? `OFFRE :\n${job_offer}` : 'Analyse générale.'}\n\nRetourne UNIQUEMENT ce JSON :\n{"score":<0-100>,"strengths":["..."],"improvements":["..."],"keywords_missing":["..."]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un expert ATS. Retourne UNIQUEMENT du JSON valide.' },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens:  800,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result: any;
    try { result = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return NextResponse.json({ error: 'Erreur parsing IA' }, { status: 500 }); }

    if (cv_id) {
      const db = supabaseAdmin();
      await db.from('cvs').update({ ats_score: result.score }).eq('id', cv_id);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildCVText(content: CVContent): string {
  const lines: string[] = [];
  const p = content.personal_info;
  lines.push(`NOM: ${p.name}`, `EMAIL: ${p.email}`);
  if (p.location)       lines.push(`LOCALISATION: ${p.location}`);
  if (content.summary)  lines.push(`\nRÉSUMÉ:\n${content.summary}`);
  if (content.experience.length) {
    lines.push('\nEXPÉRIENCES:');
    content.experience.forEach(e => {
      if (!e.company) return;
      lines.push(`- ${e.position} chez ${e.company}`);
      e.description.filter(Boolean).forEach(d => lines.push(`  • ${d}`));
      if (e.technologies?.length) lines.push(`  Tech: ${e.technologies.join(', ')}`);
    });
  }
  if (content.education.length) {
    lines.push('\nFORMATION:');
    content.education.forEach(e => { if (!e.institution) return; lines.push(`- ${e.degree} en ${e.field} — ${e.institution}`); });
  }
  if (content.skills.length) lines.push(`\nCOMPÉTENCES: ${content.skills.join(', ')}`);
  return lines.join('\n');
}
