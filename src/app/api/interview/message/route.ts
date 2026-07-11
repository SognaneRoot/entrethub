import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { askChat } from '@/lib/ai';
import type { InterviewMessage } from '@/types';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

const MAX_QUESTIONS: Record<string, number> = { easy: 5, medium: 8, hard: 10, expert: 12 };
const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  easy:   'Pose des questions simples et encourageantes. Rythme doux.',
  medium: 'Pose des questions intermédiaires avec quelques cas pratiques.',
  hard:   'Pose des questions difficiles, challenge les réponses, demande des exemples précis.',
  expert: 'Niveau FAANG. Questions très techniques, deep-dive sur chaque réponse. Exigeant.',
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { session_id, content, job_title, difficulty, history } = await req.json() as {
    session_id: string; content: string; job_title: string;
    difficulty: string; history: InterviewMessage[];
  };

  const maxQ    = MAX_QUESTIONS[difficulty] ?? 8;
  const qAsked  = history.filter(m => m.role === 'interviewer').length;
  const isStart = content === '__START__';
  const isLastQ = qAsked >= maxQ - 1;

  const systemPrompt = `Tu es un recruteur professionnel qui conduit un entretien en français pour le poste de "${job_title}".
${DIFFICULTY_INSTRUCTIONS[difficulty] ?? ''}
Règles : pose UNE SEULE question à la fois. Réagis brièvement à la réponse précédente (1 phrase max).
${isLastQ ? "C'est la DERNIÈRE question. Après la réponse du candidat, conclus poliment l'entretien." : `Tu as posé ${qAsked} questions sur ${maxQ}.`}
Réponds UNIQUEMENT en JSON : {"message": "...", "interview_complete": false}
Si c'est la conclusion finale après la dernière réponse, mets interview_complete: true.`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (isStart) {
    messages.push({ role: 'user', content: `Démarre l'entretien avec une phrase d'accueil courte et ta première question pour le poste de ${job_title}.` });
  } else {
    history.forEach(msg => messages.push({
      role:    msg.role === 'interviewer' ? 'assistant' : 'user',
      content: msg.content,
    }));
  }

  const raw = await askChat(messages, 400);
  if (!raw) return NextResponse.json({ error: 'Erreur IA — réessayez' }, { status: 500 });

  let parsed: { message: string; interview_complete: boolean };
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    parsed = { message: raw, interview_complete: false };
  }

  const newMsg: InterviewMessage = {
    role:      'interviewer',
    content:   parsed.message,
    timestamp: new Date().toISOString(),
  };

  const updatedHistory = isStart ? [newMsg] : [...history, newMsg];
  const db = supabaseAdmin();
  await db.from('interview_sessions').update({ transcript: updatedHistory }).eq('id', session_id);

  return NextResponse.json({ message: newMsg, interview_complete: parsed.interview_complete ?? false });
}
