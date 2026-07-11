/**
 * Client IA — Google Gemini (gratuit, 1500 req/jour)
 * Compatible avec l'API OpenAI → zéro changement dans le code métier
 *
 * Pour obtenir une clé gratuite : https://aistudio.google.com → Get API Key
 * Ajouter dans .env.local : GOOGLE_AI_API_KEY=AIzaSy...
 */
import OpenAI from 'openai';

// Gemini via endpoint compatible OpenAI
export const ai = new OpenAI({
  apiKey:  process.env.GOOGLE_AI_API_KEY ?? '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// Modèle par défaut — Gemini 2.0 Flash (rapide, gratuit, très capable)
export const AI_MODEL = 'gemini-2.0-flash';

/**
 * Appel simplifié pour les cas JSON-only
 * Retourne le JSON parsé ou null si erreur
 */
export async function askJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000,
): Promise<T | null> {
  try {
    const completion = await ai.chat.completions.create({
      model:       AI_MODEL,
      messages:    [
        { role: 'system', content: systemPrompt + '\nRetourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks.' },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens:  maxTokens,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T;
  } catch (err) {
    console.error('[AI] askJSON error:', err);
    return null;
  }
}

/**
 * Appel simplifié pour le texte libre (lettres, réponses chat)
 */
export async function askText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800,
): Promise<string> {
  try {
    const completion = await ai.chat.completions.create({
      model:       AI_MODEL,
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens:  maxTokens,
    });
    return completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (err) {
    console.error('[AI] askText error:', err);
    return '';
  }
}
