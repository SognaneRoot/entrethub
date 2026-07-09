import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Plus, FileText, Star, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { CV } from '@/types';

async function getUserCVs(clerkId: string): Promise<CV[]> {
  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', clerkId).single();
  if (!user) return [];
  const { data } = await db.from('cvs').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  return (data ?? []) as CV[];
}

export default async function CVListPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const cvs = await getUserCVs(userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-app">Mes CVs</h1>
          <p className="text-app-muted text-sm mt-1">
            {cvs.length === 0 ? 'Créez votre premier CV optimisé ATS' : `${cvs.length} CV${cvs.length > 1 ? 's' : ''} enregistré${cvs.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/cv/new"
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}>
          <Plus className="w-4 h-4" /> Nouveau CV
        </Link>
      </div>

      {cvs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 card text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: 'var(--teal-soft)' }}>
            <FileText className="w-7 h-7" style={{ color: 'var(--teal)' }} />
          </div>
          <h2 className="font-display font-semibold text-app text-lg mb-2">Aucun CV pour l'instant</h2>
          <p className="text-app-muted text-sm mb-6 max-w-xs">Créez votre premier CV et obtenez un score ATS avec des suggestions IA.</p>
          <Link href="/dashboard/cv/new"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}>
            <Plus className="w-4 h-4" /> Créer mon premier CV
          </Link>
        </div>
      )}

      {cvs.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {cvs.map((cv) => (
            <div key={cv.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(96,165,250,0.1)' }}>
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                {cv.ats_score !== null ? (
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    cv.ats_score >= 80 ? 'text-teal-400 bg-teal-400/10'
                    : cv.ats_score >= 60 ? 'text-orange-400 bg-orange-400/10'
                    : 'text-red-400 bg-red-400/10'
                  }`}>
                    <Star className="w-3 h-3" />{cv.ats_score}% ATS
                  </div>
                ) : (
                  <div className="text-xs text-app-muted px-2.5 py-1 rounded-full border border-app">Non analysé</div>
                )}
              </div>
              <h3 className="font-display font-semibold text-app text-base mb-1 truncate">{cv.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-app-muted mb-4">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeDate(cv.updated_at)}</span>
                <span>·</span><span>v{cv.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/cv/${cv.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-app-2 hover:text-app rounded-xl py-2 transition-all border border-app hover:border-[var(--teal)]">
                  Modifier <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          <Link href="/dashboard/cv/new"
            className="flex flex-col items-center justify-center gap-3 border border-dashed border-app hover:border-[var(--teal)] rounded-2xl p-5 text-app-muted hover:text-app transition-all min-h-[180px]">
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Nouveau CV</span>
          </Link>
        </div>
      )}
    </div>
  );
}
