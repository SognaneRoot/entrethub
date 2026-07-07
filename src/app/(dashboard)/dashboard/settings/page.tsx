'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Save, Loader2, User, Bell, Shield, Palette } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

const inputCls =
  'w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border border-app focus:border-[var(--teal)] text-app placeholder:text-app-muted bg-surface-2';

export default function SettingsPage() {
  const { profile, clerkUser } = useUser();
  const { theme, toggle }      = useTheme();
  const [saving, setSaving]    = useState(false);
  const [saved,  setSaved]     = useState(false);

  const [form, setForm] = useState({
    current_job: profile?.current_job ?? '',
    target_job:  profile?.target_job  ?? '',
    seniority:   profile?.seniority   ?? 'junior',
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-app">Paramètres</h1>
        <p className="text-app-muted text-sm mt-1">Gérez votre profil et vos préférences.</p>
      </div>

      {/* Profil */}
      <div className="card p-6 space-y-5">
        <h2 className="font-display font-semibold text-app flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--teal)]" /> Mon profil
        </h2>

        <div className="flex items-center gap-4">
          {clerkUser?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clerkUser.imageUrl}
              alt="avatar"
              className="w-14 h-14 rounded-full ring-2 ring-[var(--teal)]"
            />
          )}
          <div>
            <div className="font-semibold text-app">{clerkUser?.fullName ?? '—'}</div>
            <div className="text-app-muted text-sm">{clerkUser?.primaryEmailAddress?.emailAddress}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--teal)' }}>Plan gratuit</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-app-2">Poste actuel</label>
            <input className={inputCls} placeholder="Développeur Front-End"
              value={form.current_job}
              onChange={e => setForm(f => ({ ...f, current_job: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-app-2">Poste recherché</label>
            <input className={inputCls} placeholder="Lead Developer"
              value={form.target_job}
              onChange={e => setForm(f => ({ ...f, target_job: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-app-2">Niveau de séniorité</label>
            <select className={inputCls}
              value={form.seniority}
              onChange={e => setForm(f => ({ ...f, seniority: e.target.value }))}>
              {[
                { value: 'junior',    label: 'Junior (0–2 ans)' },
                { value: 'mid',       label: 'Confirmé (2–5 ans)' },
                { value: 'senior',    label: 'Senior (5–8 ans)' },
                { value: 'lead',      label: 'Lead / Manager' },
                { value: 'executive', label: 'Directeur / C-Level' },
              ].map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
          style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</>
                  : saved  ? <>✓ Sauvegardé</>
                           : <><Save className="w-4 h-4" /> Sauvegarder</>}
        </button>
      </div>

      {/* Apparence */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-app flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--teal)]" /> Apparence
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-app">Thème</div>
            <div className="text-xs text-app-muted mt-0.5">
              Actuellement : {theme === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair'}
            </div>
          </div>
          <button
            onClick={toggle}
            className="text-sm font-medium px-4 py-2 rounded-xl border border-app hover:border-[var(--teal)] transition-all bg-surface-2"
          >
            {theme === 'dark' ? '☀️ Passer en clair' : '🌙 Passer en sombre'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display font-semibold text-app flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--teal)]" /> Notifications
        </h2>
        {[
          { label: 'Rappels quotidiens',       desc: "Recevoir un email si vous n'avez pas pratiqué aujourd'hui" },
          { label: 'Résultats de simulation',  desc: 'Email après chaque simulation d\'entretien terminée' },
          { label: 'Nouveautés Entrethub',     desc: 'Nouvelles fonctionnalités et mises à jour' },
        ].map((n, i) => (
          <div key={i} className="flex items-start justify-between gap-4 py-1">
            <div>
              <div className="text-sm font-medium text-app">{n.label}</div>
              <div className="text-xs text-app-muted mt-0.5">{n.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sécurité */}
      <div className="card p-6 space-y-3">
        <h2 className="font-display font-semibold text-app flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--teal)]" /> Compte & sécurité
        </h2>
        <p className="text-sm text-app-muted leading-relaxed">
          Votre compte est géré par Clerk. Pour changer votre mot de passe ou vos
          informations de connexion, utilisez le menu de votre avatar en haut à droite.
        </p>
      </div>
    </div>
  );
}
