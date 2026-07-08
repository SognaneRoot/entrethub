import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md">
        {/* Big 404 */}
        <div className="font-display font-extrabold text-[120px] leading-none"
          style={{ color: 'var(--teal)', opacity: 0.15 }}>
          404
        </div>

        <div className="-mt-8 space-y-3">
          <h1 className="font-display text-2xl font-bold text-app">
            Page introuvable
          </h1>
          <p className="text-app-muted text-sm leading-relaxed">
            Cette page n'existe pas ou a été déplacée.
            Retournez à l'accueil ou à votre tableau de bord.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--teal)', color: '#0F1629' }}
          >
            Mon dashboard
          </Link>
          <Link
            href="/"
            className="text-sm font-medium px-5 py-2.5 rounded-xl border border-app text-app-2 hover:text-app hover:border-[var(--border-hover)] transition-all"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
