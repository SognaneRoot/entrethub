import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { askJSON } from '@/lib/ai';

export const dynamic    = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: 'Impossible de lire le formulaire' }, { status: 400 }); }

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

  // ── Extraction texte ──────────────────────────────────────────────
  let rawText = '';
  try {
    if (file.type === 'text/plain') {
      rawText = await file.text();
    } else if (file.type === 'application/pdf') {
      // Essai extraction texte natif
      try { rawText = await file.text(); } catch { rawText = ''; }
      // Si vide ou binaire, extraction via Gemini Vision
      if (!rawText.trim() || rawText.includes('\x00') || rawText.length < 50) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const { ai, AI_MODEL } = await import('@/lib/ai');
        const extraction = await ai.chat.completions.create({
          model: AI_MODEL,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extrais tout le texte brut de ce CV. Retourne uniquement le texte, sans commentaires.' },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } },
            ],
          }],
          max_tokens: 3000,
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

  // ── Parsing IA → CVContent ────────────────────────────────────────
  const result = await askJSON(
    'Tu es un expert en analyse de CVs. Tu convertis du texte brut en JSON structuré.',
    `Analyse ce texte de CV et retourne le JSON structuré suivant. Remplis tous les champs trouvés, laisse vide sinon.

TEXTE DU CV :
${rawText.slice(0, 4000)}

Retourne ce JSON (dates au format YYYY-MM) :
{
  "personal_info": {"name":"","email":"","phone":"","location":"","linkedin":"","github":"","portfolio":""},
  "summary": "",
  "experience": [{"id":"exp-1","company":"","position":"","start_date":"","end_date":"","current":false,"description":[""],"technologies":[]}],
  "education": [{"id":"edu-1","institution":"","degree":"","field":"","start_date":"","end_date":""}],
  "skills": [],
  "languages": [{"name":"","level":"B2"}],
  "certifications": []
}`,
    2000,
  );

  if (!result) return NextResponse.json({ error: 'Erreur de parsing IA — réessayez' }, { status: 500 });
  return NextResponse.json({ content: result });
}
