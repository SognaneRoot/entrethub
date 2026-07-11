import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { askJSON } from '@/lib/ai';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { current_job, target_role, experience } = await req.json();
  if (!target_role) return NextResponse.json({ error: 'target_role requis' }, { status: 400 });

  const result = await askJSON(
    `Tu es un coach carrière expert. Tu génères des roadmaps de progression professionnelle précises et actionnables en français.`,
    `Génère une roadmap de progression professionnelle :
Poste actuel : ${current_job || 'Non précisé'}
Objectif : ${target_role}
Contexte : ${experience || 'Non précisé'}

Retourne ce JSON exact (4 à 6 étapes max, très concret et actionnable) :
{
  "current_level": "<niveau actuel en 2-3 mots>",
  "target_role": "${target_role}",
  "estimated_duration": "<durée réaliste ex: 12-18 mois>",
  "steps": [
    {
      "title": "<titre court>",
      "description": "<1-2 phrases concrètes>",
      "duration": "<durée ex: 2-3 mois>",
      "resources": ["<ressource 1>", "<ressource 2>"],
      "priority": "high"
    }
  ],
  "key_skills": ["<compétence 1>", "<compétence 2>", "<compétence 3>", "<compétence 4>", "<compétence 5>"],
  "recommended_resources": ["<livre/cours 1>", "<livre/cours 2>", "<livre/cours 3>"]
}`,
    1200,
  );

  if (!result) return NextResponse.json({ error: 'Erreur IA — réessayez' }, { status: 500 });
  return NextResponse.json(result);
}
