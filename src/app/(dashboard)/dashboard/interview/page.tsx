import { Mic2 } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-10 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-400/10 mx-auto">
          <Mic2 className="w-7 h-7 text-teal-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-app mb-2">Simulateur d'entretien</h1>
          <p className="text-app-2 text-sm leading-relaxed">Entraînez-vous avec un simulateur vocal et textuel. Questions adaptées à votre métier et niveau. Feedback IA immédiat après chaque simulation.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-teal-400/10 border border-teal-400/20 text-teal-400 text-xs font-semibold px-4 py-2 rounded-full">
          🚧 En cours de développement — Phase 8
        </div>
        <p className="text-app-muted text-xs">
          Cette fonctionnalité sera disponible prochainement.
        </p>
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-app-2 hover:text-app transition-colors mt-2">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
