import Link from 'next/link';
import {
  FileText,
  Mic,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap,
  Brain,
  Target,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'CV Intelligent ATS',
    description:
      'Créez et optimisez votre CV pour passer les filtres automatiques. Score ATS en temps réel et suggestions ciblées par offre.',
    color: 'from-blue-500 to-teal-400',
  },
  {
    icon: Mic,
    title: 'Simulation d\'entretien',
    description:
      'Entraînez-vous avec un simulateur vocal et textuel. Questions adaptées à votre métier et niveau. Feedback IA immédiat.',
    color: 'from-teal-400 to-emerald-400',
  },
  {
    icon: Brain,
    title: 'Lettres de motivation',
    description:
      'Générez des lettres personnalisées automatiquement à partir de votre CV et de l\'offre cible en quelques secondes.',
    color: 'from-violet-500 to-blue-500',
  },
  {
    icon: TrendingUp,
    title: 'Career Coach IA',
    description:
      'Roadmap de compétences personnalisée, recommandations d\'apprentissage et suivi visuel de votre progression.',
    color: 'from-orange-400 to-pink-500',
  },
  {
    icon: Target,
    title: 'Tableau de bord candidatures',
    description:
      'Gérez toutes vos candidatures en un seul endroit. Statuts, relances et analyses pour maximiser vos chances.',
    color: 'from-teal-400 to-cyan-400',
  },
  {
    icon: Zap,
    title: 'Gamification & Progression',
    description:
      'Points, badges et streaks pour rester motivé au quotidien. Progressez étape par étape vers votre objectif.',
    color: 'from-yellow-400 to-orange-400',
  },
];

const stats = [
  { value: '3×', label: 'Plus de réponses avec un CV optimisé ATS' },
  { value: '85%', label: 'De nos utilisateurs décrochent un entretien' },
  { value: '< 5min', label: 'Pour générer une lettre de motivation' },
];

const testimonials = [
  {
    name: 'Aminata D.',
    role: 'Développeuse — passée de junior à senior',
    text: 'Grâce au simulateur d\'entretien, j\'ai pu m\'entraîner sur mes points faibles. J\'ai décroché le poste en 3 semaines.',
    stars: 5,
  },
  {
    name: 'Karim B.',
    role: 'Product Manager en reconversion',
    text: 'Le CV builder m\'a aidé à repositionner mes compétences. Mon score ATS est passé de 42% à 91% sur les offres ciblées.',
    stars: 5,
  },
  {
    name: 'Sophie M.',
    role: 'Designer UX — junior cherchant son premier poste',
    text: 'Le career coach m\'a donné une roadmap claire. Je savais exactement quoi apprendre et dans quel ordre.',
    stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1629] text-white">
      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 backdrop-blur-md bg-[#0F1629]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display font-bold text-xl tracking-tight">
            entre<span className="text-teal-400">hub</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors underline-teal">Fonctionnalités</a>
            <a href="#testimonials" className="hover:text-white transition-colors underline-teal">Témoignages</a>
            <a href="#pricing" className="hover:text-white transition-colors underline-teal">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-teal-400 hover:bg-teal-300 text-navy-900 px-5 py-2 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-teal-400/25"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Mesh background */}
        <div className="absolute inset-0 bg-hero-mesh opacity-100" />
        
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating teal orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-400/5 blur-3xl animate-pulse-slow pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-4 py-1.5 text-sm text-teal-300 mb-8 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Propulsé par GPT-4 & Claude — 100% gratuit pour démarrer</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            Préparez vos{' '}
            <span className="relative inline-block">
              candidatures.
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 to-blue-500 rounded-full" />
            </span>
            <br />
            <span className="text-teal-400">Réussissez</span> vos entretiens.
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Entrethub est votre coach carrière IA : CV optimisé ATS, lettres de motivation
            personnalisées, simulation d'entretiens et roadmap de compétences sur-mesure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-navy-900 font-bold text-base px-8 py-4 rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-teal-400/30 hover:scale-105 glow-teal"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-base px-8 py-4 rounded-full border border-white/12 hover:border-white/25 transition-all duration-200"
            >
              Voir les fonctionnalités
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-5 text-center">
                <div className="font-display text-3xl font-extrabold text-teal-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Tout ce qu'il vous faut{' '}
              <span className="text-teal-400">pour décrocher le poste</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Six modules IA intégrés qui couvrent l'intégralité de votre parcours de recherche d'emploi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group glass rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.06] cursor-default"
                >
                  <div
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${feat.color} mb-5`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-teal-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Ils ont trouvé leur poste
            </h2>
            <p className="text-white/50 text-lg">Ce qu'ils disent après avoir utilisé Entrethub.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-teal-400 text-teal-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing teaser ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Commencez <span className="text-teal-400">gratuitement</span>
            </h2>
            <p className="text-white/50 text-lg">Pas de carte bancaire requise.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="glass rounded-2xl p-8">
              <div className="mb-6">
                <div className="font-display text-2xl font-bold mb-1">Gratuit</div>
                <div className="text-4xl font-extrabold">0€<span className="text-white/30 text-lg font-normal">/mois</span></div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '3 CVs optimisés',
                  '5 simulations d\'entretien',
                  '3 lettres de motivation',
                  'Tableau de bord candidatures',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block text-center w-full border border-white/20 hover:border-teal-400/50 text-white font-semibold py-3 rounded-xl transition-all duration-200"
              >
                Créer un compte
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl p-8 bg-gradient-to-br from-teal-400/20 to-blue-600/20 border border-teal-400/30">
              <div className="absolute top-4 right-4 bg-teal-400 text-navy-900 text-xs font-bold px-3 py-1 rounded-full">
                POPULAIRE
              </div>
              <div className="mb-6">
                <div className="font-display text-2xl font-bold mb-1">Premium</div>
                <div className="text-4xl font-extrabold text-teal-400">
                  19€<span className="text-white/30 text-lg font-normal">/mois</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'CVs & lettres illimités',
                  'Entretiens vocaux illimités',
                  'Analyse vocale en direct',
                  'Career Coach complet',
                  'Gamification & badges',
                  'Support prioritaire',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block text-center w-full bg-teal-400 hover:bg-teal-300 text-navy-900 font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-teal-400/30"
              >
                Essayer 14 jours gratuits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-5">
            Votre prochain poste commence <span className="text-teal-400">ici.</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Rejoignez des milliers de candidats qui utilisent Entrethub pour préparer leurs candidatures.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-navy-900 font-bold text-lg px-10 py-4 rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-teal-400/30 hover:scale-105"
          >
            Commencer gratuitement — 0€
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span className="font-display font-bold text-white/50">
            entre<span className="text-teal-400/70">hub</span>
          </span>
          <span>© {new Date().getFullYear()} Entrethub. Tous droits réservés.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/60 transition-colors">CGU</a>
            <a href="#" className="hover:text-white/60 transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
