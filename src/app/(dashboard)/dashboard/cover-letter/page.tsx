import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-10 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-400/10 mx-auto">
          <Mail className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-app mb-2">Lettres de motivation</h1>
          <p className="text-app-2 text-sm leading-relaxed">Générez des lettres de motivation personnalisées automatiquement à partir de votre CV et de l'offre cible en quelques secondes.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-violet-400/10 border border-violet-400/20 text-violet-400 text-xs font-semibold px-4 py-2 rounded-full">
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
