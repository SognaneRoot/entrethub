'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/components/ui/ThemeProvider';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, clerkUser } = useUser();
  const { theme, toggle }      = useTheme();

  const firstName = profile?.first_name ?? clerkUser?.firstName ?? 'vous';

  return (
    <header className="h-16 border-b border-app flex items-center px-6 gap-4 sticky top-0 z-30"
      style={{ backgroundColor: 'var(--surface)', backdropFilter: 'blur(12px)' }}>

      {/* Mobile menu */}
      <button onClick={onMenuClick} className="md:hidden text-app-2 hover:text-app transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {/* Greeting */}
      <div className="flex-1">
        <p className="text-sm text-app-muted hidden sm:block">
          Bonjour,{' '}
          <span className="text-app-2 font-medium capitalize">{firstName}</span> 👋
        </p>
      </div>

      {/* Search */}
      <button className="flex items-center gap-2 text-app-muted hover:text-app-2 border border-app rounded-xl px-4 py-2 text-sm transition-all duration-150"
        style={{ backgroundColor: 'var(--surface-2)' }}>
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Rechercher…</span>
        <kbd className="hidden sm:inline text-xs px-1.5 py-0.5 rounded text-app-muted"
          style={{ backgroundColor: 'var(--border)' }}>⌘K</kbd>
      </button>

      {/* Dark / Light toggle */}
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        className="p-2 rounded-xl transition-all duration-200 text-app-muted hover:text-app"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {theme === 'dark'
          ? <Sun  className="w-4 h-4 text-yellow-400" />
          : <Moon className="w-4 h-4 text-indigo-400" />
        }
      </button>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl transition-colors text-app-muted hover:text-app"
        style={{ backgroundColor: 'var(--surface-2)' }}>
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--teal)] rounded-full ring-2"
          style={{ ringColor: 'var(--surface)' }} />
      </button>

      {/* Clerk UserButton — sans afterSignInUrl (déprécié) */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-8 h-8',
            userButtonPopoverCard: 'shadow-xl',
            userButtonPopoverFooter: 'hidden',
          },
        }}
        afterSignOutUrl="/"
      />
    </header>
  );
}
