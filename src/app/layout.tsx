import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Entrethub — Préparez vos candidatures. Réussissez vos entretiens.',
    template: '%s | Entrethub',
  },
  description:
    "Votre coach carrière IA : optimisation de CV, lettres de motivation, simulation d'entretiens et roadmap de compétences personnalisée.",
  keywords: ['CV', 'entretien', 'emploi', 'carrière', 'IA', 'coach', 'ATS'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="fr" suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
