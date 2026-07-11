import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { askJSON } from '@/lib/ai';
import type { InterviewMessage } from '@/types';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { session_id, transcript, duration_minutes } = await req.json() as {
    session_id: string; transcript: InterviewMessage[]; duration_minutes: number;
  };

  const conversationText = transcript
    .map(m => `${m.role === 'interviewer' ? 'Recruteur' : 'Candidat'}: ${m.content}`)
    .join('\n\n');

  const result = await askJSON<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    communication_score: number;
    technical_score: number;
    confidence_score: number;
  }>(
    `Tu es un expert RH senior qui évalue les performances d'un candidat lors d'un entretien d'embauche en français.`,
    `Évalue cet entretien et retourne le JSON :

CONVERSATION :
${conversationText}

Retourne ce JSON exact :
{
  "score": <0-100>,
  "feedback": "<paragraphe de 3-4 phrases résumant points forts et axes d'amélioration>",
  "strengths": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
  "improvements": ["<axe 1>", "<axe 2>", "<axe 3>"],
  "communication_score": <0-100>,
  "technical_score": <0-100>,
  "confidence_score": <0-100>
}

Critères : clarté des réponses, pertinence des exemples (méthode STAR), maîtrise technique, confiance, structure.`,
    800,
  );

  const finalResult = result ?? { score: 60, feedback: 'Analyse indisponible.', strengths: [], improvements: [], communication_score: 60, technical_score: 60, confidence_score: 60 };

  const db = supabaseAdmin();
  await db.from('interview_sessions').update({
    status:           'completed',
    global_score:     finalResult.score,
    feedback:         finalResult.feedback,
    duration_minutes: duration_minutes ?? null,
    transcript,
  }).eq('id', session_id);

  const { data: session } = await db.from('interview_sessions').select('user_id').eq('id', session_id).single();
  if (session?.user_id) {
    await db.from('progress_tracking').insert([
      { user_id: session.user_id, session_id, category: 'global',        score: finalResult.score },
      { user_id: session.user_id, session_id, category: 'communication', score: finalResult.communication_score },
      { user_id: session.user_id, session_id, category: 'technical',     score: finalResult.technical_score },
      { user_id: session.user_id, session_id, category: 'confidence',    score: finalResult.confidence_score },
    ]);
  }

  return NextResponse.json(finalResult);
}
