import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-10 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-400/10 mx-auto">
          <TrendingUp className="w-7 h-7 text-orange-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-app mb-2">Career Coach IA</h1>
          <p className="text-app-2 text-sm leading-relaxed">Roadmap de compétences générée dynamiquement, recommandations d'apprentissage personnalisées et suivi visuel de votre progression.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-orange-400/10 border border-orange-400/20 text-orange-400 text-xs font-semibold px-4 py-2 rounded-full">
          🚧 En cours de développement — Phase 9
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
