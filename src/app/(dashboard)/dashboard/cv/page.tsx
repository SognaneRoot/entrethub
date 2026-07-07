import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Plus, FileText, Star, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { CV } from '@/types';

async function getUserCVs(clerkId: string): Promise<CV[]> {
  const db = supabaseAdmin();
  const { data: user } = await db
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) return [];

  const { data } = await db
    .from('cvs')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (data ?? []) as CV[];
}

export default async function CVListPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const cvs = await getUserCVs(userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mes CVs</h1>
          <p className="text-white/40 text-sm mt-1">
            {cvs.length === 0
              ? 'Créez votre premier CV optimisé ATS'
              : `${cvs.length} CV${cvs.length > 1 ? 's' : ''} enregistré${cvs.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/cv/new"
          className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-navy-900 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-teal-400/20"
        >
          <Plus className="w-4 h-4" />
          Nouveau CV
        </Link>
      </div>

      {/* Empty state */}
      {cvs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/8 rounded-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-5">
            <FileText className="w-7 h-7 text-teal-400" />
          </div>
          <h2 className="font-display font-semibold text-white text-lg mb-2">
            Aucun CV pour l'instant
          </h2>
          <p className="text-white/40 text-sm mb-6 max-w-xs">
            Créez votre premier CV et obtenez un score ATS avec des suggestions d'amélioration IA.
          </p>
          <Link
            href="/dashboard/cv/new"
            className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-navy-900 font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Créer mon premier CV
          </Link>
        </div>
      )}

      {/* CV Grid */}
      {cvs.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all duration-200"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-blue-400" />
                </div>

                {/* ATS Score badge */}
                {cv.ats_score !== null ? (
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    cv.ats_score >= 80
                      ? 'bg-teal-400/15 text-teal-300'
                      : cv.ats_score >= 60
                      ? 'bg-orange-400/15 text-orange-300'
                      : 'bg-red-400/15 text-red-300'
                  }`}>
                    <Star className="w-3 h-3" />
                    {cv.ats_score}% ATS
                  </div>
                ) : (
                  <div className="text-xs text-white/25 px-2.5 py-1 rounded-full border border-white/8">
                    Score non calculé
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="font-display font-semibold text-white text-base mb-1 truncate">
                {cv.title}
              </h3>

              {/* Meta */}
              <div className="flex items-center gap-1.5 text-xs text-white/30 mb-5">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeDate(cv.updated_at)}</span>
                <span>·</span>
                <span>v{cv.version}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/cv/${cv.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl py-2 transition-all"
                >
                  Modifier
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <form action={`/api/cv/${cv.id}`} method="DELETE">
                  <button
                    type="button"
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <Link
            href="/dashboard/cv/new"
            className="flex flex-col items-center justify-center gap-3 border border-dashed border-white/12 hover:border-teal-400/30 rounded-2xl p-5 text-white/25 hover:text-teal-400/60 transition-all duration-200 min-h-[180px]"
          >
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
