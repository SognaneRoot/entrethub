'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Mic2,
  Mail,
  TrendingUp,
  Briefcase,
  Trophy,
  Settings,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Mon CV',          href: '/dashboard/cv',        icon: FileText },
  { label: 'Entretiens',      href: '/dashboard/interview', icon: Mic2 },
  { label: 'Lettres de moti.', href: '/dashboard/cover-letter', icon: Mail },
  { label: 'Career Coach',    href: '/dashboard/coach',     icon: TrendingUp },
  { label: 'Candidatures',    href: '/dashboard/jobs',      icon: Briefcase },
  { label: 'Progression',     href: '/dashboard/progress',  icon: Trophy },
];

const BOTTOM_ITEMS = [
  { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-navy-900 border-r border-white/8 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/8 shrink-0',
        collapsed ? 'justify-center' : 'gap-2'
      )}>
        <div className="w-8 h-8 rounded-lg bg-teal-400 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-navy-900" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-white text-lg">
            entre<span className="text-teal-400">hub</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                    active
                      ? 'bg-teal-400/15 text-teal-300'
                      : 'text-white/50 hover:text-white hover:bg-white/6'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    'w-4.5 h-4.5 shrink-0',
                    active ? 'text-teal-400' : 'text-white/40 group-hover:text-white/70'
                  )} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1 border-t border-white/8 pt-4">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-teal-400/15 text-teal-300'
                  : 'text-white/50 hover:text-white hover:bg-white/6'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/6 text-sm transition-all"
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          <ChevronLeft className={cn('w-4 h-4 shrink-0 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && 'Réduire'}
        </button>
      </div>
    </aside>
  );
}
