import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="fr" suppressHydrationWarning>
        {/*
          suppressHydrationWarning est nécessaire car ThemeProvider
          injecte la classe (dark/light) côté client au premier render
        */}
        <body className="antialiased">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
