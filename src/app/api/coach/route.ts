import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { current_job, target_role, experience } = await req.json();
  if (!target_role) return NextResponse.json({ error: 'target_role requis' }, { status: 400 });
  const userPrompt = `Génère une roadmap de progression professionnelle :\nPoste actuel: ${current_job || 'Non précisé'}\nObjectif: ${target_role}\nContexte: ${experience || 'Non précisé'}\n\nRetourne ce JSON exact :\n{"current_level":"<niveau>","target_role":"${target_role}","estimated_duration":"<durée>","steps":[{"title":"","description":"","duration":"","resources":[""],"priority":"high"}],"key_skills":[""],"recommended_resources":[""]}\n\n4 à 6 étapes maximum, très concret et actionnable.`;
  try {
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Tu es un coach carrière expert. Retourne UNIQUEMENT le JSON.' }, { role: 'user', content: userPrompt }], temperature: 0.4, max_tokens: 1200 });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result: any;
    try { result = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { return NextResponse.json({ error: 'Erreur de parsing IA' }, { status: 500 }); }
    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
