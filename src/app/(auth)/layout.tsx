export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app flex items-center justify-center px-6 relative">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-hero-mesh opacity-100 pointer-events-none" />

      {/* Floating orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none animate-pulse-slow"
        style={{ backgroundColor: 'rgba(0,212,177,0.05)' }}
      />

      <div className="relative w-full flex flex-col items-center gap-8">
        {/* Logo */}
        <a href="/" className="font-display font-bold text-2xl text-app">
          entre<span style={{ color: 'var(--teal)' }}>hub</span>
        </a>

        {children}

        <p className="text-xs text-app-muted text-center max-w-xs">
          En vous inscrivant, vous acceptez nos{' '}
          <a href="#" className="underline hover:text-app-2 transition-colors">CGU</a>
          {' '}et notre{' '}
          <a href="#" className="underline hover:text-app-2 transition-colors">politique de confidentialité</a>.
        </p>
      </div>
    </div>
  );
}
