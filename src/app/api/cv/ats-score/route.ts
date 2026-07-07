import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import type { CVContent } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── POST /api/cv/ats-score ────────────────────────────────────────────────
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { cv_id, content, job_offer } = await req.json() as {
    cv_id: string;
    content: CVContent;
    job_offer?: string;
  };

  // Construire le contexte CV en texte
  const cvText = buildCVText(content);

  const systemPrompt = `Tu es un expert RH et ATS (Applicant Tracking System) spécialisé dans l'analyse de CVs.
Tu dois analyser un CV et retourner UNIQUEMENT un objet JSON valide sans aucun texte avant ou après.`;

  const userPrompt = `Analyse ce CV et donne un score ATS détaillé.

CV À ANALYSER :
${cvText}

${job_offer ? `OFFRE D'EMPLOI CIBLE :\n${job_offer}` : 'Pas d\'offre spécifique — analyse générale.'}

Retourne UNIQUEMENT ce JSON (sans markdown, sans backticks) :
{
  "score": <nombre entre 0 et 100>,
  "strengths": [<liste de 3-5 points forts du CV en français>],
  "improvements": [<liste de 3-5 améliorations prioritaires en français>],
  "keywords_missing": [<liste de 5-10 mots-clés importants absents du CV>]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens:  800,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let result: {
      score: number;
      strengths: string[];
      improvements: string[];
      keywords_missing: string[];
    };

    try {
      result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'Erreur de parsing IA' }, { status: 500 });
    }

    // Sauvegarder le score dans Supabase
    if (cv_id) {
      const db = supabaseAdmin();
      await db.from('cvs').update({ ats_score: result.score }).eq('id', cv_id);
    }

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('[ATS Score] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Helper — convertit CVContent en texte lisible ─────────────────────────
function buildCVText(content: CVContent): string {
  const lines: string[] = [];

  const p = content.personal_info;
  lines.push(`NOM: ${p.name}`);
  lines.push(`EMAIL: ${p.email}`);
  if (p.location)   lines.push(`LOCALISATION: ${p.location}`);
  if (p.linkedin)   lines.push(`LINKEDIN: ${p.linkedin}`);
  if (content.summary) lines.push(`\nRÉSUMÉ:\n${content.summary}`);

  if (content.experience.length) {
    lines.push('\nEXPÉRIENCES:');
    content.experience.forEach(e => {
      if (!e.company) return;
      lines.push(`- ${e.position} chez ${e.company} (${e.start_date} → ${e.current ? 'Présent' : e.end_date})`);
      e.description.filter(Boolean).forEach(d => lines.push(`  • ${d}`));
      if (e.technologies?.length) lines.push(`  Technologies: ${e.technologies.join(', ')}`);
    });
  }

  if (content.education.length) {
    lines.push('\nFORMATION:');
    content.education.forEach(e => {
      if (!e.institution) return;
      lines.push(`- ${e.degree} en ${e.field} — ${e.institution} (${e.start_date} → ${e.end_date})`);
    });
  }

  if (content.skills.length) {
    lines.push(`\nCOMPÉTENCES: ${content.skills.join(', ')}`);
  }

  if (content.languages?.length) {
    lines.push(`\nLANGUES: ${content.languages.map(l => `${l.name} (${l.level})`).join(', ')}`);
  }

  return lines.join('\n');
}
