import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Impossible de lire le formulaire' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Fichier trop lourd (max 5MB)' }, { status: 400 });

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez PDF, DOCX ou TXT.' }, { status: 400 });
  }

  // ── Extraction texte ────────────────────────────────────────────────
  let rawText = '';
  try {
    if (file.type === 'text/plain') {
      rawText = await file.text();
    } else if (file.type === 'application/pdf') {
      // Tentative d'extraction texte natif d'abord
      rawText = await file.text();
      // Si vide ou illisible, on envoie à OpenAI vision
      if (!rawText.trim() || rawText.includes('\x00')) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const extraction = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extrais tout le texte brut de ce CV PDF. Retourne uniquement le texte.' },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } },
            ],
          }],
          max_tokens: 2000,
        });
        rawText = extraction.choices[0]?.message?.content ?? '';
      }
    } else {
      // DOCX — extraction XML
      const buffer = await file.arrayBuffer();
      const xmlContent = new TextDecoder('utf-8').decode(buffer);
      const matches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
      rawText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim();
      if (!rawText) return NextResponse.json({ error: 'Impossible d\'extraire le texte du DOCX. Essayez en PDF.' }, { status: 422 });
    }
  } catch (err: any) {
    console.error('[Upload] Extraction error:', err);
    return NextResponse.json({ error: 'Erreur lors de la lecture du fichier' }, { status: 500 });
  }

  if (!rawText.trim()) return NextResponse.json({ error: 'Le fichier semble vide ou illisible' }, { status: 422 });

  // ── Parsing IA → CVContent ──────────────────────────────────────────
  const userPrompt = `Analyse ce texte de CV et retourne le JSON structuré :\n\n${rawText.slice(0, 4000)}\n\nRetourne UNIQUEMENT ce JSON :\n{"personal_info":{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","portfolio":""},"summary":"","experience":[{"id":"exp-1","company":"","position":"","start_date":"","end_date":"","current":false,"description":[""],"technologies":[]}],"education":[{"id":"edu-1","institution":"","degree":"","field":"","start_date":"","end_date":""}],"skills":[],"languages":[{"name":"","level":"B2"}],"certifications":[]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu convertis du texte de CV en JSON structuré. Retourne UNIQUEMENT le JSON valide.' },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens:  2000,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return NextResponse.json({ error: 'Erreur de parsing IA — réessayez' }, { status: 500 }); }

    return NextResponse.json({ content: parsed });
  } catch (err: any) {
    console.error('[Upload] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
