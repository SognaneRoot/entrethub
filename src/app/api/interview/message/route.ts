import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import type { InterviewMessage } from '@/types';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_QUESTIONS: Record<string,number> = { easy:5, medium:8, hard:10, expert:12 };
const DIFFICULTY_INSTRUCTIONS: Record<string,string> = { easy:'Poses des questions simples et encourageantes.', medium:'Poses des questions intermédiaires avec quelques cas pratiques.', hard:'Poses des questions difficiles, challenges les réponses.', expert:'Niveau FAANG. Questions très techniques et exigeantes.' };
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { session_id, content, job_title, difficulty, history } = await req.json() as { session_id:string; content:string; job_title:string; difficulty:string; history:InterviewMessage[] };
  const maxQ=MAX_QUESTIONS[difficulty]??8, qAsked=history.filter(m=>m.role==='interviewer').length, isStart=content==='__START__', isLastQ=qAsked>=maxQ-1;
  const systemPrompt=`Tu es un recruteur professionnel pour le poste de "${job_title}". ${DIFFICULTY_INSTRUCTIONS[difficulty]??''} Pose UNE SEULE question à la fois. ${isLastQ?'C\'est la DERNIÈRE question. Après la réponse, conclus poliment.':`Tu as posé ${qAsked} questions sur ${maxQ}.`} Réponds UNIQUEMENT en JSON : {"message":"...","interview_complete":false}`;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role:'system', content:systemPrompt }];
  if (isStart) messages.push({ role:'user', content:`Démarre l'entretien avec une phrase d'accueil et ta première question.` });
  else history.forEach(msg => messages.push({ role:msg.role==='interviewer'?'assistant':'user', content:msg.content }));
  try {
    const completion = await openai.chat.completions.create({ model:'gpt-4o-mini', messages, temperature:0.7, max_tokens:400 });
    const raw=completion.choices[0]?.message?.content??'{}';
    let parsed: { message:string; interview_complete:boolean };
    try { parsed=JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch { parsed={ message:raw, interview_complete:false }; }
    const newMsg: InterviewMessage = { role:'interviewer', content:parsed.message, timestamp:new Date().toISOString() };
    const updatedHistory = isStart?[newMsg]:[...history, newMsg];
    const db=supabaseAdmin();
    await db.from('interview_sessions').update({ transcript:updatedHistory }).eq('id',session_id);
    return NextResponse.json({ message:newMsg, interview_complete:parsed.interview_complete??false });
  } catch(err:any) { return NextResponse.json({ error:err.message },{ status:500 }); }
}
