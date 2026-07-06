import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  FileText,
  Mic2,
  Mail,
  TrendingUp,
  ArrowRight,
  Flame,
  Star,
  Target,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// Stats cards
const STATS = [
  { label: 'CVs créés',        value: '0', icon: FileText,  color: 'from-blue-500 to-indigo-600',  href: '/dashboard/cv' },
  { label: 'Entretiens faits', value: '0', icon: Mic2,      color: 'from-teal-400 to-emerald-500', href: '/dashboard/interview' },
  { label: 'Score moyen',      value: '—', icon: Star,      color: 'from-orange-400 to-pink-500',  href: '/dashboard/progress' },
  { label: 'Jours de streak',  value: '0', icon: Flame,     color: 'from-red-400 to-orange-400',   href: '/dashboard/progress' },
];

// Quick actions
const QUICK_ACTIONS = [
  {
    title: 'Créer mon CV',
    description: 'Nouveau CV optimisé ATS en 5 minutes',
    icon: FileText,
    href: '/dashboard/cv',
    cta: 'Commencer',
    accent: 'teal',
  },
  {
    title: 'Simuler un entretien',
    description: 'Choisissez un poste et entraînez-vous',
    icon: Mic2,
    href: '/dashboard/interview',
    cta: 'Lancer',
    accent: 'blue',
  },
  {
    title: 'Générer une lettre',
    description: 'Lettre de motivation en 30 secondes',
    icon: Mail,
    href: '/dashboard/cover-letter',
    cta: 'Générer',
    accent: 'violet',
  },
  {
    title: 'Mon Career Coach',
    description: 'Roadmap personnalisée + recommandations',
    icon: TrendingUp,
    href: '/dashboard/coach',
    cta: 'Voir ma roadmap',
    accent: 'orange',
  },
];

const ACCENT_CLASSES: Record<string, string> = {
  teal:   'bg-teal-400/10 border-teal-400/20 hover:border-teal-400/40 group-hover:text-teal-300',
  blue:   'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40 group-hover:text-blue-300',
  violet: 'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40 group-hover:text-violet-300',
  orange: 'bg-orange-400/10 border-orange-400/20 hover:border-orange-400/40 group-hover:text-orange-300',
};

const ICON_CLASSES: Record<string, string> = {
  teal:   'text-teal-400',
  blue:   'text-blue-400',
  violet: 'text-violet-400',
  orange: 'text-orange-400',
};

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Bienvenue ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">
            Tableau de bord
          </h1>
          <p className="text-white/40 text-sm">
            Votre progression en un coup d'œil. Continuez sur votre lancée 🚀
          </p>
        </div>

        {/* Streak badge */}
        <div className="flex items-center gap-2 bg-orange-400/10 border border-orange-400/20 rounded-xl px-4 py-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-300">0 jour</span>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all duration-200"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="font-display text-2xl font-bold text-white mb-0.5">
                {stat.value}
              </div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-display font-semibold text-white mb-4">Actions rapides</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`group flex items-center gap-4 border rounded-2xl p-5 transition-all duration-200 ${ACCENT_CLASSES[action.accent]}`}
              >
                <div className="shrink-0">
                  <Icon className={`w-6 h-6 ${ICON_CLASSES[action.accent]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm text-white mb-0.5 transition-colors ${ACCENT_CLASSES[action.accent].split(' ').at(-1)}`}>
                    {action.title}
                  </div>
                  <div className="text-xs text-white/40 truncate">{action.description}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-white/30 group-hover:text-white/60 transition-colors shrink-0">
                  {action.cta}
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Getting started checklist ─────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-teal-400" />
          <h2 className="font-display font-semibold text-white">Démarrez en 4 étapes</h2>
        </div>

        <div className="space-y-3">
          {[
            { step: 1, label: 'Créer votre premier CV',             href: '/dashboard/cv',           done: false },
            { step: 2, label: 'Lancer une simulation d\'entretien', href: '/dashboard/interview',    done: false },
            { step: 3, label: 'Générer une lettre de motivation',   href: '/dashboard/cover-letter', done: false },
            { step: 4, label: 'Consulter votre Career Coach',       href: '/dashboard/coach',        done: false },
          ].map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/4 transition-all duration-150 group"
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                item.done
                  ? 'bg-teal-400 border-teal-400 text-navy-900'
                  : 'border-white/20 text-white/30 group-hover:border-teal-400/50 group-hover:text-teal-400/70'
              }`}>
                {item.done ? '✓' : item.step}
              </div>
              <span className={`text-sm flex-1 transition-colors ${
                item.done ? 'line-through text-white/30' : 'text-white/60 group-hover:text-white/90'
              }`}>
                {item.label}
              </span>
              {!item.done && (
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-teal-400/60 transition-colors" />
              )}
            </Link>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5 pt-4 border-t border-white/6">
          <div className="flex justify-between text-xs text-white/30 mb-2">
            <span>Progression</span>
            <span>0 / 4 étapes</span>
          </div>
          <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>

      {/* ── Recent activity placeholder ───────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-white/40" />
          <h2 className="font-display font-semibold text-white">Activité récente</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-white/30 text-sm">Aucune activité pour l'instant.</p>
          <p className="text-white/20 text-xs mt-1">Commencez par créer votre CV 👆</p>
        </div>
      </div>

    </div>
  );
}
