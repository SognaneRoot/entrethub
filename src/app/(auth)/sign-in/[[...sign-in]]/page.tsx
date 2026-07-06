import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0F1629] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-hero-mesh opacity-60" />
      <div className="relative">
        <div className="text-center mb-8">
          <span className="font-display font-bold text-2xl text-white">
            entre<span className="text-teal-400">hub</span>
          </span>
          <p className="text-white/50 text-sm mt-2">Connectez-vous à votre espace</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
