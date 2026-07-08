import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { current_job, target_role, experience } = await req.json();
  if (!target_role) return NextResponse.json({ error: 'target_role requis' }, { status: 400 });

  const systemPrompt = `Tu es un coach carrière expert. Tu génères des roadmaps de progression professionnelle précises et actionnables en français.
Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.`;

  const userPrompt = `Génère une roadmap de progression professionnelle :
Poste actuel : ${current_job || 'Non précisé'}
Objectif : ${target_role}
Contexte : ${experience || 'Non précisé'}

Retourne ce JSON exact :
{
  "current_level": "<niveau actuel en 2-3 mots>",
  "target_role": "${target_role}",
  "estimated_duration": "<durée réaliste ex: 12-18 mois>",
  "steps": [
    {
      "title": "<titre étape court>",
      "description": "<description 1-2 phrases concrètes>",
      "duration": "<durée ex: 2-3 mois>",
      "resources": ["<ressource 1>", "<ressource 2>"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "key_skills": ["<compétence 1>", "<compétence 2>", "<compétence 3>", "<compétence 4>", "<compétence 5>"],
  "recommended_resources": ["<livre/cours 1>", "<livre/cours 2>", "<livre/cours 3>"]
}

Règles : 4 à 6 étapes maximum, resources par étape = 1-2 max, sois très concret et actionnable.`;

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens:  1200,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result: any;
    try {
      result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'Erreur de parsing IA' }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('[Coach Roadmap] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
