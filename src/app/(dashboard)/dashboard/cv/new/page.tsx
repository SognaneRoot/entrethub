'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  User, Briefcase, GraduationCap, Code2, Award,
  Plus, Trash2, ArrowRight, ArrowLeft, Save,
  Loader2, Upload, FileText, X, Globe, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CVContent, WorkExperience, Education } from '@/types';

type Step = 'choose' | 'personal' | 'experience' | 'education' | 'skills' | 'review';

const FORM_STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'personal',   label: 'Infos perso.',  icon: User },
  { id: 'experience', label: 'Expériences',   icon: Briefcase },
  { id: 'education',  label: 'Formation',     icon: GraduationCap },
  { id: 'skills',     label: 'Compétences',   icon: Code2 },
  { id: 'review',     label: 'Finaliser',     icon: Award },
];

const emptyExperience = (): WorkExperience => ({
  id: crypto.randomUUID(),
  company: '', position: '', start_date: '', end_date: '',
  current: false, description: [''], technologies: [],
});

const emptyEducation = (): Education => ({
  id: crypto.randomUUID(),
  institution: '', degree: '', field: '', start_date: '', end_date: '',
});

const emptyContent = (name = '', email = ''): CVContent => ({
  personal_info: { name, email, phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  experience: [emptyExperience()],
  education: [emptyEducation()],
  skills: [],
  languages: [],
  certifications: [],
});

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">
        {label}{required && <span className="text-teal-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/5 border border-white/10 focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all";

export default function NewCVPage() {
  const router   = useRouter();
  const { user } = useUser();

  const [step,       setStep]       = useState<Step>('choose');
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadErr,  setUploadErr]  = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const [title,      setTitle]      = useState('Mon CV');
  const [skillInput, setSkillInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState<CVContent>(
    emptyContent(user?.fullName ?? '', user?.primaryEmailAddress?.emailAddress ?? '')
  );

  const formStepIndex = FORM_STEPS.findIndex(s => s.id === step);

  // ── Upload handler ────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploadErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res  = await fetch('/api/cv/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) { setUploadErr(data.error ?? 'Erreur upload'); return; }

      // Pré-remplir le contenu avec les données extraites
      setContent(prev => ({
        ...data.content,
        // Garder email/name Clerk si vide
        personal_info: {
          ...data.content.personal_info,
          name:  data.content.personal_info.name  || prev.personal_info.name,
          email: data.content.personal_info.email || prev.personal_info.email,
        },
      }));
      setUploadDone(true);
      // Aller directement à l'étape de vérification
      setTimeout(() => setStep('personal'), 800);
    } catch {
      setUploadErr('Erreur réseau — réessayez');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ── CV helpers ────────────────────────────────────────────────────────
  const updatePersonal = (f: string, v: string) =>
    setContent(c => ({ ...c, personal_info: { ...c.personal_info, [f]: v } }));

  const updateExp = (id: string, f: string, v: any) =>
    setContent(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, [f]: v } : e) }));

  const updateExpDesc = (id: string, i: number, v: string) =>
    setContent(c => ({ ...c, experience: c.experience.map(e =>
      e.id === id ? { ...e, description: e.description.map((d, di) => di === i ? v : d) } : e
    )}));

  const addExpDesc  = (id: string) =>
    setContent(c => ({ ...c, experience: c.experience.map(e =>
      e.id === id ? { ...e, description: [...e.description, ''] } : e
    )}));

  const removeExpDesc = (id: string, i: number) =>
    setContent(c => ({ ...c, experience: c.experience.map(e =>
      e.id === id ? { ...e, description: e.description.filter((_, di) => di !== i) } : e
    )}));

  const updateEdu = (id: string, f: string, v: string) =>
    setContent(c => ({ ...c, education: c.education.map(e => e.id === id ? { ...e, [f]: v } : e) }));

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !content.skills.includes(t)) setContent(c => ({ ...c, skills: [...c.skills, t] }));
    setSkillInput('');
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/dashboard/cv/${data.id}`);
      else alert(data.error ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => step === 'choose' ? router.back() : setStep(FORM_STEPS[formStepIndex - 1]?.id ?? 'choose')}
          className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/6 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          {step !== 'choose' && (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-display font-bold text-xl text-white bg-transparent outline-none border-b border-transparent focus:border-teal-400/40 transition-colors pb-0.5 w-full"
              placeholder="Nom de votre CV"
            />
          )}
          {step === 'choose' && (
            <h1 className="font-display font-bold text-xl text-white">Créer un CV</h1>
          )}
        </div>
      </div>

      {/* Step pills (sauf écran choose) */}
      {step !== 'choose' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FORM_STEPS.map((s, i) => {
            const Icon   = s.icon;
            const done   = i < formStepIndex;
            const active = s.id === step;
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                  active ? 'bg-teal-400/15 text-teal-300 border-teal-400/20'
                         : done ? 'bg-white/8 text-white/60 border-white/8'
                                : 'bg-transparent text-white/25 border-white/6'
                )}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {s.label}
                {done && <span className="text-teal-400 text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── ÉTAPE CHOOSE ─────────────────────────────────────────────────── */}
      {step === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Option 1 — Depuis zéro */}
          <button
            onClick={() => setStep('personal')}
            className="group flex flex-col items-start gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-teal-400/30 rounded-2xl p-6 text-left transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-400/10 flex items-center justify-center group-hover:bg-teal-400/20 transition-colors">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-1">Créer depuis zéro</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Remplissez le formulaire guidé étape par étape. Recommandé si vous n'avez pas encore de CV.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-teal-400 mt-auto">
              Commencer <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Option 2 — Upload */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-start gap-4 border rounded-2xl p-6 transition-all duration-200',
              dragOver
                ? 'bg-blue-500/10 border-blue-400/40'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-dashed border-white/15 hover:border-white/25'
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              {uploading
                ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                : uploadDone
                ? <CheckCircle2 className="w-5 h-5 text-teal-400" />
                : <Upload className="w-5 h-5 text-blue-400" />
              }
            </div>

            <div className="flex-1">
              <h3 className="font-display font-semibold text-white mb-1">
                {uploadDone ? 'CV importé !' : 'Importer mon CV'}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {uploadDone
                  ? 'Vos informations ont été extraites. Redirection en cours…'
                  : 'Glissez-déposez ou sélectionnez votre CV. L\'IA extrait automatiquement vos informations.'
                }
              </p>
              {uploadErr && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <X className="w-3 h-3" /> {uploadErr}
                </p>
              )}
            </div>

            {!uploadDone && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={onFileChange}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-xs font-medium text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 disabled:opacity-50 px-4 py-2 rounded-xl transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Import en cours…' : 'Choisir un fichier'}
                </button>
                <p className="text-xs text-white/20">PDF, DOCX ou TXT — max 5MB</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ÉTAPE PERSONAL ───────────────────────────────────────────────── */}
      {step === 'personal' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
          {uploadDone && (
            <div className="flex items-center gap-2 bg-teal-400/8 border border-teal-400/15 rounded-xl px-4 py-3 text-sm text-teal-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              CV importé et analysé par l'IA. Vérifiez et complétez les informations ci-dessous.
            </div>
          )}
          <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-teal-400" /> Informations personnelles
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'name',      label: 'Nom complet',   ph: 'Jean Dupont',            required: true },
              { key: 'email',     label: 'Email',         ph: 'jean@exemple.com',       required: true, type: 'email' },
              { key: 'phone',     label: 'Téléphone',     ph: '+33 6 12 34 56 78' },
              { key: 'location',  label: 'Localisation',  ph: 'Paris, France' },
              { key: 'linkedin',  label: 'LinkedIn',      ph: 'linkedin.com/in/…' },
              { key: 'github',    label: 'GitHub / Portfolio', ph: 'github.com/…' },
            ].map(f => (
              <Field key={f.key} label={f.label} required={f.required}>
                <input
                  type={f.type ?? 'text'}
                  className={inputCls}
                  placeholder={f.ph}
                  value={(content.personal_info as any)[f.key] ?? ''}
                  onChange={e => updatePersonal(f.key, e.target.value)}
                />
              </Field>
            ))}
          </div>
          <Field label="Résumé professionnel">
            <textarea rows={4} className={cn(inputCls, 'resize-none')}
              placeholder="Développeur Full Stack avec 5 ans d'expérience…"
              value={content.summary ?? ''}
              onChange={e => setContent(c => ({ ...c, summary: e.target.value }))} />
          </Field>
        </div>
      )}

      {/* ── ÉTAPE EXPERIENCE ─────────────────────────────────────────────── */}
      {step === 'experience' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal-400" /> Expériences
            </h2>
            <button onClick={() => setContent(c => ({ ...c, experience: [...c.experience, emptyExperience()] }))}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-400/10 hover:bg-teal-400/15 px-3 py-1.5 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>

          <div className="space-y-5">
            {content.experience.map((exp, idx) => (
              <div key={exp.id} className="border border-white/8 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">Expérience {idx + 1}</span>
                  {content.experience.length > 1 && (
                    <button onClick={() => setContent(c => ({ ...c, experience: c.experience.filter(e => e.id !== exp.id) }))}
                      className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Entreprise" required>
                    <input className={inputCls} placeholder="Acme Corp" value={exp.company}
                      onChange={e => updateExp(exp.id, 'company', e.target.value)} />
                  </Field>
                  <Field label="Poste" required>
                    <input className={inputCls} placeholder="Développeur Front-End" value={exp.position}
                      onChange={e => updateExp(exp.id, 'position', e.target.value)} />
                  </Field>
                  <Field label="Date début">
                    <input className={inputCls} type="month" value={exp.start_date}
                      onChange={e => updateExp(exp.id, 'start_date', e.target.value)} />
                  </Field>
                  <Field label="Date fin">
                    <input className={inputCls} type="month" value={exp.end_date ?? ''} disabled={exp.current}
                      onChange={e => updateExp(exp.id, 'end_date', e.target.value)} />
                    <label className="flex items-center gap-2 text-xs text-white/40 mt-1 cursor-pointer">
                      <input type="checkbox" checked={exp.current ?? false} className="accent-teal-400"
                        onChange={e => updateExp(exp.id, 'current', e.target.checked)} />
                      Poste actuel
                    </label>
                  </Field>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Missions</label>
                  {exp.description.map((d, di) => (
                    <div key={di} className="flex items-center gap-2">
                      <span className="text-teal-400 text-sm shrink-0">•</span>
                      <input className={cn(inputCls, 'flex-1')} placeholder="Développé une API REST…"
                        value={d} onChange={e => updateExpDesc(exp.id, di, e.target.value)} />
                      {exp.description.length > 1 && (
                        <button onClick={() => removeExpDesc(exp.id, di)}
                          className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addExpDesc(exp.id)}
                    className="text-xs text-white/30 hover:text-teal-400 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter une mission
                  </button>
                </div>
                <Field label="Technologies">
                  <input className={inputCls} placeholder="React, Node.js, PostgreSQL"
                    value={(exp.technologies ?? []).join(', ')}
                    onChange={e => updateExp(exp.id, 'technologies',
                      e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
                </Field>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE EDUCATION ──────────────────────────────────────────────── */}
      {step === 'education' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-400" /> Formation
            </h2>
            <button onClick={() => setContent(c => ({ ...c, education: [...c.education, emptyEducation()] }))}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-400/10 hover:bg-teal-400/15 px-3 py-1.5 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="space-y-4">
            {content.education.map((edu, idx) => (
              <div key={edu.id} className="border border-white/8 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">Formation {idx + 1}</span>
                  {content.education.length > 1 && (
                    <button onClick={() => setContent(c => ({ ...c, education: c.education.filter(e => e.id !== edu.id) }))}
                      className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Établissement" required>
                    <input className={inputCls} placeholder="Université Paris-Saclay" value={edu.institution}
                      onChange={e => updateEdu(edu.id, 'institution', e.target.value)} />
                  </Field>
                  <Field label="Diplôme" required>
                    <input className={inputCls} placeholder="Master" value={edu.degree}
                      onChange={e => updateEdu(edu.id, 'degree', e.target.value)} />
                  </Field>
                  <Field label="Spécialité" required>
                    <input className={inputCls} placeholder="Informatique" value={edu.field}
                      onChange={e => updateEdu(edu.id, 'field', e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Début">
                      <input className={inputCls} type="month" value={edu.start_date}
                        onChange={e => updateEdu(edu.id, 'start_date', e.target.value)} />
                    </Field>
                    <Field label="Fin">
                      <input className={inputCls} type="month" value={edu.end_date ?? ''}
                        onChange={e => updateEdu(edu.id, 'end_date', e.target.value)} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE SKILLS ─────────────────────────────────────────────────── */}
      {step === 'skills' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
            <Code2 className="w-5 h-5 text-teal-400" /> Compétences & langues
          </h2>
          <Field label="Ajouter une compétence">
            <div className="flex gap-2">
              <input className={cn(inputCls, 'flex-1')} placeholder="React, Python…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
              <button onClick={addSkill}
                className="px-4 bg-teal-400/15 hover:bg-teal-400/25 text-teal-300 rounded-xl transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Field>
          {content.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.skills.map(s => (
                <span key={s} className="flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">
                  {s}
                  <button onClick={() => setContent(c => ({ ...c, skills: c.skills.filter(sk => sk !== s) }))}
                    className="text-white/30 hover:text-red-400 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-white/25">Appuyez sur <kbd className="bg-white/10 px-1.5 py-0.5 rounded">Entrée</kbd> après chaque compétence</p>

          {/* Langues */}
          <div className="pt-2 border-t border-white/6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Langues
              </label>
              <button onClick={() => setContent(c => ({ ...c, languages: [...(c.languages ?? []), { name: '', level: 'B2' }] }))}
                className="text-xs text-white/30 hover:text-teal-400 flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            {(content.languages ?? []).map((lang, i) => (
              <div key={i} className="flex gap-2">
                <input className={cn(inputCls, 'flex-1')} placeholder="Français, Anglais…" value={lang.name}
                  onChange={e => setContent(c => ({ ...c, languages: (c.languages ?? []).map((l, li) => li === i ? { ...l, name: e.target.value } : l) }))} />
                <select value={lang.level} className={cn(inputCls, 'w-28')}
                  onChange={e => setContent(c => ({ ...c, languages: (c.languages ?? []).map((l, li) => li === i ? { ...l, level: e.target.value as any } : l) }))}>
                  {['A1','A2','B1','B2','C1','C2','native'].map(l => (
                    <option key={l} value={l}>{l === 'native' ? 'Natif' : l}</option>
                  ))}
                </select>
                <button onClick={() => setContent(c => ({ ...c, languages: (c.languages ?? []).filter((_, li) => li !== i) }))}
                  className="text-white/20 hover:text-red-400 px-2 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE REVIEW ─────────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-400" /> Récapitulatif
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Nom',          value: content.personal_info.name },
              { label: 'Email',        value: content.personal_info.email },
              { label: 'Localisation', value: content.personal_info.location },
              { label: 'Expériences',  value: `${content.experience.filter(e => e.company).length} entrée(s)` },
              { label: 'Formations',   value: `${content.education.filter(e => e.institution).length} entrée(s)` },
              { label: 'Compétences',  value: `${content.skills.length} compétence(s)` },
              { label: 'Langues',      value: `${(content.languages ?? []).filter(l => l.name).length} langue(s)` },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">{row.label}</span>
                <span className="text-white/80 font-medium">{row.value || '—'}</span>
              </div>
            ))}
          </div>
          <div className="bg-teal-400/8 border border-teal-400/15 rounded-xl p-4 text-sm text-teal-300/80">
            ✨ Après la sauvegarde, lancez l'analyse ATS pour obtenir un score et des suggestions IA.
          </div>
        </div>
      )}

      {/* Navigation */}
      {step !== 'choose' && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep(FORM_STEPS[formStepIndex - 1]?.id ?? 'choose')}
            className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/6 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>

          {step !== 'review' ? (
            <button onClick={() => setStep(FORM_STEPS[formStepIndex + 1].id)}
              className="flex items-center gap-2 text-sm font-semibold bg-teal-400 hover:bg-teal-300 text-navy-900 px-6 py-2.5 rounded-xl transition-all">
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 text-sm font-semibold bg-teal-400 hover:bg-teal-300 disabled:opacity-60 text-navy-900 px-6 py-2.5 rounded-xl transition-all">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</>
                : <><Save className="w-4 h-4" /> Sauvegarder mon CV</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
