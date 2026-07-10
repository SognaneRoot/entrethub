import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateUser } from '@/lib/getUser';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TONE_PROMPTS: Record<string,string> = { professional:'Ton professionnel, formel et structuré.', enthusiastic:'Ton enthousiaste et dynamique. Montre une vraie motivation.', creative:'Ton créatif et original. Se démarque des lettres classiques.' };
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { cv_id, job_title, company, job_offer, tone, replace_id } = await req.json();
  const dbUserId = await getOrCreateUser(userId);
  if (!dbUserId) return NextResponse.json({ error: 'Erreur utilisateur' }, { status: 500 });
  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id,first_name,last_name,email').eq('id', dbUserId).single();
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  let cvContext = '';
  if (cv_id) {
    const { data: cv } = await db.from('cvs').select('content').eq('id', cv_id).single();
    if (cv?.content) {
      const c = cv.content as any; const p = c.personal_info??{};
      const exps=(c.experience??[]).filter((e:any)=>e.company).map((e:any)=>`- ${e.position} chez ${e.company}\n  ${(e.description??[]).filter(Boolean).join('; ')}`).join('\n');
      cvContext=`PROFIL:\nNom: ${p.name??`${user.first_name??''} ${user.last_name??''}`.trim()}\n${c.summary?`Résumé: ${c.summary}`:''}\nEXPÉRIENCES:\n${exps}\nCOMPÉTENCES: ${(c.skills??[]).join(', ')}`;
    }
  }
  const systemPrompt=`Tu es un expert en lettres de motivation. ${TONE_PROMPTS[tone]??TONE_PROMPTS.professional} Retourne UNIQUEMENT le texte de la lettre (280-380 mots), sans titre ni balises.`;
  const userPrompt=`Poste: ${job_title}\n${company?`Entreprise: ${company}`:''}\n${job_offer?`\nOFFRE:\n${job_offer.slice(0,2000)}`:''}\n${cvContext||`Candidat: ${user.first_name??''} ${user.last_name??''}`.trim()}`;
  try {
    const completion=await openai.chat.completions.create({ model:'gpt-4o-mini', messages:[{ role:'system', content:systemPrompt },{ role:'user', content:userPrompt }], temperature:0.7, max_tokens:700 });
    const letterContent=completion.choices[0]?.message?.content?.trim()??'';
    if (!letterContent) return NextResponse.json({ error: 'Génération échouée' }, { status: 500 });
    const title=company?`Lettre — ${job_title} chez ${company}`:`Lettre — ${job_title}`;
    if (replace_id) {
      const { data }=await db.from('cover_letters').update({ content:letterContent }).eq('id',replace_id).select().single();
      return NextResponse.json(data);
    }
    const { data, error }=await db.from('cover_letters').insert({ user_id:user.id, cv_id:cv_id||null, title, job_title:job_title||null, company:company||null, job_offer:job_offer||null, tone:tone??'professional', content:letterContent }).select().single();
    if (error) return NextResponse.json({ error:error.message },{ status:500 });
    return NextResponse.json(data,{ status:201 });
  } catch(err:any) { return NextResponse.json({ error:err.message },{ status:500 }); }
}
