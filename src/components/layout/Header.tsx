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
    <header
      className="h-16 border-b border-app flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--surface)',
        backdropFilter:  'blur(12px)',
        boxShadow:       'var(--shadow)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-xl transition-colors text-app-2 hover:text-app"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Greeting */}
      <div className="flex-1 min-w-0">
        <p className="text-sm hidden sm:block text-app-2">
          Bonjour,{' '}
          <span className="font-semibold text-app capitalize">{firstName}</span> 👋
        </p>
      </div>

      {/* Search */}
      <button
        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-app text-sm transition-all text-app-muted hover:text-app-2 hover:border-[var(--border-hover)]"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        <Search className="w-4 h-4 shrink-0" />
        <span>Rechercher…</span>
        <kbd
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        className="p-2 rounded-xl transition-all text-app-muted hover:text-app"
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        {theme === 'dark'
          ? <Sun  className="w-4 h-4 text-yellow-500" />
          : <Moon className="w-4 h-4 text-indigo-500" />
        }
      </button>

      {/* Notifications */}
      <button
        className="relative p-2 rounded-xl transition-all text-app-muted hover:text-app"
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        <Bell className="w-4 h-4" />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--teal)' }}
        />
      </button>

      {/* Clerk UserButton */}
      <UserButton
        appearance={{
          elements: {
            avatarBox:              'w-8 h-8 ring-2',
            userButtonPopoverCard:  'shadow-xl',
            userButtonPopoverFooter: 'hidden',
          },
        }}
        afterSignOutUrl="/"
      />
    </header>
  );
}
