'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Search, Menu } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, clerkUser } = useUser();
  const [searchOpen, setSearchOpen] = useState(false);

  const firstName = profile?.first_name ?? clerkUser?.firstName ?? 'vous';

  return (
    <header className="h-16 border-b border-white/8 bg-navy-900/80 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden text-white/50 hover:text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Greeting */}
      <div className="flex-1">
        <p className="text-sm text-white/40 hidden sm:block">
          Bonjour,{' '}
          <span className="text-white/80 font-medium capitalize">{firstName}</span> 👋
        </p>
      </div>

      {/* Search */}
      <button
        onClick={() => setSearchOpen((s) => !s)}
        className="flex items-center gap-2 text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-4 py-2 text-sm transition-all duration-150"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Rechercher…</span>
        <kbd className="hidden sm:inline text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/30">⌘K</kbd>
      </button>

      {/* Notifications */}
      <button className="relative text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/6">
        <Bell className="w-5 h-5" />
        {/* Badge */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-400 rounded-full ring-2 ring-navy-900" />
      </button>

      {/* Clerk UserButton */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'w-8 h-8',
            userButtonPopoverCard: 'bg-navy-800 border border-white/10 shadow-xl',
            userButtonPopoverActionButton: 'text-white/70 hover:text-white hover:bg-white/8',
            userButtonPopoverActionButtonText: 'text-sm',
            userButtonPopoverFooter: 'hidden',
          },
        }}
        afterSignOutUrl="/"
      />
    </header>
  );
}
