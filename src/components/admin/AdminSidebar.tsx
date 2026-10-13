'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import {
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  ClipboardList,
  Image as ImageIcon,
  FileSpreadsheet,
  HelpCircle,
  Building2,
  Activity,
  Monitor,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Zap,
  Globe,
  Sun,
  Moon,
  Shield,
  Sparkles,
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    exact?: boolean;
    roles?: string[];
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Festival Management',
    items: [
      { href: '/admin/event-settings', label: 'Event Settings', icon: Settings },
      { href: '/admin/homepage', label: 'Homepage Content', icon: Globe },
      { href: '/admin/competitions', label: 'Competitions & Tracks', icon: Trophy },
      { href: '/admin/organizers', label: 'Organizers & Bodies', icon: Building2 },
      { href: '/admin/faq', label: 'FAQs & Inquiries', icon: HelpCircle },
      { href: '/admin/media', label: 'Media Library', icon: ImageIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
      { href: '/admin/spreadsheets', label: 'Spreadsheet Manager', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/users', label: 'Admin Users', icon: Users, roles: ['super_admin'] },
      { href: '/admin/audit-log', label: 'Audit Trail', icon: Activity, roles: ['super_admin', 'content_admin'] },
      { href: '/admin/system', label: 'System Health', icon: Monitor, roles: ['super_admin'] },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  content_admin: 'Content Admin',
  registration_admin: 'Registration Admin',
  readonly_admin: 'Read Only',
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleTheme } = useAdminTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/admin/login') return null;

  const userRole = session?.user?.role || 'super_admin';
  const userName = session?.user?.adminName || session?.user?.name || 'Administrator';

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Drawer Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open Navigation Drawer"
        className={`fixed top-3 left-3 z-40 lg:hidden w-10 h-10 rounded-xl admin-glass-panel flex items-center justify-center text-current shadow-lg cursor-pointer transition-all active:scale-95 border border-black/10 dark:border-white/10 ${
          mobileOpen ? 'hidden' : 'flex'
        }`}
      >
        <Menu className="w-5 h-5 text-blue-500" />
      </button>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-45 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* High-End Glassmorphic Sidebar (Desktop + Mobile) */}
      <aside
        suppressHydrationWarning
        className={`admin-glass-sidebar fixed top-0 left-0 bottom-0 w-72 sm:w-80 lg:w-64 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:z-30`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close Navigation Drawer"
          className="absolute top-4 right-4 lg:hidden w-8 h-8 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col h-full select-none">
          {/* Brand Header with Glass Depth */}
          <div className="px-5 py-5 border-b border-black/5 dark:border-white/8 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all">
                <div className="w-full h-full bg-[#0D1017] dark:bg-[#0D1017] rounded-[11px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold tracking-wider uppercase font-display text-slate-900 dark:text-white">
                    YUGANTAR
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    2026
                  </span>
                </div>
                <div className="text-[10px] font-mono tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  NEXUS CONTROL
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter(
                (item) => !item.roles || item.roles.includes(userRole)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.label} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1.5 font-mono">
                    {group.label}
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                          active
                            ? 'bg-blue-600 text-white font-semibold shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
                            : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent font-medium'
                        }`}
                      >
                        {/* Active Left Indicator Pill */}
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white dark:bg-blue-400 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                        )}

                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? 'text-white dark:text-blue-400'
                              : 'text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>

                        {item.badge && (
                          <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                            active ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* User Card with Quick Switcher */}
          <div className="border-t border-black/5 dark:border-white/8 p-3">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-black/3 dark:bg-white/4 border border-black/5 dark:border-white/8 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-[1.5px] shadow-sm shrink-0">
                      <div
                        suppressHydrationWarning
                        className="w-full h-full bg-[#0D1017] rounded-[10px] flex items-center justify-center text-xs font-bold text-white"
                      >
                        {(userName || 'A').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span
                        suppressHydrationWarning
                        className="text-xs font-bold block truncate leading-tight text-slate-900 dark:text-white"
                      >
                        {userName}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-zinc-300 font-semibold inline-block mt-0.5"
                      >
                        {ROLE_LABELS[userRole] || userRole}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    title="Toggle Dark/Light Mode"
                    className="p-1.5 rounded-lg border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400 hidden dark:inline-block" />
                    <Moon className="w-3.5 h-3.5 text-blue-600 inline-block dark:hidden" />
                  </button>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/8 flex items-center justify-between text-xs">
                  <Link
                    href="/"
                    target="_blank"
                    className="text-[11px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Monitor className="w-3 h-3 text-blue-500" />
                    <span>Live Site</span>
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="text-[11px] text-red-600 dark:text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
