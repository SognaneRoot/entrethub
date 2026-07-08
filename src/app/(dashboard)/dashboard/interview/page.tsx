'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mic2, Plus, Clock, Star, ChevronRight,
  Briefcase, Loader2, Play, CheckCircle2,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { InterviewSession } from '@/types';

const JOB_PRESETS = [
  'Développeur Front-End',
  'Développeur Back-End',
  'Développeur Full Stack',
  'Product Manager',
  'Designer UX/UI',
  'Data Analyst',
  'DevOps Engineer',
  'Chef de projet',
  'Commercial / Sales',
  'Marketing Manager',
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Débutant',   desc: '5 questions, rythme doux',       color: 'text-teal-400',   bg: 'bg-teal-400/10'   },
  { value: 'medium', label: 'Intermédiaire', desc: '8 questions, cas pratiques',   color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  { value: 'hard',   label: 'Avancé',     desc: '10 questions, pression réaliste', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { value: 'expert', label: 'Expert',     desc: '12 questions, FAANG level',       color: 'text-red-400',    bg: 'bg-red-400/10'    },
];

const MAX_QUESTIONS: Record<string, number> = {
  easy: 5, medium: 8, hard: 10, expert: 12,
};

export default function InterviewPage() {
  const router = useRouter();

  const [sessions,    setSessions]    = useState<InterviewSession[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [starting,    setStarting]    = useState(false);
  const [jobTitle,    setJobTitle]    = useState('');
  const [customJob,   setCustomJob]   = useState('');
  const [difficulty,  setDifficulty]  = useState('medium');
  const [showCustom,  setShowCustom]  = useState(false);

  useEffect(() => {
    fetch('/api/interview')
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const finalJob = showCustom ? customJob : jobTitle;

  const handleStart = async () => {
    if (!finalJob.trim()) return;
    setStarting(true);
    try {
      const res  = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: finalJob, difficulty }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/dashboard/interview/${data.id}`);
    } finally {
      setStarting(false);
    }
  };

  const scoreColor = (s: number | null) =>
    s === null ? 'text-app-muted'
    : s >= 80 ? 'text-teal-400'
    : s >= 60 ? 'text-orange-400'
    : 'text-red-400';

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-app">Simulateur d'entretien</h1>
        <p className="text-app-muted text-sm mt-1">
          Entraînez-vous avec un coach IA qui pose des vraies questions et donne un feedback détaillé.
        </p>
      </div>

      {/* Setup card */}
      <div className="card p-6 space-y-6">
        <h2 className="font-display font-semibold text-app flex items-center gap-2">
          <Play className="w-4 h-4 text-[var(--teal)]" /> Nouvelle simulation
        </h2>

        {/* Job selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-app-2">Poste visé</label>
          <div className="flex flex-wrap gap-2">
            {JOB_PRESETS.map(j => (
              <button
                key={j}
                onClick={() => { setJobTitle(j); setShowCustom(false); }}
                className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150"
                style={jobTitle === j && !showCustom ? {
                  backgroundColor: 'var(--teal-soft)',
                  borderColor: 'var(--teal)',
                  color: 'var(--teal)',
                } : {
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {j}
              </button>
            ))}
            <button
              onClick={() => { setShowCustom(true); setJobTitle(''); }}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150"
              style={showCustom ? {
                backgroundColor: 'var(--teal-soft)',
                borderColor: 'var(--teal)',
                color: 'var(--teal)',
              } : {
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              + Autre poste
            </button>
          </div>

          {showCustom && (
            <input
              autoFocus
              value={customJob}
              onChange={e => setCustomJob(e.target.value)}
              placeholder="Ex : Ingénieur Machine Learning, Responsable RH…"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border border-app focus:border-[var(--teal)] text-app placeholder:text-app-muted bg-surface-2"
            />
          )}
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-app-2">Niveau de difficulté</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className="flex flex-col items-start p-3 rounded-xl border transition-all duration-150 text-left"
                style={difficulty === d.value ? {
                  backgroundColor: 'var(--teal-soft)',
                  borderColor: 'var(--teal)',
                } : {
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className={`text-sm font-semibold mb-0.5 ${d.color}`}>{d.label}</span>
                <span className="text-xs text-app-muted leading-tight">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!finalJob.trim() || starting}
          className="flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
        >
          {starting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Démarrage…</>
            : <><Play className="w-4 h-4" /> Lancer la simulation ({MAX_QUESTIONS[difficulty]} questions)</>
          }
        </button>
      </div>

      {/* Past sessions */}
      <div>
        <h2 className="font-display font-semibold text-app mb-4">Simulations passées</h2>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-app-muted" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="card p-10 text-center">
            <Mic2 className="w-8 h-8 text-app-muted mx-auto mb-3" />
            <p className="text-app-muted text-sm">Aucune simulation pour l'instant. Lancez-en une ci-dessus !</p>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map(session => (
              <Link
                key={session.id}
                href={`/dashboard/interview/${session.id}`}
                className="card flex items-center gap-4 p-4 hover:border-[var(--border-hover)] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--teal-soft)' }}>
                  <Briefcase className="w-4 h-4" style={{ color: 'var(--teal)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-app truncate">{session.job_title}</div>
                  <div className="flex items-center gap-2 text-xs text-app-muted mt-0.5">
                    <span className="capitalize">{session.difficulty}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeDate(session.created_at)}</span>
                    {session.duration_minutes && (
                      <><span>·</span><span>{session.duration_minutes} min</span></>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {session.status === 'completed' ? (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                      <span className={`text-sm font-bold ${scoreColor(session.global_score)}`}>
                        {session.global_score ?? '—'}/100
                      </span>
                    </div>
                  ) : session.status === 'in_progress' ? (
                    <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">
                      En cours
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-app-muted" />
                  )}
                  <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
