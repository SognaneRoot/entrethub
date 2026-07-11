import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { askJSON } from '@/lib/ai';
import type { CVContent } from '@/types';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { cv_id, content, job_offer } = await req.json() as {
    cv_id?: string; content: CVContent; job_offer?: string;
  };

  const cvText = buildCVText(content);

  const result = await askJSON<{
    score: number;
    strengths: string[];
    improvements: string[];
    keywords_missing: string[];
  }>(
    `Tu es un expert RH et ATS (Applicant Tracking System) spécialisé dans l'analyse de CVs en français.`,
    `Analyse ce CV et donne un score ATS détaillé.

CV À ANALYSER :
${cvText}

${job_offer ? `OFFRE D'EMPLOI CIBLE :\n${job_offer.slice(0, 2000)}` : "Pas d'offre spécifique — analyse générale."}

Retourne ce JSON :
{
  "score": <nombre entre 0 et 100>,
  "strengths": [<3-5 points forts en français>],
  "improvements": [<3-5 améliorations prioritaires en français>],
  "keywords_missing": [<5-10 mots-clés importants absents>]
}`,
    800,
  );

  if (!result) return NextResponse.json({ error: 'Erreur IA — réessayez' }, { status: 500 });

  // Sauvegarder le score
  if (cv_id) {
    const db = supabaseAdmin();
    await db.from('cvs').update({ ats_score: result.score }).eq('id', cv_id);
  }

  return NextResponse.json(result);
}

function buildCVText(content: CVContent): string {
  const lines: string[] = [];
  const p = content.personal_info;
  lines.push(`NOM: ${p.name}`, `EMAIL: ${p.email}`);
  if (p.location)       lines.push(`LOCALISATION: ${p.location}`);
  if (content.summary)  lines.push(`\nRÉSUMÉ:\n${content.summary}`);
  if (content.experience?.length) {
    lines.push('\nEXPÉRIENCES:');
    content.experience.forEach(e => {
      if (!e.company) return;
      lines.push(`- ${e.position} chez ${e.company} (${e.start_date}→${e.current ? 'présent' : e.end_date})`);
      e.description?.filter(Boolean).forEach(d => lines.push(`  • ${d}`));
      if (e.technologies?.length) lines.push(`  Tech: ${e.technologies.join(', ')}`);
    });
  }
  if (content.education?.length) {
    lines.push('\nFORMATION:');
    content.education.forEach(e => {
      if (!e.institution) return;
      lines.push(`- ${e.degree} en ${e.field} — ${e.institution}`);
    });
  }
  if (content.skills?.length) lines.push(`\nCOMPÉTENCES: ${content.skills.join(', ')}`);
  if (content.languages?.length) lines.push(`\nLANGUES: ${content.languages.map(l => `${l.name} (${l.level})`).join(', ')}`);
  return lines.join('\n');
}
