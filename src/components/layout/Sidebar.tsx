'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Mic2, Mail,
  TrendingUp, Briefcase, Trophy, Settings,
  ChevronLeft, Zap, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { label: 'Tableau de bord',   href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Mon CV',            href: '/dashboard/cv',           icon: FileText        },
  { label: 'Entretiens',        href: '/dashboard/interview',    icon: Mic2            },
  { label: 'Lettres de motiv.', href: '/dashboard/cover-letter', icon: Mail            },
  { label: 'Career Coach',      href: '/dashboard/coach',        icon: TrendingUp      },
  { label: 'Candidatures',      href: '/dashboard/jobs',         icon: Briefcase       },
  { label: 'Progression',       href: '/dashboard/progress',     icon: Trophy          },
];

const BOTTOM_ITEMS = [
  { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavList({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_ITEMS.map(item => {
        const Icon   = item.icon;
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active ? '' : 'text-app-muted hover:text-app-2'
              )}
              style={active ? {
                backgroundColor: 'var(--teal-soft)',
                color: 'var(--teal)',
              } : {}}
            >
              <Icon className="w-4 h-4 shrink-0"
                style={active ? { color: 'var(--teal)' } : {}} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--teal)' }} />
              )}
            </Link>
          </li>
        );
      })}
    </>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-app shrink-0',
        collapsed && !mobile ? 'justify-center' : 'gap-2 justify-between'
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--teal)' }}>
            <Zap className="w-4 h-4" style={{ color: '#0F1629' }} />
          </div>
          {(!collapsed || mobile) && (
            <span className="font-display font-bold text-app text-lg">
              entre<span style={{ color: 'var(--teal)' }}>hub</span>
            </span>
          )}
        </div>
        {mobile && (
          <button onClick={onMobileClose}
            className="text-app-muted hover:text-app transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          <NavList collapsed={collapsed && !mobile} onClose={mobile ? onMobileClose : undefined} />
        </ul>
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1 border-t border-app pt-4">
        {BOTTOM_ITEMS.map(item => {
          const Icon   = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={mobile ? onMobileClose : undefined}
              title={collapsed && !mobile ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-app-muted hover:text-app-2"
              style={active ? { backgroundColor: 'var(--teal-soft)', color: 'var(--teal)' } : {}}>
              <Icon className="w-4 h-4 shrink-0" />
              {(!collapsed || mobile) && item.label}
            </Link>
          );
        })}

        {/* Collapse toggle — desktop only */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-app-muted hover:text-app-2"
          >
            <ChevronLeft className={cn('w-4 h-4 shrink-0 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && 'Réduire'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 border-r border-app',
          collapsed ? 'w-16' : 'w-60'
        )}
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent mobile />
      </aside>
    </>
  );
}
