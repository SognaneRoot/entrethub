/**
 * Client IA — Google Gemini (gratuit, 1500 req/jour)
 * Modèle : gemini-1.5-flash (stable, bien supporté en free tier)
 * Clé : https://aistudio.google.com → Get API Key
 * Env : GOOGLE_AI_API_KEY=AIzaSy...
 */
import OpenAI from 'openai';

export const ai = new OpenAI({
  apiKey:  process.env.GOOGLE_AI_API_KEY ?? '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// gemini-1.5-flash = modèle gratuit le plus stable
// gemini-2.0-flash = plus récent mais parfois limité en free tier
export const AI_MODEL = 'gemini-1.5-flash';

// ── Retry avec backoff sur erreur 429 ────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes('429');
      if (is429 && i < retries - 1) {
        const wait = delayMs * Math.pow(2, i); // 2s, 4s, 8s
        console.warn(`[AI] Rate limit (429) — retry ${i + 1}/${retries} dans ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}

// ── askJSON : retourne un objet parsé ────────────────────────────────
export async function askJSON<T = any>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000,
): Promise<T | null> {
  try {
    const completion = await withRetry(() =>
      ai.chat.completions.create({
        model:       AI_MODEL,
        messages:    [
          {
            role:    'system',
            content: systemPrompt + '\nRetourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens:  maxTokens,
      })
    );

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch (err: any) {
    console.error('[AI] askJSON error:', err?.status ?? err?.message ?? err);
    return null;
  }
}

// ── askText : retourne du texte libre ────────────────────────────────
export async function askText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800,
): Promise<string> {
  try {
    const completion = await withRetry(() =>
      ai.chat.completions.create({
        model:       AI_MODEL,
        messages:    [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens:  maxTokens,
      })
    );
    return completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (err: any) {
    console.error('[AI] askText error:', err?.status ?? err?.message ?? err);
    return '';
  }
}

// ── askChat : pour les échanges multi-tours (entretien) ──────────────
export async function askChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens = 400,
): Promise<string> {
  try {
    const completion = await withRetry(() =>
      ai.chat.completions.create({
        model:       AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens:  maxTokens,
      })
    );
    return completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (err: any) {
    console.error('[AI] askChat error:', err?.status ?? err?.message ?? err);
    return '';
  }
}
