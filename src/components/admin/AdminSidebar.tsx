'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Settings,
  Trophy,
  Users,
  ClipboardList,
  Image as ImageIcon,
  HelpCircle,
  Building2,
  Shield,
  Activity,
  Monitor,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/event-settings', label: 'Event Settings', icon: Settings },
  { href: '/admin/competitions', label: 'Competitions', icon: Trophy },
  { href: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
  { href: '/admin/organizers', label: 'Organizers', icon: Building2 },
  { href: '/admin/faq', label: 'FAQs', icon: HelpCircle },
  { href: '/admin/media', label: 'Media Library', icon: ImageIcon },
  { href: '/admin/users', label: 'Admin Users', icon: Users, roles: ['super_admin'] },
  { href: '/admin/audit-log', label: 'Audit Log', icon: Activity, roles: ['super_admin', 'content_admin'] },
  { href: '/admin/system', label: 'System Status', icon: Monitor, roles: ['super_admin'] },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  content_admin: 'Content Admin',
  registration_admin: 'Registration Admin',
  readonly_admin: 'Read Only',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  content_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  registration_admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  readonly_admin: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userRole = session?.user?.role || 'readonly_admin';
  const userName = session?.user?.adminName || session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || '';

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block leading-none">
              YUGANTAR
            </span>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
              ADMIN PANEL
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-blue-500/10 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700/50 p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {userName}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${ROLE_COLORS[userRole] || ROLE_COLORS.readonly_admin}`}>
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1 z-50">
              <div className="px-3 py-2 text-xs text-slate-400 truncate border-b border-slate-700 mb-1">
                {userEmail}
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <Monitor className="w-3.5 h-3.5" />
                View Public Site
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-[#0F172A] border-r border-slate-800 z-50 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:z-30`}
      >
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 lg:hidden w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
