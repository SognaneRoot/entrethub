import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import {
  FileText, Mic2, Mail, TrendingUp,
  ArrowRight, Flame, Star, Target,
  Clock, ChevronRight,
} from 'lucide-react';

async function getDashboardData(clerkId: string) {
  const db = supabaseAdmin();
  const { data: user } = await db.from('users').select('id').eq('clerk_id', clerkId).single();
  if (!user) return null;

  const [cvs, interviews, letters, goals] = await Promise.all([
    db.from('cvs').select('id').eq('user_id', user.id),
    db.from('interview_sessions').select('id,global_score,status').eq('user_id', user.id).eq('status', 'completed'),
    db.from('cover_letters').select('id').eq('user_id', user.id),
    db.from('career_goals').select('id,completed').eq('user_id', user.id),
  ]);

  const scores   = (interviews.data ?? []).map(i => i.global_score).filter(Boolean) as number[];
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return {
    cvCount:        cvs.data?.length        ?? 0,
    interviewCount: interviews.data?.length ?? 0,
    letterCount:    letters.data?.length    ?? 0,
    goalCount:      goals.data?.length      ?? 0,
    doneGoals:      (goals.data ?? []).filter(g => g.completed).length,
    avgScore,
  };
}

const QUICK_ACTIONS = [
  { title: 'Créer mon CV',         desc: 'Nouveau CV optimisé ATS',                href: '/dashboard/cv',           icon: FileText,   },
  { title: "Simuler un entretien", desc: 'Choisissez un poste et entraînez-vous',  href: '/dashboard/interview',    icon: Mic2,       },
  { title: 'Générer une lettre',   desc: 'Lettre de motivation en 30 secondes',     href: '/dashboard/cover-letter', icon: Mail,       },
  { title: 'Mon Career Coach',     desc: 'Roadmap personnalisée + recommandations', href: '/dashboard/coach',        icon: TrendingUp, },
];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const data = await getDashboardData(userId);

  const stats = [
    { label: 'CVs créés',        value: data?.cvCount        ?? 0,                          icon: FileText, href: '/dashboard/cv'        },
    { label: 'Entretiens',       value: data?.interviewCount ?? 0,                          icon: Mic2,     href: '/dashboard/interview' },
    { label: 'Score moyen',      value: data?.avgScore ? `${data.avgScore}` : '—',          icon: Star,     href: '/dashboard/progress'  },
    { label: 'Objectifs actifs', value: data?.goalCount      ?? 0,                          icon: Target,   href: '/dashboard/coach'     },
  ];

  const checklist = [
    { step: 1, label: 'Créer votre premier CV',             href: '/dashboard/cv',           done: (data?.cvCount        ?? 0) > 0 },
    { step: 2, label: "Lancer une simulation d'entretien",  href: '/dashboard/interview',    done: (data?.interviewCount ?? 0) > 0 },
    { step: 3, label: 'Générer une lettre de motivation',   href: '/dashboard/cover-letter', done: (data?.letterCount    ?? 0) > 0 },
    { step: 4, label: 'Consulter votre Career Coach',       href: '/dashboard/coach',        done: (data?.goalCount      ?? 0) > 0 },
  ];

  const doneSteps = checklist.filter(c => c.done).length;
  const pct       = Math.round((doneSteps / checklist.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-app">Tableau de bord</h1>
          <p className="text-app-muted text-sm mt-1">Votre progression en un coup d'œil 🚀</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app"
          style={{ backgroundColor: 'var(--surface-2)' }}>
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-app">0 jour</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="card p-5 group transition-all">
              <Icon className="w-4 h-4 mb-4" style={{ color: 'var(--teal)' }} />
              <div className="font-display text-2xl font-bold text-app mb-0.5">{stat.value}</div>
              <div className="text-xs text-app-muted">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display font-semibold text-app mb-4">Actions rapides</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}
                className="card flex items-center gap-4 p-5 group transition-all">
                <Icon className="w-5 h-5 shrink-0" style={{ color: 'var(--teal)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-app mb-0.5">{action.title}</div>
                  <div className="text-xs text-app-muted truncate">{action.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5" style={{ color: 'var(--teal)' }} />
          <h2 className="font-display font-semibold text-app">Démarrez en 4 étapes</h2>
          <span className="ml-auto text-xs text-app-muted">{doneSteps}/4</span>
        </div>
        <div className="space-y-2 mb-5">
          {checklist.map(item => (
            <Link key={item.step} href={item.href}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-2 transition-all group">
              <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={item.done ? { backgroundColor: 'var(--teal)', borderColor: 'var(--teal)', color: '#0F1629' }
                                 : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {item.done ? '✓' : item.step}
              </div>
              <span className={`text-sm flex-1 transition-colors ${item.done ? 'line-through text-app-muted' : 'text-app-2 group-hover:text-app'}`}>
                {item.label}
              </span>
              {!item.done && <ArrowRight className="w-4 h-4 text-app-muted group-hover:text-app transition-colors" />}
            </Link>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-xs text-app-muted mb-2">
            <span>Progression</span><span>{pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--teal), #2D41A5)' }} />
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-app-muted" />
          <h2 className="font-display font-semibold text-app">Activité récente</h2>
        </div>
        {(data?.interviewCount ?? 0) === 0 && (data?.cvCount ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <p className="text-app-muted text-sm">Aucune activité pour l'instant.</p>
            <p className="text-app-muted text-xs mt-1">Commencez par créer votre CV 👆</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.cvCount ?? 0) > 0 && (
              <div className="flex items-center gap-3 py-2 border-b border-app">
                <FileText className="w-4 h-4" style={{ color: 'var(--teal)' }} />
                <span className="text-sm text-app-2">{data!.cvCount} CV{data!.cvCount > 1 ? 's' : ''} créé{data!.cvCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {(data?.interviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-3 py-2">
                <Mic2 className="w-4 h-4" style={{ color: 'var(--teal)' }} />
                <span className="text-sm text-app-2">{data!.interviewCount} entretien{data!.interviewCount > 1 ? 's' : ''} complété{data!.interviewCount > 1 ? 's' : ''}</span>
                {data?.avgScore && (
                  <span className="ml-auto text-sm font-bold" style={{ color: 'var(--teal)' }}>Moy. {data.avgScore}/100</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
