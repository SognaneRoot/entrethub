'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, Target, Plus, Trash2, CheckCircle2,
  Loader2, Wand2, ChevronRight, BookOpen, Zap, Star,
} from 'lucide-react';
import type { CareerGoal } from '@/types';

interface RoadmapStep {
  title: string;
  description: string;
  duration: string;
  resources: string[];
  priority: 'high' | 'medium' | 'low';
}

interface Roadmap {
  current_level: string;
  target_role: string;
  estimated_duration: string;
  steps: RoadmapStep[];
  key_skills: string[];
  recommended_resources: string[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high:   'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  low:    'text-teal-400 bg-teal-400/10 border-teal-400/20',
};

const GOAL_TYPES = [
  { value: 'job_search',      label: '🔍 Recherche emploi' },
  { value: 'skill_learning',  label: '📚 Apprentissage' },
  { value: 'networking',      label: '🤝 Réseau' },
  { value: 'salary',          label: '💰 Salaire' },
  { value: 'promotion',       label: '🚀 Promotion' },
];

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border border-app focus:border-[var(--teal)] text-app placeholder:text-app-muted bg-surface-2";

export default function CoachPage() {
  const [goals,       setGoals]       = useState<CareerGoal[]>([]);
  const [roadmap,     setRoadmap]     = useState<Roadmap | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [addingGoal,  setAddingGoal]  = useState(false);
  const [savingGoal,  setSavingGoal]  = useState(false);

  // Form roadmap
  const [currentJob,  setCurrentJob]  = useState('');
  const [targetJob,   setTargetJob]   = useState('');
  const [experience,  setExperience]  = useState('');

  // Form goal
  const [goalForm, setGoalForm] = useState({
    type: 'job_search',
    description: '',
    priority: 2 as 1 | 2 | 3,
    deadline: '',
  });

  useEffect(() => {
    fetch('/api/coach/goals')
      .then(r => r.json())
      .then(d => { setGoals(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const handleGenerateRoadmap = async () => {
    if (!targetJob.trim()) return;
    setGenerating(true);
    try {
      const res  = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_job: currentJob, target_role: targetJob, experience }),
      });
      const data = await res.json();
      if (data.steps) setRoadmap(data);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddGoal = async () => {
    if (!goalForm.description.trim()) return;
    setSavingGoal(true);
    try {
      const res  = await fetch('/api/coach/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalForm),
      });
      const data = await res.json();
      if (res.ok) {
        setGoals(prev => [data, ...prev]);
        setGoalForm({ type: 'job_search', description: '', priority: 2, deadline: '' });
        setAddingGoal(false);
      }
    } finally {
      setSavingGoal(false);
    }
  };

  const handleToggleGoal = async (goal: CareerGoal) => {
    const res = await fetch(`/api/coach/goals/${goal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !goal.completed, progress: !goal.completed ? 100 : goal.progress }),
    });
    const data = await res.json();
    if (res.ok) setGoals(prev => prev.map(g => g.id === goal.id ? data : g));
  };

  const handleDeleteGoal = async (id: string) => {
    await fetch(`/api/coach/goals/${id}`, { method: 'DELETE' });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const progressPct    = goals.length ? Math.round((completedGoals / goals.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-app">Career Coach IA</h1>
        <p className="text-app-muted text-sm mt-1">
          Votre roadmap personnalisée et vos objectifs pour atteindre votre prochain poste.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left — Roadmap ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Roadmap generator */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold text-app flex items-center gap-2">
              <Wand2 className="w-4 h-4" style={{ color: 'var(--teal)' }} />
              Générer ma roadmap
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-app-2">Poste actuel</label>
                <input value={currentJob} onChange={e => setCurrentJob(e.target.value)}
                  className={inputCls} placeholder="Développeur Junior" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-app-2">
                  Objectif <span style={{ color: 'var(--teal)' }}>*</span>
                </label>
                <input value={targetJob} onChange={e => setTargetJob(e.target.value)}
                  className={inputCls} placeholder="Lead Developer / CTO…" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-app-2">Expérience & contexte</label>
                <textarea rows={2} value={experience} onChange={e => setExperience(e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="2 ans d'expérience, spécialisé React, veux évoluer vers l'architecture…" />
              </div>
            </div>

            <button
              onClick={handleGenerateRoadmap}
              disabled={!targetJob.trim() || generating}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
                : <><Zap className="w-4 h-4" /> Générer ma roadmap</>
              }
            </button>
          </div>

          {/* Roadmap result */}
          {roadmap && (
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display font-semibold text-app text-lg">
                    {roadmap.current_level} → {roadmap.target_role}
                  </h2>
                  <p className="text-sm text-app-muted mt-0.5">
                    Durée estimée : <span style={{ color: 'var(--teal)' }}>{roadmap.estimated_duration}</span>
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {roadmap.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal)' }}>
                        {i + 1}
                      </div>
                      {i < roadmap.steps.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'var(--border)' }} />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-app">{step.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[step.priority]}`}>
                          {step.priority}
                        </span>
                        <span className="text-xs text-app-muted ml-auto shrink-0">{step.duration}</span>
                      </div>
                      <p className="text-sm text-app-2 leading-relaxed mb-2">{step.description}</p>
                      {step.resources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {step.resources.map((r, ri) => (
                            <span key={ri}
                              className="text-xs px-2 py-0.5 rounded-full border border-app text-app-muted"
                              style={{ backgroundColor: 'var(--surface-2)' }}>
                              📖 {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Key skills */}
              {roadmap.key_skills.length > 0 && (
                <div className="pt-4 border-t border-app">
                  <div className="text-xs font-semibold text-app-2 mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                    Compétences clés à développer
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {roadmap.key_skills.map(skill => (
                      <span key={skill}
                        className="text-xs font-medium px-2.5 py-1 rounded-full border"
                        style={{ backgroundColor: 'var(--teal-soft)', borderColor: 'var(--teal)', color: 'var(--teal)' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!roadmap && !generating && (
            <div className="card p-10 text-center">
              <BookOpen className="w-8 h-8 text-app-muted mx-auto mb-3" />
              <p className="text-sm text-app-muted">
                Renseignez votre objectif ci-dessus pour générer votre roadmap personnalisée.
              </p>
            </div>
          )}
        </div>

        {/* ── Right — Goals ───────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Progress */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-app flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: 'var(--teal)' }} />
                Mes objectifs
              </h3>
              <span className="text-xs text-app-muted">{completedGoals}/{goals.length}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: 'var(--teal)' }} />
            </div>
            <p className="text-xs text-app-muted">{progressPct}% complétés</p>
          </div>

          {/* Add goal */}
          {addingGoal ? (
            <div className="card p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Type</label>
                <select
                  value={goalForm.type}
                  onChange={e => setGoalForm(f => ({ ...f, type: e.target.value }))}
                  className={inputCls}
                >
                  {GOAL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Description</label>
                <input
                  value={goalForm.description}
                  onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))}
                  className={inputCls}
                  placeholder="Décrocher un entretien chez…"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-app-2">Priorité</label>
                  <select
                    value={goalForm.priority}
                    onChange={e => setGoalForm(f => ({ ...f, priority: Number(e.target.value) as 1 | 2 | 3 }))}
                    className={inputCls}
                  >
                    <option value={1}>🔴 Haute</option>
                    <option value={2}>🟡 Moyenne</option>
                    <option value={3}>🟢 Basse</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-app-2">Échéance</label>
                  <input type="date" value={goalForm.deadline}
                    onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddGoal} disabled={savingGoal || !goalForm.description.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl disabled:opacity-50 transition-all"
                  style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}>
                  {savingGoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Ajouter</>}
                </button>
                <button onClick={() => setAddingGoal(false)}
                  className="px-3 py-2 text-xs text-app-muted hover:text-app rounded-xl transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingGoal(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border border-dashed border-app hover:border-[var(--teal)] text-app-muted hover:text-app transition-all">
              <Plus className="w-4 h-4" /> Ajouter un objectif
            </button>
          )}

          {/* Goals list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-app-muted" />
            </div>
          ) : goals.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-xs text-app-muted">Aucun objectif défini.<br />Ajoutez-en un pour suivre votre progression.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {goals.map(goal => (
                <div key={goal.id}
                  className="card p-3 flex items-start gap-3 group">
                  <button onClick={() => handleToggleGoal(goal)}
                    className="mt-0.5 shrink-0 transition-colors">
                    <CheckCircle2 className={`w-4 h-4 ${goal.completed ? '' : 'text-app-muted'}`}
                      style={goal.completed ? { color: 'var(--teal)' } : {}} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${goal.completed ? 'line-through text-app-muted' : 'text-app'}`}>
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-app-muted">
                        {GOAL_TYPES.find(t => t.value === goal.type)?.label}
                      </span>
                      {goal.deadline && (
                        <span className="text-xs text-app-muted">
                          · {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    {/* Mini progress bar */}
                    {!goal.completed && goal.progress > 0 && (
                      <div className="mt-1.5 w-full h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: 'var(--teal)' }} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteGoal(goal.id)}
                    className="shrink-0 p-1 text-app-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
