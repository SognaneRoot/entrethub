'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Briefcase, X, Loader2, ExternalLink,
  MapPin, Euro, Calendar, ChevronDown, Edit2, Trash2,
} from 'lucide-react';

interface JobApplication {
  id: string;
  company: string;
  job_title: string;
  job_url: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: Status;
  notes: string | null;
  applied_at: string | null;
  next_step: string | null;
  next_step_date: string | null;
  created_at: string;
}

type Status = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';

const COLUMNS: { id: Status; label: string; color: string; bg: string; border: string }[] = [
  { id: 'wishlist',  label: '⭐ Souhaités',   color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  { id: 'applied',   label: '📤 Postulés',    color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  { id: 'interview', label: '🎤 Entretiens',  color: '#00D4B1', bg: 'rgba(0,212,177,0.08)',   border: 'rgba(0,212,177,0.2)'   },
  { id: 'offer',     label: '🎉 Offres',      color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)'  },
  { id: 'rejected',  label: '❌ Refusés',     color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'wishlist',  label: '⭐ Souhaité'   },
  { value: 'applied',   label: '📤 Postulé'    },
  { value: 'interview', label: '🎤 Entretien'  },
  { value: 'offer',     label: '🎉 Offre'      },
  { value: 'rejected',  label: '❌ Refusé'     },
];

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border border-app focus:border-[var(--teal)] text-app placeholder:text-app-muted bg-surface-2";

const emptyForm = () => ({
  company:        '',
  job_title:      '',
  job_url:        '',
  location:       '',
  salary_min:     '',
  salary_max:     '',
  status:         'applied' as Status,
  notes:          '',
  applied_at:     '',
  next_step:      '',
  next_step_date: '',
});

export default function JobsPage() {
  const [jobs,      setJobs]      = useState<JobApplication[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<JobApplication | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState(emptyForm());
  const [expanded,  setExpanded]  = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(d => { setJobs(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (job: JobApplication) => {
    setEditing(job);
    setForm({
      company:        job.company,
      job_title:      job.job_title,
      job_url:        job.job_url ?? '',
      location:       job.location ?? '',
      salary_min:     job.salary_min?.toString() ?? '',
      salary_max:     job.salary_max?.toString() ?? '',
      status:         job.status,
      notes:          job.notes ?? '',
      applied_at:     job.applied_at ?? '',
      next_step:      job.next_step ?? '',
      next_step_date: job.next_step_date ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.company.trim() || !form.job_title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_min:     form.salary_min ? Number(form.salary_min) : null,
        salary_max:     form.salary_max ? Number(form.salary_max) : null,
        applied_at:     form.applied_at     || null,
        next_step_date: form.next_step_date || null,
        job_url:        form.job_url        || null,
        location:       form.location       || null,
        notes:          form.notes          || null,
        next_step:      form.next_step      || null,
      };

      if (editing) {
        const res  = await fetch(`/api/jobs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) setJobs(prev => prev.map(j => j.id === editing.id ? data : j));
      } else {
        const res  = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) setJobs(prev => [data, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (job: JobApplication, newStatus: Status) => {
    const res  = await fetch(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) setJobs(prev => prev.map(j => j.id === job.id ? data : j));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const byStatus = (s: Status) => jobs.filter(j => j.status === s);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-app">Mes candidatures</h1>
          <p className="text-app-muted text-sm mt-1">
            {jobs.length} candidature{jobs.length > 1 ? 's' : ''} · {byStatus('interview').length} en entretien · {byStatus('offer').length} offre{byStatus('offer').length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Modal add/edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>

            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-app">
                {editing ? 'Modifier la candidature' : 'Nouvelle candidature'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="text-app-muted hover:text-app transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Entreprise <span style={{ color: 'var(--teal)' }}>*</span></label>
                <input className={inputCls} placeholder="Google, Acme Corp…"
                  value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Poste <span style={{ color: 'var(--teal)' }}>*</span></label>
                <input className={inputCls} placeholder="Développeur Senior"
                  value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Statut</label>
                <select className={inputCls} value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Localisation</label>
                <input className={inputCls} placeholder="Paris, Remote…"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Salaire min (€)</label>
                <input className={inputCls} type="number" placeholder="40000"
                  value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Salaire max (€)</label>
                <input className={inputCls} type="number" placeholder="55000"
                  value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Date de candidature</label>
                <input className={inputCls} type="date"
                  value={form.applied_at} onChange={e => setForm(f => ({ ...f, applied_at: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">URL de l'offre</label>
                <input className={inputCls} type="url" placeholder="https://…"
                  value={form.job_url} onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-app-2">Prochaine étape</label>
                <input className={inputCls} placeholder="Entretien RH, Test technique…"
                  value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-app-2">Date prochaine étape</label>
                <input className={inputCls} type="date"
                  value={form.next_step_date} onChange={e => setForm(f => ({ ...f, next_step_date: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-app-2">Notes</label>
                <textarea rows={3} className={`${inputCls} resize-none`}
                  placeholder="Contacts, impressions, points à préparer…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={saving || !form.company.trim() || !form.job_title.trim()}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl disabled:opacity-40 transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Sauvegarder' : 'Ajouter'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-app-muted hover:text-app rounded-xl border border-app transition-all">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-app-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNS.map(col => {
            const colJobs = byStatus(col.id);
            return (
              <div key={col.id} className="rounded-2xl p-3 space-y-2"
                style={{ backgroundColor: col.bg, border: `1px solid ${col.border}` }}>

                {/* Column header */}
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-xs font-semibold" style={{ color: col.color }}>
                    {col.label}
                  </span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: col.border, color: col.color }}>
                    {colJobs.length}
                  </span>
                </div>

                {/* Cards */}
                {colJobs.map(job => (
                  <div key={job.id}
                    className="rounded-xl p-3 space-y-2 group cursor-pointer"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                    onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-app truncate">{job.company}</div>
                        <div className="text-xs text-app-muted truncate">{job.job_title}</div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); openEdit(job); }}
                          className="p-1 rounded-lg text-app-muted hover:text-app transition-colors">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(job.id); }}
                          className="p-1 rounded-lg text-app-muted hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      {job.location && (
                        <div className="flex items-center gap-1 text-xs text-app-muted">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-1 text-xs text-app-muted">
                          <Euro className="w-2.5 h-2.5 shrink-0" />
                          <span>{job.salary_min && job.salary_max
                            ? `${(job.salary_min/1000).toFixed(0)}k–${(job.salary_max/1000).toFixed(0)}k`
                            : `${((job.salary_min || job.salary_max)! / 1000).toFixed(0)}k`}
                          </span>
                        </div>
                      )}
                      {job.applied_at && (
                        <div className="flex items-center gap-1 text-xs text-app-muted">
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          <span>{new Date(job.applied_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded */}
                    {expanded === job.id && (
                      <div className="pt-2 border-t border-app space-y-2"
                        onClick={e => e.stopPropagation()}>

                        {/* Status change */}
                        <div className="space-y-1">
                          <div className="text-xs text-app-muted font-medium">Déplacer vers :</div>
                          <div className="flex flex-wrap gap-1">
                            {STATUS_OPTIONS.filter(o => o.value !== job.status).map(o => (
                              <button key={o.value}
                                onClick={() => handleStatusChange(job, o.value)}
                                className="text-xs px-2 py-1 rounded-lg border border-app hover:border-[var(--teal)] text-app-muted hover:text-app transition-all"
                                style={{ backgroundColor: 'var(--surface-2)' }}>
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {job.next_step && (
                          <div className="text-xs rounded-lg p-2"
                            style={{ backgroundColor: 'var(--teal-soft)', color: 'var(--teal)' }}>
                            <span className="font-medium">Prochaine étape :</span> {job.next_step}
                            {job.next_step_date && ` — ${new Date(job.next_step_date).toLocaleDateString('fr-FR')}`}
                          </div>
                        )}

                        {job.notes && (
                          <p className="text-xs text-app-muted leading-relaxed">{job.notes}</p>
                        )}

                        {job.job_url && (
                          <a href={job.job_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs transition-colors"
                            style={{ color: 'var(--teal)' }}>
                            <ExternalLink className="w-3 h-3" /> Voir l'offre
                          </a>
                        )}
                      </div>
                    )}

                    <ChevronDown className={`w-3 h-3 text-app-muted mx-auto transition-transform ${expanded === job.id ? 'rotate-180' : ''}`} />
                  </div>
                ))}

                {/* Add in column */}
                <button onClick={() => { setForm(f => ({ ...emptyForm(), status: col.id })); setEditing(null); setShowForm(true); }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border border-dashed transition-all"
                  style={{ borderColor: col.border, color: col.color }}>
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <div className="card p-14 text-center space-y-4 -mt-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'var(--teal-soft)' }}>
            <Briefcase className="w-6 h-6" style={{ color: 'var(--teal)' }} />
          </div>
          <h2 className="font-display font-semibold text-app">Aucune candidature</h2>
          <p className="text-app-muted text-sm max-w-xs mx-auto">
            Ajoutez vos candidatures pour suivre leur avancement visuellement.
          </p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}>
            <Plus className="w-4 h-4" /> Ajouter ma première candidature
          </button>
        </div>
      )}
    </div>
  );
}
