'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AdminThemeProvider, useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Sun, Moon, ExternalLink, ShieldCheck } from 'lucide-react';

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useAdminTheme();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Generate readable title from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentSection = pathSegments[1]
    ? pathSegments[1].replace(/-/g, ' ').toUpperCase()
    : 'DASHBOARD';

  return (
    <div className="admin-glass-shell min-h-screen relative selection:bg-blue-500/25">
      {/* Dynamic ambient glassmesh background glow */}
      <div className="admin-ambient-glow" />

      {/* Modern High-End Sidebar */}
      <AdminSidebar />

      {/* Main Content Area with Fixed Glass Topbar */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        {/* Sleek Glass Topbar */}
        <header className="admin-glass-topbar sticky top-0 z-30 h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 pl-11 lg:pl-0 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
              <span className="hidden xs:inline">YUGANTAR</span> 2026
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500 shrink-0">/</span>
            <span className="text-xs font-bold tracking-wider font-mono truncate max-w-[120px] sm:max-w-none text-slate-800 dark:text-slate-200">
              {currentSection}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live TiDB Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>TiDB Online</span>
            </div>

            {/* Live Site Preview Link */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>Live Website</span>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Light / Dark mode"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400 hidden dark:inline-block" />
              <Moon className="w-3.5 h-3.5 text-blue-600 inline-block dark:hidden" />
              <span className="hidden dark:sm:inline text-neutral-300">Light Mode</span>
              <span className="hidden sm:inline dark:hidden text-slate-700">Dark Mode</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminThemeProvider>
  );
}
