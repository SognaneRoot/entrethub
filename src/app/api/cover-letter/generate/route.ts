import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateUser } from '@/lib/getUser';
import { askText } from '@/lib/ai';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

const TONE_PROMPTS: Record<string, string> = {
  professional: 'Ton professionnel, formel et structuré. Style clair et sobre.',
  enthusiastic: 'Ton enthousiaste et dynamique. Montre une vraie motivation et énergie.',
  creative:     'Ton créatif et original. Accroche innovante, tournures personnelles.',
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { cv_id, job_title, company, job_offer, tone, replace_id } = await req.json();

  const dbUserId = await getOrCreateUser(userId);
  if (!dbUserId) return NextResponse.json({ error: 'Erreur utilisateur' }, { status: 500 });

  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id,first_name,last_name,email').eq('id', dbUserId).single();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  // Récupérer le CV si fourni
  let cvContext = '';
  if (cv_id) {
    const { data: cv } = await db.from('cvs').select('content').eq('id', cv_id).single();
    if (cv?.content) {
      const c = cv.content as any;
      const p = c.personal_info ?? {};
      const exps = (c.experience ?? [])
        .filter((e: any) => e.company)
        .map((e: any) => `- ${e.position} chez ${e.company}\n  ${(e.description ?? []).filter(Boolean).join('; ')}`)
        .join('\n');
      cvContext = `PROFIL DU CANDIDAT :
Nom : ${p.name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}
Email : ${p.email ?? user.email}
${p.location ? `Localisation : ${p.location}` : ''}
${c.summary ? `Résumé : ${c.summary}` : ''}
EXPÉRIENCES :
${exps || 'Non renseignées'}
COMPÉTENCES : ${(c.skills ?? []).join(', ') || 'Non renseignées'}`;
    }
  }

  const systemPrompt = `Tu es un expert en rédaction de lettres de motivation professionnelles en français.
${TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional}
Retourne UNIQUEMENT le texte de la lettre (entre 280 et 380 mots), sans titre, sans balises, sans explication.
Format : introduction accrochante + 2-3 paragraphes corps + conclusion avec formule de politesse.`;

  const userPrompt = `Rédige une lettre de motivation pour :
Poste : ${job_title}
${company ? `Entreprise : ${company}` : ''}
${job_offer ? `\nOFFRE D'EMPLOI :\n${job_offer.slice(0, 2000)}` : ''}
${cvContext || `Candidat : ${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}

Si l'entreprise est mentionnée, cite-la naturellement. Sois précis, évite les généralités.`;

  const letterContent = await askText(systemPrompt, userPrompt, 700);
  if (!letterContent) return NextResponse.json({ error: 'Génération échouée — réessayez' }, { status: 500 });

  const title = company ? `Lettre — ${job_title} chez ${company}` : `Lettre — ${job_title}`;

  if (replace_id) {
    const { data } = await db.from('cover_letters').update({ content: letterContent }).eq('id', replace_id).select().single();
    return NextResponse.json(data);
  }

  const { data, error } = await db.from('cover_letters').insert({
    user_id:   user.id,
    cv_id:     cv_id || null,
    title,
    job_title: job_title || null,
    company:   company   || null,
    job_offer: job_offer || null,
    tone:      tone ?? 'professional',
    content:   letterContent,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
