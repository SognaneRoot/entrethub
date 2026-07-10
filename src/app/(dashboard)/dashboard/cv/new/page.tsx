'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  User, Briefcase, GraduationCap, Code2, Award,
  Plus, Trash2, ArrowRight, ArrowLeft, Save,
  Loader2, Upload, FileText, X, Globe, CheckCircle2,
} from 'lucide-react';
import type { CVContent, WorkExperience, Education } from '@/types';

type Step = 'choose' | 'personal' | 'experience' | 'education' | 'skills' | 'review';

const FORM_STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'personal',   label: 'Infos perso.',  icon: User           },
  { id: 'experience', label: 'Expériences',   icon: Briefcase      },
  { id: 'education',  label: 'Formation',     icon: GraduationCap  },
  { id: 'skills',     label: 'Compétences',   icon: Code2          },
  { id: 'review',     label: 'Finaliser',     icon: Award          },
];

const emptyExp = (): WorkExperience => ({
  id: crypto.randomUUID(), company: '', position: '', start_date: '', end_date: '',
  current: false, description: [''], technologies: [],
});
const emptyEdu = (): Education => ({
  id: crypto.randomUUID(), institution: '', degree: '', field: '', start_date: '', end_date: '',
});
const emptyContent = (name = '', email = ''): CVContent => ({
  personal_info: { name, email, phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  summary: '', experience: [emptyExp()], education: [emptyEdu()], skills: [], languages: [], certifications: [],
});

// Styles adaptatifs light/dark via CSS variables
const cardStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
};
const inputStyle = {
  backgroundColor: 'var(--input-bg)',
  border: '1.5px solid var(--input-border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.625rem 1rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s ease',
};
const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' };
const mutedStyle  = { color: 'var(--text-muted)' };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: 'var(--teal)', marginLeft: '0.25rem' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', disabled = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={inputStyle}
      className="focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_var(--teal-soft)]"
    />
  );
}

function StyledTextarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputStyle, resize: 'none' }}
      className="focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_var(--teal-soft)]"
    />
  );
}

