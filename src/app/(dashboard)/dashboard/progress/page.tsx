'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Mic2, Star, Flame, Target, Loader2 } from 'lucide-react';

interface ProgressEntry {
  id: string;
  category: string;
  score: number;
  created_at: string;
  session_id: string | null;
}

interface SessionSummary {
  id: string;
  job_title: string;
  global_score: number | null;
  difficulty: string;
  created_at: string;
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-app-2">{label}</span>
        <span className="font-semibold" style={{ color }}>{score}/100</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniChart({ data }: { data: { date: string; score: number }[] }) {
  if (data.length < 2) return null;
  const max  = 100;
  const w    = 300;
  const h    = 80;
  const pad  = 8;

  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((d.score / max) * (h - pad * 2)),
  }));

  const path     = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L${pts[pts.length - 1].x.toFixed(1)},${(h - pad).toFixed(1)} L${pts[0].x.toFixed(1)},${(h - pad).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#scoreGrad)" />
      <path d={path} fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--teal)" />
      ))}
    </svg>
  );
}

export default function ProgressPage() {
  const [entries,  setEntries]  = useState<ProgressEntry[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/progress').then(r => r.json()),
      fetch('/api/interview').then(r => r.json()),
    ]).then(([prog, sess]) => {
      setEntries(Array.isArray(prog) ? prog : []);
      setSessions(
        (Array.isArray(sess) ? sess : [])
          .filter((s: SessionSummary) => s.global_score !== null)
          .slice(0, 10)
      );
      setLoading(false);
    });
  }, []);

  // Calculs
  const globalEntries = entries.filter(e => e.category === 'global');
  const avgScore = globalEntries.length
    ? Math.round(globalEntries.reduce((s, e) => s + e.score, 0) / globalEntries.length)
    : null;

  const avgByCategory = (cat: string) => {
    const filtered = entries.filter(e => e.category === cat);
    return filtered.length
      ? Math.round(filtered.reduce((s, e) => s + e.score, 0) / filtered.length)
      : 0;
  };

  const chartData = sessions
    .slice()
    .reverse()
    .map(s => ({ date: s.created_at, score: s.global_score ?? 0 }));

  const best  = sessions.reduce((b, s) => (s.global_score ?? 0) > (b?.global_score ?? 0) ? s : b, sessions[0]);
  const trend = globalEntries.length >= 2
    ? globalEntries[0].score - globalEntries[1].score
    : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 animate-spin text-app-muted" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-app">Ma progression</h1>
        <p className="text-app-muted text-sm mt-1">
          Visualisez l'évolution de vos scores au fil des entretiens.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Score moyen',
            value: avgScore !== null ? `${avgScore}` : '—',
            sub: 'sur 100',
            icon: Star,
            color: 'var(--teal)',
          },
          {
            label: 'Entretiens',
            value: sessions.length.toString(),
            sub: 'complétés',
            icon: Mic2,
            color: '#818CF8',
          },
          {
            label: 'Meilleur score',
            value: best ? `${best.global_score}` : '—',
            sub: best?.job_title ?? '',
            icon: Trophy,
            color: '#FBBF24',
          },
          {
            label: 'Tendance',
            value: trend !== null ? (trend >= 0 ? `+${trend}` : `${trend}`) : '—',
            sub: 'vs simulation préc.',
            icon: TrendingUp,
            color: trend !== null && trend >= 0 ? 'var(--teal)' : '#F87171',
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 space-y-2">
              <Icon className="w-4 h-4" style={{ color: stat.color }} />
              <div className="font-display text-2xl font-bold text-app">{stat.value}</div>
              <div className="text-xs text-app-muted leading-tight">
                <div className="font-medium text-app-2">{stat.label}</div>
                <div className="truncate">{stat.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {sessions.length === 0 ? (
        <div className="card p-14 text-center space-y-3">
          <Trophy className="w-10 h-10 text-app-muted mx-auto" />
          <h2 className="font-display font-semibold text-app">Aucune donnée de progression</h2>
          <p className="text-app-muted text-sm max-w-xs mx-auto">
            Complétez au moins un entretien pour voir vos statistiques apparaître ici.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">

          {/* Score evolution chart */}
          <div className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-app text-sm">Évolution du score global</h2>
            {chartData.length >= 2 ? (
              <MiniChart data={chartData} />
            ) : (
              <p className="text-xs text-app-muted py-4">Complétez au moins 2 entretiens pour voir le graphique.</p>
            )}
            <div className="flex justify-between text-xs text-app-muted">
              <span>Simulation 1</span>
              <span>Dernière</span>
            </div>
          </div>

          {/* Category scores */}
          <div className="card p-5 space-y-4">
            <h2 className="font-display font-semibold text-app text-sm">Scores par catégorie</h2>
            <ScoreBar label="Score global"     score={avgByCategory('global')}        color="var(--teal)"  />
            <ScoreBar label="Communication"    score={avgByCategory('communication')} color="#818CF8"      />
            <ScoreBar label="Technique"        score={avgByCategory('technical')}     color="#FBBF24"      />
            <ScoreBar label="Confiance"        score={avgByCategory('confidence')}    color="#F97316"      />
          </div>

          {/* Recent sessions */}
          <div className="md:col-span-2 card p-5 space-y-3">
            <h2 className="font-display font-semibold text-app text-sm">Historique des simulations</h2>
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-app last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--teal-soft)' }}>
                    <Mic2 className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-app truncate">{s.job_title}</div>
                    <div className="text-xs text-app-muted capitalize">{s.difficulty}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm"
                      style={{ color: (s.global_score ?? 0) >= 80 ? 'var(--teal)' : (s.global_score ?? 0) >= 60 ? '#F97316' : '#F87171' }}>
                      {s.global_score}/100
                    </div>
                    <div className="text-xs text-app-muted">
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
