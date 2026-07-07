import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── POST /api/cv/upload ───────────────────────────────────────────────────
// Reçoit un fichier PDF ou DOCX, extrait le texte, et demande à l'IA
// de le convertir en CVContent structuré.
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez PDF, DOCX ou TXT.' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 5MB)' }, { status: 400 });
  }

  // ── Extraction texte ───────────────────────────────────────────────────
  let rawText = '';

  try {
    if (file.type === 'text/plain') {
      rawText = await file.text();

    } else if (file.type === 'application/pdf') {
      // Envoi direct à OpenAI via base64 pour extraction
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const extraction = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extrais TOUT le texte brut de ce CV PDF. Garde la structure (nom, expériences, formations, compétences). Retourne uniquement le texte extrait, sans analyse.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64}` }
            }
          ]
        }],
        max_tokens: 2000,
      });
      rawText = extraction.choices[0]?.message?.content ?? '';

    } else {
      // DOCX — extraire texte via ArrayBuffer
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Extraction basique du texte DOCX (contenu XML)
      const decoder = new TextDecoder('utf-8');
      const xmlContent = decoder.decode(bytes);
      // Extraire le texte entre les balises <w:t>
      const matches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
      rawText = matches
        .map(m => m.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!rawText) {
        return NextResponse.json({ error: 'Impossible d\'extraire le texte du DOCX. Essayez en PDF.' }, { status: 422 });
      }
    }
  } catch (err: any) {
    console.error('[Upload] Extraction error:', err);
    return NextResponse.json({ error: 'Erreur lors de la lecture du fichier' }, { status: 500 });
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'Le fichier semble vide ou illisible' }, { status: 422 });
  }

  // ── Parsing IA → CVContent ─────────────────────────────────────────────
  const systemPrompt = `Tu es un expert en analyse de CVs. Tu reçois du texte brut extrait d'un CV et tu dois le convertir en JSON structuré.
Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.`;

  const userPrompt = `Analyse ce texte de CV et retourne le JSON structuré suivant :

TEXTE DU CV :
${rawText.slice(0, 4000)}

Retourne ce JSON (remplis tous les champs que tu trouves, laisse vide sinon) :
{
  "personal_info": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "summary": "",
  "experience": [
    {
      "id": "exp-1",
      "company": "",
      "position": "",
      "start_date": "",
      "end_date": "",
      "current": false,
      "description": [""],
      "technologies": []
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "",
      "degree": "",
      "field": "",
      "start_date": "",
      "end_date": ""
    }
  ],
  "skills": [],
  "languages": [
    { "name": "", "level": "B2" }
  ],
  "certifications": []
}

Règles :
- Les dates doivent être au format YYYY-MM (ex: 2022-03) ou vide
- description : array de strings, chaque bullet point est une entrée
- skills : array de strings simples
- Si tu détectes que c'est le poste actuel, mets current: true et end_date: ""`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens:  2000,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'Erreur de parsing IA — réessayez' }, { status: 500 });
    }

    return NextResponse.json({ content: parsed, raw_text: rawText.slice(0, 500) });

  } catch (err: any) {
    console.error('[Upload] OpenAI error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const config = {
  api: { bodyParser: false },
};
