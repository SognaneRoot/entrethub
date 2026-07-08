import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import type { InterviewMessage } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_QUESTIONS: Record<string, number> = {
  easy: 5, medium: 8, hard: 10, expert: 12,
};

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  easy:   'Poses des questions simples et encourageantes. Rythme doux, bienveillant.',
  medium: 'Poses des questions intermédiaires avec quelques cas pratiques. Équilibre entre technique et comportemental.',
  hard:   'Poses des questions difficiles, challenges les réponses, demande des exemples précis. Pression réaliste.',
  expert: 'Niveau FAANG. Questions très techniques, cas complexes, deep-dive sur chaque réponse. Exigeant.',
};

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { session_id, role, content, job_title, difficulty, history } = await req.json() as {
    session_id: string;
    role: string;
    content: string;
    job_title: string;
    difficulty: string;
    history: InterviewMessage[];
  };

  const maxQ       = MAX_QUESTIONS[difficulty] ?? 8;
  const qAsked     = history.filter(m => m.role === 'interviewer').length;
  const isStart    = content === '__START__';
  const isLastQ    = qAsked >= maxQ - 1;

  // Construire le system prompt
  const systemPrompt = `Tu es un recruteur professionnel qui conduit un entretien d'embauche en français pour le poste de "${job_title}".

Niveau de difficulté : ${difficulty}
Instructions : ${DIFFICULTY_INSTRUCTIONS[difficulty] ?? ''}

Règles STRICTES :
- Pose UNE SEULE question à la fois
- Réagis brièvement à la réponse précédente (1 phrase max) avant de poser la suivante
- Reste naturel et professionnel, comme un vrai recruteur
- Ne donne pas de feedback détaillé pendant l'entretien (ça vient après)
- Alterne entre questions comportementales (STAR) et techniques/situationnelles
- ${isLastQ ? 'C\'est la DERNIÈRE question. Après la réponse du candidat, conclus poliment l\'entretien en remerciant le candidat.' : `Tu as posé ${qAsked} questions sur ${maxQ} au total.`}
- Réponds UNIQUEMENT en JSON : {"message": "...", "interview_complete": false}
- Si c'est la conclusion finale (après la dernière réponse), mets interview_complete: true`;

  // Construire les messages OpenAI
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (isStart) {
    openaiMessages.push({
      role: 'user',
      content: `Démarre l'entretien avec une phrase d'accueil courte et ta première question pour le poste de ${job_title}.`,
    });
  } else {
    // Reconstruire l'historique
    history.forEach(msg => {
      openaiMessages.push({
        role: msg.role === 'interviewer' ? 'assistant' : 'user',
        content: msg.content,
      });
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    openaiMessages,
      temperature: 0.7,
      max_tokens:  400,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let parsed: { message: string; interview_complete: boolean };
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { message: raw, interview_complete: false };
    }

    const newInterviewerMsg: InterviewMessage = {
      role:      'interviewer',
      content:   parsed.message,
      timestamp: new Date().toISOString(),
    };

    // Sauvegarder le transcript mis à jour dans Supabase
    const updatedHistory = isStart
      ? [newInterviewerMsg]
      : [...history, newInterviewerMsg];

    const db = supabaseAdmin();
    await db
      .from('interview_sessions')
      .update({ transcript: updatedHistory })
      .eq('id', session_id);

    return NextResponse.json({
      message:            newInterviewerMsg,
      interview_complete: parsed.interview_complete ?? false,
    });

  } catch (err: any) {
    console.error('[Interview Message] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
