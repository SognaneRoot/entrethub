import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Entrethub — Préparez vos candidatures. Réussissez vos entretiens.',
    template: '%s | Entrethub',
  },
  description:
    "Votre coach carrière IA : optimisation de CV, lettres de motivation, simulation d'entretiens et roadmap de compétences personnalisée.",
  keywords: ['CV', 'entretien', 'emploi', 'carrière', 'IA', 'coach', 'ATS'],
  authors: [{ name: 'Entrethub' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://entrethub.vercel.app',
    siteName: 'Entrethub',
    title: 'Entrethub — Coach Carrière IA',
    description: 'Préparez vos candidatures. Réussissez vos entretiens.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="fr" className="dark" suppressHydrationWarning>
        <body className="bg-[#0F1629] text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
