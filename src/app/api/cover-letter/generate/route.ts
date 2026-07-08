import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic  = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TONE_PROMPTS: Record<string, string> = {
  professional: 'Ton professionnel, formel et structuré. Style clair et sobre. Vocabulaire précis et soutenu.',
  enthusiastic: 'Ton enthousiaste et dynamique. Montre une vraie motivation et énergie. Style direct et vivant.',
  creative:     'Ton créatif et original. Accroche innovante, tournures personnelles. Se démarque des lettres classiques.',
};

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { cv_id, job_title, company, job_offer, tone, replace_id } = await req.json();

  const db = supabaseAdmin();

  // Récupérer l'ID Supabase de l'utilisateur
  const { data: user } = await db
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('clerk_id', userId)
    .single();

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
        .map((e: any) => `- ${e.position} chez ${e.company} (${e.start_date}→${e.current ? 'présent' : e.end_date})\n  ${(e.description ?? []).filter(Boolean).join('; ')}`)
        .join('\n');
      const edu = (c.education ?? [])
        .filter((e: any) => e.institution)
        .map((e: any) => `- ${e.degree} en ${e.field} — ${e.institution}`)
        .join('\n');

      cvContext = `
PROFIL DU CANDIDAT :
Nom : ${p.name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}
Email : ${p.email ?? user.email}
${p.location ? `Localisation : ${p.location}` : ''}
${c.summary ? `Résumé : ${c.summary}` : ''}

EXPÉRIENCES :
${exps || 'Non renseignées'}

FORMATION :
${edu || 'Non renseignée'}

COMPÉTENCES : ${(c.skills ?? []).join(', ') || 'Non renseignées'}
${(c.languages ?? []).length ? `LANGUES : ${c.languages.map((l: any) => `${l.name} (${l.level})`).join(', ')}` : ''}`.trim();
    }
  }

  const systemPrompt = `Tu es un expert en rédaction de lettres de motivation professionnelles en français.
Tu dois rédiger une lettre de motivation personnalisée, convaincante et adaptée.
${TONE_PROMPTS[tone] ?? TONE_PROMPTS.professional}

Retourne UNIQUEMENT le texte de la lettre, sans titre, sans balises, sans explication.
La lettre doit faire entre 280 et 380 mots.
Format : introduction + 2-3 paragraphes corps + conclusion avec formule de politesse.`;

  const userPrompt = `Rédige une lettre de motivation pour :
Poste : ${job_title}
${company ? `Entreprise : ${company}` : ''}
${job_offer ? `\nOFFRE D'EMPLOI :\n${job_offer.slice(0, 2000)}` : ''}
${cvContext ? `\n${cvContext}` : `\nCandidat : ${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()}

Si l'entreprise est mentionnée, cite-la naturellement dans la lettre.
Sois précis, évite les généralités, mets en avant les compétences clés du poste.`;

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens:  700,
    });

    const letterContent = completion.choices[0]?.message?.content?.trim() ?? '';
    if (!letterContent) return NextResponse.json({ error: 'Génération échouée' }, { status: 500 });

    const title = company
      ? `Lettre — ${job_title} chez ${company}`
      : `Lettre — ${job_title}`;

    // Mettre à jour si replace_id, sinon créer
    if (replace_id) {
      const { data } = await db
        .from('cover_letters')
        .update({ content: letterContent })
        .eq('id', replace_id)
        .select()
        .single();
      return NextResponse.json(data);
    }

    // Créer nouvelle entrée
    const { data, error } = await db
      .from('cover_letters')
      .insert({
        user_id:   user.id,
        cv_id:     cv_id || null,
        title,
        job_title: job_title || null,
        company:   company   || null,
        job_offer: job_offer || null,
        tone:      tone ?? 'professional',
        content:   letterContent,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });

  } catch (err: any) {
    console.error('[Cover Letter] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
