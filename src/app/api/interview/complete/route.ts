import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import type { InterviewMessage } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { session_id, transcript, duration_minutes } = await req.json() as {
    session_id: string;
    transcript: InterviewMessage[];
    duration_minutes: number;
  };

  // Construire le texte de la conversation pour analyse
  const conversationText = transcript
    .map(m => `${m.role === 'interviewer' ? 'Recruteur' : 'Candidat'}: ${m.content}`)
    .join('\n\n');

  const systemPrompt = `Tu es un expert RH senior qui évalue les performances d'un candidat lors d'un entretien d'embauche.
Retourne UNIQUEMENT un objet JSON valide sans markdown.`;

  const userPrompt = `Évalue cet entretien et retourne le JSON suivant :

CONVERSATION :
${conversationText}

Retourne ce JSON exact :
{
  "score": <nombre 0-100>,
  "feedback": "<paragraphe de 3-4 phrases résumant les points forts et axes d'amélioration>",
  "strengths": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
  "improvements": ["<axe 1>", "<axe 2>", "<axe 3>"],
  "communication_score": <0-100>,
  "technical_score": <0-100>,
  "confidence_score": <0-100>
}

Critères d'évaluation : clarté des réponses, pertinence des exemples (méthode STAR), maîtrise technique, confiance, structure.`;

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens:  800,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result: any;
    try {
      result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      result = { score: 60, feedback: 'Analyse indisponible.', strengths: [], improvements: [] };
    }

    // Sauvegarder dans Supabase
    const db = supabaseAdmin();
    await db
      .from('interview_sessions')
      .update({
        status:           'completed',
        global_score:     result.score,
        feedback:         result.feedback,
        duration_minutes: duration_minutes ?? null,
        transcript,
      })
      .eq('id', session_id);

    // Sauvegarder dans progress_tracking
    const { data: session } = await db
      .from('interview_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (session?.user_id) {
      await db.from('progress_tracking').insert([
        { user_id: session.user_id, session_id, category: 'global',        score: result.score },
        { user_id: session.user_id, session_id, category: 'communication', score: result.communication_score ?? result.score },
        { user_id: session.user_id, session_id, category: 'technical',     score: result.technical_score ?? result.score },
        { user_id: session.user_id, session_id, category: 'confidence',    score: result.confidence_score ?? result.score },
      ]);
    }

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('[Interview Complete] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
