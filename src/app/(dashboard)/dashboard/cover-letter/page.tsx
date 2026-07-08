'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Plus, Clock, Loader2, ChevronRight,
  Briefcase, Trash2, Wand2, FileText,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface CoverLetter {
  id: string;
  title: string;
  job_title: string | null;
  company: string | null;
  tone: string;
  created_at: string;
}

interface CV {
  id: string;
  title: string;
  content: { personal_info: { name: string } };
}

const TONES = [
  { value: 'professional',  label: 'Professionnel', desc: 'Formel et structuré', emoji: '💼' },
  { value: 'enthusiastic',  label: 'Enthousiaste',  desc: 'Dynamique et motivé',  emoji: '🚀' },
  { value: 'creative',      label: 'Créatif',       desc: 'Original et personnel', emoji: '🎨' },
];

export default function CoverLetterPage() {
  const router = useRouter();

  const [letters,   setLetters]   = useState<CoverLetter[]>([]);
  const [cvs,       setCvs]       = useState<CV[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm,  setShowForm]  = useState(false);

  // Form state
  const [selectedCv,  setSelectedCv]  = useState('');
  const [jobTitle,    setJobTitle]     = useState('');
  const [company,     setCompany]      = useState('');
  const [jobOffer,    setJobOffer]     = useState('');
  const [tone,        setTone]         = useState('professional');

  useEffect(() => {
    Promise.all([
      fetch('/api/cover-letter').then(r => r.json()),
      fetch('/api/cv').then(r => r.json()),
    ]).then(([letters, cvs]) => {
      setLetters(Array.isArray(letters) ? letters : []);
      setCvs(Array.isArray(cvs) ? cvs : []);
      setLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    if (!jobTitle.trim()) return;
    setGenerating(true);
    try {
      const res  = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_id: selectedCv || null, job_title: jobTitle, company, job_offer: jobOffer, tone }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/dashboard/cover-letter/${data.id}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/cover-letter/${id}`, { method: 'DELETE' });
    setLetters(prev => prev.filter(l => l.id !== id));
  };

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border border-app focus:border-[var(--teal)] text-app placeholder:text-app-muted bg-surface-2";

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-app">Lettres de motivation</h1>
          <p className="text-app-muted text-sm mt-1">Génération IA personnalisée en 30 secondes.</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle lettre
        </button>
      </div>

      {/* Generator form */}
      {showForm && (
        <div className="card p-6 space-y-5">
          <h2 className="font-display font-semibold text-app flex items-center gap-2">
            <Wand2 className="w-4 h-4" style={{ color: 'var(--teal)' }} />
            Générer une lettre
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* CV source */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-app-2">
                CV source <span className="text-app-muted">(optionnel)</span>
              </label>
              <select
                value={selectedCv}
                onChange={e => setSelectedCv(e.target.value)}
                className={inputCls}
              >
                <option value="">Sans CV — informations générales</option>
                {cvs.map(cv => (
                  <option key={cv.id} value={cv.id}>{cv.title}</option>
                ))}
              </select>
              {cvs.length === 0 && (
                <p className="text-xs text-app-muted">
                  <Link href="/dashboard/cv" className="underline" style={{ color: 'var(--teal)' }}>
                    Créez d'abord un CV
                  </Link>{' '}pour une lettre ultra-personnalisée.
                </p>
              )}
            </div>

            {/* Tone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-app-2">Ton de la lettre</label>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center"
                    style={tone === t.value ? {
                      backgroundColor: 'var(--teal-soft)',
                      borderColor: 'var(--teal)',
                    } : {
                      backgroundColor: 'var(--surface-2)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-xs font-medium text-app">{t.label}</span>
                    <span className="text-xs text-app-muted leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Job title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-app-2">
                Poste visé <span className="text-[var(--teal)]">*</span>
              </label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Développeur Full Stack"
                className={inputCls}
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-app-2">
                Entreprise <span className="text-app-muted">(optionnel)</span>
              </label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </div>
          </div>

          {/* Job offer */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-app-2">
              Offre d'emploi <span className="text-app-muted">(recommandé pour personnaliser)</span>
            </label>
            <textarea
              rows={5}
              value={jobOffer}
              onChange={e => setJobOffer(e.target.value)}
              placeholder="Collez ici le texte de l'offre d'emploi…"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!jobTitle.trim() || generating}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</>
                : <><Wand2 className="w-4 h-4" /> Générer la lettre</>
              }
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-app-muted hover:text-app transition-colors px-4 py-2.5"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Letters list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-app-muted" />
        </div>
      ) : letters.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--teal-soft)' }}>
            <Mail className="w-6 h-6" style={{ color: 'var(--teal)' }} />
          </div>
          <h2 className="font-display font-semibold text-app">Aucune lettre pour l'instant</h2>
          <p className="text-app-muted text-sm max-w-xs mx-auto">
            Cliquez sur "Nouvelle lettre" et l'IA génère une lettre personnalisée en 30 secondes.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
          >
            <Plus className="w-4 h-4" /> Générer ma première lettre
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map(letter => (
            <Link
              key={letter.id}
              href={`/dashboard/cover-letter/${letter.id}`}
              className="card flex items-center gap-4 p-4 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--teal-soft)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--teal)' }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-app truncate">{letter.title}</div>
                <div className="flex items-center gap-2 text-xs text-app-muted mt-0.5">
                  {letter.job_title && (
                    <><Briefcase className="w-3 h-3" /><span>{letter.job_title}</span></>
                  )}
                  {letter.company && <><span>·</span><span>{letter.company}</span></>}
                  <span>·</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeDate(letter.created_at)}</span>
                  <span>·</span>
                  <span className="capitalize">{
                    TONES.find(t => t.value === letter.tone)?.emoji
                  } {TONES.find(t => t.value === letter.tone)?.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => handleDelete(e, letter.id)}
                  className="p-1.5 rounded-lg text-app-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-app-muted group-hover:text-app transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