export default function NewCVPage() {
  const router    = useRouter();
  const { user }  = useUser();
  const fileRef   = useRef<HTMLInputElement>(null);

  const [step,       setStep]       = useState<Step>('choose');
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadErr,  setUploadErr]  = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const [title,      setTitle]      = useState('Mon CV');
  const [skillInput, setSkillInput] = useState('');
  const [content,    setContent]    = useState<CVContent>(
    emptyContent(user?.fullName ?? '', user?.primaryEmailAddress?.emailAddress ?? '')
  );

  const formIdx = FORM_STEPS.findIndex(s => s.id === step);

  // ── Upload ──────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploadErr(''); setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res  = await fetch('/api/cv/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadErr(data.error ?? 'Erreur upload'); return; }
      setContent(prev => ({
        ...data.content,
        personal_info: {
          ...data.content.personal_info,
          name:  data.content.personal_info.name  || prev.personal_info.name,
          email: data.content.personal_info.email || prev.personal_info.email,
        },
      }));
      setUploadDone(true);
      setTimeout(() => setStep('personal'), 800);
    } catch { setUploadErr('Erreur réseau — réessayez'); }
    finally  { setUploading(false); }
  };

  // ── Save ────────────────────────────────────────────────────────────
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
    } finally { setSaving(false); }
  };

  const updatePersonal = (f: string, v: string) =>
    setContent(c => ({ ...c, personal_info: { ...c.personal_info, [f]: v } }));
  const updateExp = (id: string, f: string, v: any) =>
    setContent(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, [f]: v } : e) }));
  const updateExpDesc = (id: string, i: number, v: string) =>
    setContent(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, description: e.description.map((d, di) => di === i ? v : d) } : e) }));
  const addExpDesc  = (id: string) =>
    setContent(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, description: [...e.description, ''] } : e) }));
  const removeExpDesc = (id: string, i: number) =>
    setContent(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, description: e.description.filter((_, di) => di !== i) } : e) }));
  const updateEdu = (id: string, f: string, v: string) =>
    setContent(c => ({ ...c, education: c.education.map(e => e.id === id ? { ...e, [f]: v } : e) }));
  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !content.skills.includes(t)) setContent(c => ({ ...c, skills: [...c.skills, t] }));
    setSkillInput('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === 'choose' ? router.back() : setStep(FORM_STEPS[formIdx - 1]?.id ?? 'choose')}
          className="p-2 rounded-xl transition-all"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          {step !== 'choose' ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-display font-bold text-xl w-full outline-none bg-transparent border-b-2 border-transparent focus:border-[var(--teal)] pb-0.5 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Nom de votre CV"
            />
          ) : (
            <h1 className="font-display font-bold text-xl text-app">Créer un CV</h1>
          )}
        </div>
      </div>

      {/* Step pills */}
      {step !== 'choose' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FORM_STEPS.map((s, i) => {
            const Icon   = s.icon;
            const active = s.id === step;
            const done   = i < formIdx;
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border"
                style={active ? { backgroundColor: 'var(--teal-soft)', borderColor: 'var(--teal)', color: 'var(--teal-text)' }
                      : done  ? { backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                              : { backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
                {done && <span style={{ color: 'var(--teal)' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── CHOOSE ───────────────────────────────────────────────────── */}
      {step === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Depuis zéro */}
          <button onClick={() => setStep('personal')}
            className="flex flex-col items-start gap-4 p-6 text-left transition-all group rounded-2xl"
            style={{ ...cardStyle, cursor: 'pointer' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--teal-soft)' }}>
              <FileText className="w-5 h-5" style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-app mb-1">Créer depuis zéro</h3>
              <p className="text-sm" style={mutedStyle}>Formulaire guidé étape par étape.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium mt-auto" style={{ color: 'var(--teal)' }}>
              Commencer <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Upload */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
            className="flex flex-col items-start gap-4 p-6 rounded-2xl transition-all"
            style={{ ...cardStyle, borderStyle: 'dashed', borderColor: dragOver ? 'var(--teal)' : 'var(--border)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(96,165,250,0.1)' }}>
              {uploading
                ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                : uploadDone
                ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--teal)' }} />
                : <Upload className="w-5 h-5 text-blue-400" />
              }
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-app mb-1">
                {uploadDone ? 'CV importé !' : 'Importer mon CV'}
              </h3>
              <p className="text-sm" style={mutedStyle}>
                {uploadDone ? 'Redirection…' : 'PDF, DOCX ou TXT — max 5MB'}
              </p>
              {uploadErr && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><X className="w-3 h-3" />{uploadErr}</p>}
            </div>
            {!uploadDone && (
              <>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Import en cours…' : 'Choisir un fichier'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── FORM CARD ────────────────────────────────────────────────── */}
      {step !== 'choose' && (
        <div className="p-6 space-y-5 rounded-2xl" style={cardStyle}>

          {/* PERSONAL */}
          {step === 'personal' && (
            <>
              {uploadDone && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal-text)', border: '1px solid var(--teal)' }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> CV importé — vérifiez et complétez les informations.
                </div>
              )}
              <h2 className="font-display font-semibold text-app flex items-center gap-2">
                <User className="w-5 h-5" style={{ color: 'var(--teal)' }} /> Informations personnelles
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nom complet" required><StyledInput value={content.personal_info.name} onChange={v => updatePersonal('name', v)} placeholder="Jean Dupont" /></Field>
                <Field label="Email" required><StyledInput type="email" value={content.personal_info.email} onChange={v => updatePersonal('email', v)} placeholder="jean@exemple.com" /></Field>
                <Field label="Téléphone"><StyledInput value={content.personal_info.phone ?? ''} onChange={v => updatePersonal('phone', v)} placeholder="+33 6 12 34 56 78" /></Field>
                <Field label="Localisation"><StyledInput value={content.personal_info.location ?? ''} onChange={v => updatePersonal('location', v)} placeholder="Paris, France" /></Field>
                <Field label="LinkedIn"><StyledInput value={content.personal_info.linkedin ?? ''} onChange={v => updatePersonal('linkedin', v)} placeholder="linkedin.com/in/…" /></Field>
                <Field label="GitHub / Portfolio"><StyledInput value={content.personal_info.github ?? ''} onChange={v => updatePersonal('github', v)} placeholder="github.com/…" /></Field>
              </div>
              <Field label="Résumé professionnel">
                <StyledTextarea rows={4} value={content.summary ?? ''} onChange={v => setContent(c => ({ ...c, summary: v }))} placeholder="Développeur Full Stack avec 5 ans d'expérience…" />
              </Field>
            </>
          )}

          {/* EXPERIENCE */}
          {step === 'experience' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-app flex items-center gap-2">
                  <Briefcase className="w-5 h-5" style={{ color: 'var(--teal)' }} /> Expériences
                </h2>
                <button onClick={() => setContent(c => ({ ...c, experience: [...c.experience, emptyExp()] }))}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
                  style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal-text)', border: '1px solid var(--teal)' }}>
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
              {content.experience.map((exp, idx) => (
                <div key={exp.id} className="space-y-3 p-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={mutedStyle}>Expérience {idx + 1}</span>
                    {content.experience.length > 1 && (
                      <button onClick={() => setContent(c => ({ ...c, experience: c.experience.filter(e => e.id !== exp.id) }))} className="text-red-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Entreprise" required><StyledInput value={exp.company} onChange={v => updateExp(exp.id, 'company', v)} placeholder="Acme Corp" /></Field>
                    <Field label="Poste" required><StyledInput value={exp.position} onChange={v => updateExp(exp.id, 'position', v)} placeholder="Développeur Front-End" /></Field>
                    <Field label="Date début"><StyledInput type="month" value={exp.start_date} onChange={v => updateExp(exp.id, 'start_date', v)} /></Field>
                    <Field label="Date fin">
                      <StyledInput type="month" value={exp.end_date ?? ''} disabled={exp.current} onChange={v => updateExp(exp.id, 'end_date', v)} />
                      <label className="flex items-center gap-2 text-xs cursor-pointer mt-1" style={mutedStyle}>
                        <input type="checkbox" checked={exp.current ?? false} onChange={e => updateExp(exp.id, 'current', e.target.checked)} className="accent-[var(--teal)]" />
                        Poste actuel
                      </label>
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={labelStyle}>Missions</label>
                    {exp.description.map((d, di) => (
                      <div key={di} className="flex items-center gap-2">
                        <span style={{ color: 'var(--teal)' }} className="text-sm shrink-0">•</span>
                        <input style={{ ...inputStyle, flex: 1 }} value={d} onChange={e => updateExpDesc(exp.id, di, e.target.value)} placeholder="Développé une API REST…"
                          className="focus:border-[var(--teal)]" />
                        {exp.description.length > 1 && <button onClick={() => removeExpDesc(exp.id, di)} className="text-red-400 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                    <button onClick={() => addExpDesc(exp.id)} className="text-xs flex items-center gap-1 transition-colors" style={mutedStyle}><Plus className="w-3 h-3" /> Ajouter une mission</button>
                  </div>
                  <Field label="Technologies">
                    <StyledInput value={(exp.technologies ?? []).join(', ')} onChange={v => updateExp(exp.id, 'technologies', v.split(',').map(t => t.trim()).filter(Boolean))} placeholder="React, Node.js, PostgreSQL" />
                  </Field>
                </div>
              ))}
            </>
          )}

          {/* EDUCATION */}
          {step === 'education' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-app flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" style={{ color: 'var(--teal)' }} /> Formation
                </h2>
                <button onClick={() => setContent(c => ({ ...c, education: [...c.education, emptyEdu()] }))}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
                  style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal-text)', border: '1px solid var(--teal)' }}>
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
              {content.education.map((edu, idx) => (
                <div key={edu.id} className="space-y-3 p-4 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={mutedStyle}>Formation {idx + 1}</span>
                    {content.education.length > 1 && <button onClick={() => setContent(c => ({ ...c, education: c.education.filter(e => e.id !== edu.id) }))} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Établissement" required><StyledInput value={edu.institution} onChange={v => updateEdu(edu.id, 'institution', v)} placeholder="Université Paris-Saclay" /></Field>
                    <Field label="Diplôme" required><StyledInput value={edu.degree} onChange={v => updateEdu(edu.id, 'degree', v)} placeholder="Master" /></Field>
                    <Field label="Spécialité" required><StyledInput value={edu.field} onChange={v => updateEdu(edu.id, 'field', v)} placeholder="Informatique" /></Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Début"><StyledInput type="month" value={edu.start_date} onChange={v => updateEdu(edu.id, 'start_date', v)} /></Field>
                      <Field label="Fin"><StyledInput type="month" value={edu.end_date ?? ''} onChange={v => updateEdu(edu.id, 'end_date', v)} /></Field>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* SKILLS */}
          {step === 'skills' && (
            <>
              <h2 className="font-display font-semibold text-app flex items-center gap-2">
                <Code2 className="w-5 h-5" style={{ color: 'var(--teal)' }} /> Compétences & langues
              </h2>
              <Field label="Ajouter une compétence">
                <div className="flex gap-2">
                  <input style={{ ...inputStyle, flex: 1 }} value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="React, Python, Gestion de projet…"
                    className="focus:border-[var(--teal)]" />
                  <button onClick={addSkill} className="px-4 rounded-xl transition-all" style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal-text)', border: '1px solid var(--teal)' }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </Field>
              {content.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {content.skills.map(s => (
                    <span key={s} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {s}
                      <button onClick={() => setContent(c => ({ ...c, skills: c.skills.filter(sk => sk !== s) }))} className="hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs" style={mutedStyle}>Appuyez sur <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--border)' }}>Entrée</kbd> après chaque compétence</p>
              {/* Langues */}
              <div className="pt-2 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2" style={labelStyle}><Globe className="w-4 h-4" /> Langues</label>
                  <button onClick={() => setContent(c => ({ ...c, languages: [...(c.languages ?? []), { name: '', level: 'B2' as any }] }))}
                    className="text-xs flex items-center gap-1 transition-colors" style={mutedStyle}>
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                {(content.languages ?? []).map((lang, i) => (
                  <div key={i} className="flex gap-2">
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Français, Anglais…" value={lang.name}
                      onChange={e => setContent(c => ({ ...c, languages: (c.languages ?? []).map((l, li) => li === i ? { ...l, name: e.target.value } : l) }))}
                      className="focus:border-[var(--teal)]" />
                    <select value={lang.level} style={{ ...inputStyle, width: '7rem' }}
                      onChange={e => setContent(c => ({ ...c, languages: (c.languages ?? []).map((l, li) => li === i ? { ...l, level: e.target.value as any } : l) }))}>
                      {['A1','A2','B1','B2','C1','C2','native'].map(l => <option key={l} value={l}>{l === 'native' ? 'Natif' : l}</option>)}
                    </select>
                    <button onClick={() => setContent(c => ({ ...c, languages: (c.languages ?? []).filter((_, li) => li !== i) }))} className="text-red-400 px-2"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* REVIEW */}
          {step === 'review' && (
            <>
              <h2 className="font-display font-semibold text-app flex items-center gap-2">
                <Award className="w-5 h-5" style={{ color: 'var(--teal)' }} /> Récapitulatif
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Nom',          value: content.personal_info.name },
                  { label: 'Email',        value: content.personal_info.email },
                  { label: 'Localisation', value: content.personal_info.location },
                  { label: 'Expériences',  value: `${content.experience.filter(e => e.company).length} entrée(s)` },
                  { label: 'Formations',   value: `${content.education.filter(e => e.institution).length} entrée(s)` },
                  { label: 'Compétences',  value: `${content.skills.length} compétence(s)` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={mutedStyle}>{row.label}</span>
                    <span className="font-medium text-app">{row.value || '—'}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal-text)', border: '1px solid var(--teal)' }}>
                ✨ Après la sauvegarde, lancez l'analyse ATS pour obtenir un score et des suggestions IA.
              </div>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      {step !== 'choose' && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setStep(FORM_STEPS[formIdx - 1]?.id ?? 'choose')}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>

          {step !== 'review' ? (
            <button onClick={() => setStep(FORM_STEPS[formIdx + 1].id)}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--teal)', color: '#FFFFFF' }}>
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--teal)', color: '#FFFFFF' }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</> : <><Save className="w-4 h-4" /> Sauvegarder mon CV</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
