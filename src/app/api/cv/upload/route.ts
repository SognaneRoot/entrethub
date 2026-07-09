import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop lourd (max 5MB)' }, { status: 400 });

  let rawText = '';
  try {
    if (file.type === 'text/plain') { rawText = await file.text(); }
    else if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const extraction = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: [{ type: 'text', text: 'Extrais TOUT le texte brut de ce CV PDF.' }, { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } }] }], max_tokens: 2000 });
      rawText = extraction.choices[0]?.message?.content ?? '';
    } else {
      const buffer = await file.arrayBuffer();
      const xmlContent = new TextDecoder('utf-8').decode(buffer);
      const matches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
      rawText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim();
      if (!rawText) return NextResponse.json({ error: 'Impossible d\'extraire le texte du DOCX.' }, { status: 422 });
    }
  } catch { return NextResponse.json({ error: 'Erreur lors de la lecture du fichier' }, { status: 500 }); }

  if (!rawText.trim()) return NextResponse.json({ error: 'Le fichier semble vide ou illisible' }, { status: 422 });

  const userPrompt = `Analyse ce texte de CV et retourne le JSON structuré :\n\n${rawText.slice(0, 4000)}\n\nRetourne ce JSON :\n{"personal_info":{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","portfolio":""},"summary":"","experience":[{"id":"exp-1","company":"","position":"","start_date":"","end_date":"","current":false,"description":[""],"technologies":[]}],"education":[{"id":"edu-1","institution":"","degree":"","field":"","start_date":"","end_date":""}],"skills":[],"languages":[{"name":"","level":"B2"}],"certifications":[]}`;

  try {
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Tu convertis du texte de CV en JSON structuré. Retourne UNIQUEMENT le JSON.' }, { role: 'user', content: userPrompt }], temperature: 0.1, max_tokens: 2000 });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch { return NextResponse.json({ error: 'Erreur de parsing IA' }, { status: 500 }); }
    return NextResponse.json({ content: parsed });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
