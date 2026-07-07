'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  User, Briefcase, GraduationCap, Code2,
  Globe, Award, Plus, Trash2, ArrowRight,
  ArrowLeft, Save, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CVContent, WorkExperience, Education } from '@/types';

// ── Types locaux ───────────────────────────────────────────────────────────
type Step = 'personal' | 'experience' | 'education' | 'skills' | 'review';

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'personal',    label: 'Infos perso.',  icon: User },
  { id: 'experience',  label: 'Expériences',   icon: Briefcase },
  { id: 'education',   label: 'Formation',     icon: GraduationCap },
  { id: 'skills',      label: 'Compétences',   icon: Code2 },
  { id: 'review',      label: 'Finaliser',     icon: Award },
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

// ── Composant champ ───────────────────────────────────────────────────────
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
  const router  = useRouter();
  const { user } = useUser();

  const [step,    setStep]    = useState<Step>('personal');
  const [saving,  setSaving]  = useState(false);
  const [title,   setTitle]   = useState('Mon CV');
  const [content, setContent] = useState<CVContent>({
    personal_info: {
      name:      user?.fullName ?? '',
      email:     user?.primaryEmailAddress?.emailAddress ?? '',
      phone:     '',
      location:  '',
      linkedin:  '',
      github:    '',
      portfolio: '',
    },
    summary:     '',
    experience:  [emptyExperience()],
    education:   [emptyEducation()],
    skills:      [],
    languages:   [],
    certifications: [],
  });
  const [skillInput, setSkillInput] = useState('');

  const currentIndex = STEPS.findIndex(s => s.id === step);

  // ── Helpers ───────────────────────────────────────────────────────────
  const updatePersonal = (field: string, value: string) =>
    setContent(c => ({ ...c, personal_info: { ...c.personal_info, [field]: value } }));

  const updateExp = (id: string, field: string, value: any) =>
    setContent(c => ({
      ...c,
      experience: c.experience.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));

  const updateExpDesc = (id: string, idx: number, value: string) =>
    setContent(c => ({
      ...c,
      experience: c.experience.map(e =>
        e.id === id
          ? { ...e, description: e.description.map((d, i) => i === idx ? value : d) }
          : e
      ),
    }));

  const addExpDesc = (id: string) =>
    setContent(c => ({
      ...c,
      experience: c.experience.map(e =>
        e.id === id ? { ...e, description: [...e.description, ''] } : e
      ),
    }));

  const removeExpDesc = (id: string, idx: number) =>
    setContent(c => ({
      ...c,
      experience: c.experience.map(e =>
        e.id === id ? { ...e, description: e.description.filter((_, i) => i !== idx) } : e
      ),
    }));

  const updateEdu = (id: string, field: string, value: string) =>
    setContent(c => ({
      ...c,
      education: c.education.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !content.skills.includes(trimmed)) {
      setContent(c => ({ ...c, skills: [...c.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) =>
    setContent(c => ({ ...c, skills: c.skills.filter(s => s !== skill) }));

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/dashboard/cv/${data.id}`);
      } else {
        alert(data.error ?? 'Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Render steps ──────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/6"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="font-display font-bold text-xl text-white bg-transparent outline-none border-b border-transparent focus:border-teal-400/40 transition-colors pb-0.5 w-full"
            placeholder="Nom de votre CV"
          />
          <p className="text-white/30 text-xs mt-0.5">Cliquez sur le titre pour le modifier</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done    = i < currentIndex;
          const active  = s.id === step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                active  ? 'bg-teal-400/15 text-teal-300 border border-teal-400/20' :
                done    ? 'bg-white/8 text-white/60 border border-white/8' :
                          'bg-transparent text-white/25 border border-white/6'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {s.label}
              {done && <span className="text-teal-400">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">

        {/* ── PERSONAL ─────────────────────────────────────────────── */}
        {step === 'personal' && (
          <>
            <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-teal-400" /> Informations personnelles
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom complet" required>
                <input className={inputCls} placeholder="Jean Dupont"
                  value={content.personal_info.name}
                  onChange={e => updatePersonal('name', e.target.value)} />
              </Field>
              <Field label="Email" required>
                <input className={inputCls} type="email" placeholder="jean@exemple.com"
                  value={content.personal_info.email}
                  onChange={e => updatePersonal('email', e.target.value)} />
              </Field>
              <Field label="Téléphone">
                <input className={inputCls} placeholder="+33 6 12 34 56 78"
                  value={content.personal_info.phone ?? ''}
                  onChange={e => updatePersonal('phone', e.target.value)} />
              </Field>
              <Field label="Localisation">
                <input className={inputCls} placeholder="Paris, France"
                  value={content.personal_info.location ?? ''}
                  onChange={e => updatePersonal('location', e.target.value)} />
              </Field>
              <Field label="LinkedIn">
                <input className={inputCls} placeholder="linkedin.com/in/jeandupont"
                  value={content.personal_info.linkedin ?? ''}
                  onChange={e => updatePersonal('linkedin', e.target.value)} />
              </Field>
              <Field label="GitHub / Portfolio">
                <input className={inputCls} placeholder="github.com/jeandupont"
                  value={content.personal_info.github ?? ''}
                  onChange={e => updatePersonal('github', e.target.value)} />
              </Field>
            </div>
            <Field label="Résumé professionnel">
              <textarea
                rows={4}
                className={cn(inputCls, 'resize-none')}
                placeholder="Développeur Full Stack avec 5 ans d'expérience spécialisé en React et Node.js..."
                value={content.summary ?? ''}
                onChange={e => setContent(c => ({ ...c, summary: e.target.value }))}
              />
            </Field>
          </>
        )}

        {/* ── EXPERIENCE ───────────────────────────────────────────── */}
        {step === 'experience' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" /> Expériences professionnelles
              </h2>
              <button
                onClick={() => setContent(c => ({ ...c, experience: [...c.experience, emptyExperience()] }))}
                className="flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/15 px-3 py-1.5 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            <div className="space-y-5">
              {content.experience.map((exp, expIdx) => (
                <div key={exp.id} className="border border-white/8 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/40">
                      Expérience {expIdx + 1}
                    </span>
                    {content.experience.length > 1 && (
                      <button
                        onClick={() => setContent(c => ({ ...c, experience: c.experience.filter(e => e.id !== exp.id) }))}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Entreprise" required>
                      <input className={inputCls} placeholder="Acme Corp"
                        value={exp.company}
                        onChange={e => updateExp(exp.id, 'company', e.target.value)} />
                    </Field>
                    <Field label="Poste" required>
                      <input className={inputCls} placeholder="Développeur Front-End"
                        value={exp.position}
                        onChange={e => updateExp(exp.id, 'position', e.target.value)} />
                    </Field>
                    <Field label="Date début">
                      <input className={inputCls} type="month"
                        value={exp.start_date}
                        onChange={e => updateExp(exp.id, 'start_date', e.target.value)} />
                    </Field>
                    <Field label="Date fin">
                      <div className="space-y-2">
                        <input className={inputCls} type="month"
                          disabled={exp.current}
                          value={exp.end_date ?? ''}
                          onChange={e => updateExp(exp.id, 'end_date', e.target.value)} />
                        <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                          <input type="checkbox" checked={exp.current ?? false}
                            onChange={e => updateExp(exp.id, 'current', e.target.checked)}
                            className="accent-teal-400" />
                          Poste actuel
                        </label>
                      </div>
                    </Field>
                  </div>

                  {/* Missions */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Missions & réalisations</label>
                    {exp.description.map((desc, di) => (
                      <div key={di} className="flex items-center gap-2">
                        <span className="text-teal-400 text-sm shrink-0">•</span>
                        <input
                          className={cn(inputCls, 'flex-1')}
                          placeholder="Développé une API REST avec Node.js servant 50k utilisateurs/jour"
                          value={desc}
                          onChange={e => updateExpDesc(exp.id, di, e.target.value)}
                        />
                        {exp.description.length > 1 && (
                          <button onClick={() => removeExpDesc(exp.id, di)}
                            className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addExpDesc(exp.id)}
                      className="text-xs text-white/30 hover:text-teal-400 transition-colors flex items-center gap-1 mt-1">
                      <Plus className="w-3 h-3" /> Ajouter une mission
                    </button>
                  </div>

                  {/* Technologies */}
                  <Field label="Technologies utilisées">
                    <input className={inputCls} placeholder="React, TypeScript, Node.js, PostgreSQL"
                      value={(exp.technologies ?? []).join(', ')}
                      onChange={e => updateExp(exp.id, 'technologies',
                        e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      )} />
                  </Field>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── EDUCATION ────────────────────────────────────────────── */}
        {step === 'education' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-400" /> Formation
              </h2>
              <button
                onClick={() => setContent(c => ({ ...c, education: [...c.education, emptyEducation()] }))}
                className="flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/15 px-3 py-1.5 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {content.education.map((edu, idx) => (
                <div key={edu.id} className="border border-white/8 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/40">Formation {idx + 1}</span>
                    {content.education.length > 1 && (
                      <button
                        onClick={() => setContent(c => ({ ...c, education: c.education.filter(e => e.id !== edu.id) }))}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Établissement" required>
                      <input className={inputCls} placeholder="Université Paris-Saclay"
                        value={edu.institution}
                        onChange={e => updateEdu(edu.id, 'institution', e.target.value)} />
                    </Field>
                    <Field label="Diplôme" required>
                      <input className={inputCls} placeholder="Master"
                        value={edu.degree}
                        onChange={e => updateEdu(edu.id, 'degree', e.target.value)} />
                    </Field>
                    <Field label="Spécialité" required>
                      <input className={inputCls} placeholder="Informatique"
                        value={edu.field}
                        onChange={e => updateEdu(edu.id, 'field', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Début">
                        <input className={inputCls} type="month"
                          value={edu.start_date}
                          onChange={e => updateEdu(edu.id, 'start_date', e.target.value)} />
                      </Field>
                      <Field label="Fin">
                        <input className={inputCls} type="month"
                          value={edu.end_date ?? ''}
                          onChange={e => updateEdu(edu.id, 'end_date', e.target.value)} />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SKILLS ───────────────────────────────────────────────── */}
        {step === 'skills' && (
          <>
            <h2 className="font-display font-semibold text-white text-lg flex items-center gap-2">
              <Code2 className="w-5 h-5 text-teal-400" /> Compétences & langues
            </h2>

            <Field label="Ajouter une compétence">
              <div className="flex gap-2">
                <input
                  className={cn(inputCls, 'flex-1')}
                  placeholder="React, Python, Gestion de projet…"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2.5 bg-teal-400/15 hover:bg-teal-400/25 text-teal-300 rounded-xl text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Field>

            {content.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {content.skills.map(skill => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)}
                      className="text-white/30 hover:text-red-400 transition-colors ml-0.5">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-white/25">
              Astuce : appuyez sur <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/40">Entrée</kbd> après chaque compétence
            </p>

            {/* Languages */}
            <div className="pt-2 border-t border-white/6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Langues
                </label>
                <button
                  onClick={() => setContent(c => ({
                    ...c,
                    languages: [...(c.languages ?? []), { name: '', level: 'B2' }]
                  }))}
                  className="text-xs text-white/30 hover:text-teal-400 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {(content.languages ?? []).map((lang, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={cn(inputCls, 'flex-1')}
                      placeholder="Français, Anglais, Arabe…"
                      value={lang.name}
                      onChange={e => setContent(c => ({
                        ...c,
                        languages: (c.languages ?? []).map((l, li) =>
                          li === i ? { ...l, name: e.target.value } : l
                        ),
                      }))}
                    />
                    <select
                      value={lang.level}
                      onChange={e => setContent(c => ({
                        ...c,
                        languages: (c.languages ?? []).map((l, li) =>
                          li === i ? { ...l, level: e.target.value as any } : l
                        ),
                      }))}
                      className={cn(inputCls, 'w-28')}
                    >
                      {['A1','A2','B1','B2','C1','C2','native'].map(l => (
                        <option key={l} value={l} className="bg-navy-900">{l === 'native' ? 'Natif' : l}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setContent(c => ({
                        ...c,
                        languages: (c.languages ?? []).filter((_, li) => li !== i),
                      }))}
                      className="text-white/20 hover:text-red-400 transition-colors px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── REVIEW ───────────────────────────────────────────────── */}
        {step === 'review' && (
          <>
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
                { label: 'Langues',      value: `${(content.languages ?? []).length} langue(s)` },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-white/40">{row.label}</span>
                  <span className="text-white/80 font-medium">{row.value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="bg-teal-400/8 border border-teal-400/15 rounded-xl p-4 text-sm text-teal-300/80">
              ✨ Après la sauvegarde, vous pourrez lancer l'analyse ATS pour obtenir un score et des suggestions d'amélioration IA.
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setStep(STEPS[currentIndex - 1]?.id ?? step)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white disabled:opacity-0 transition-all px-4 py-2.5 rounded-xl hover:bg-white/6"
        >
          <ArrowLeft className="w-4 h-4" /> Précédent
        </button>

        {step !== 'review' ? (
          <button
            onClick={() => setStep(STEPS[currentIndex + 1].id)}
            className="flex items-center gap-2 text-sm font-semibold bg-teal-400 hover:bg-teal-300 text-navy-900 px-6 py-2.5 rounded-xl transition-all"
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-sm font-semibold bg-teal-400 hover:bg-teal-300 disabled:opacity-60 text-navy-900 px-6 py-2.5 rounded-xl transition-all"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</>
              : <><Save className="w-4 h-4" /> Sauvegarder mon CV</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
