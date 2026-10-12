'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  ArrowUpRight,
  RefreshCw,
  LogIn,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: { totalRegistrations: number; submitted: number; pending: number; failed: number; adminUsers: number };
  festivalDate?: string;
  registrationsByCompetition: { competition_slug: string; count: number }[];
  collegeBreakdown: { leader_college: string; count: number }[];
  recentRegistrations: { id: string; leader_name: string; leader_email: string; competition_slug: string; submission_status: string; created_at: string }[];
}

const SLUG_LABELS: Record<string, string> = {
  'project-competition': 'Project Competition',
  'ppt-presentation': 'PPT Presentation',
  'breadboard-competition': 'Breadboard',
  'ideathon': 'Ideathon',
  'poster-competition': 'Poster',
  'e-gaming': 'E-Gaming',
  'open-mic': 'Open Mic',
  'mock-placement-drive': 'Mock Placement',
};

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold',
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-semibold',
  failed: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-semibold',
  unknown: 'bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700 font-semibold',
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);

    fetch('/api/admin/dashboard', { credentials: 'same-origin' })
      .then(async (r) => {
        if (r.status === 401) {
          router.replace('/admin/login?callbackUrl=/admin');
          return null;
        }
        const json = await r.json();
        if (!r.ok || json.error) {
          throw new Error(json.error || 'Failed to load dashboard data');
        }
        return json as DashboardData;
      })
      .then((d) => {
        if (d) {
          setData(d);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
          <div className="space-y-2">
            <div className="h-7 w-56 admin-glass-panel rounded-lg" />
            <div className="h-4 w-72 admin-glass-panel rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 admin-glass-panel rounded-xl" />
            <div className="h-9 w-28 admin-glass-panel rounded-xl" />
            <div className="h-9 w-40 admin-glass-panel rounded-xl" />
          </div>
        </div>

        {/* Banner Skeleton */}
        <div className="h-16 admin-glass-panel rounded-2xl" />

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 admin-glass-card rounded-2xl" />
          ))}
        </div>

        {/* 2 Detail Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 admin-glass-panel rounded-2xl" />
          <div className="h-72 admin-glass-panel rounded-2xl" />
        </div>

        {/* Recent Registrations Table Skeleton */}
        <div className="h-64 admin-glass-panel rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-500" />
            Control Centre Overview
          </h1>
        </div>

        <div className="p-8 rounded-2xl admin-glass-panel border border-red-500/20 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard Notice</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">{error}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            {!session && (
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl admin-glass-panel text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-500/40 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalRegistrations: 0,
    submitted: 0,
    pending: 0,
    failed: 0,
    adminUsers: 0,
  };

  const registrationsByCompetition = Array.isArray(data?.registrationsByCompetition)
    ? data.registrationsByCompetition
    : [];

  const collegeBreakdown = Array.isArray(data?.collegeBreakdown)
    ? data.collegeBreakdown
    : [];

  const recentRegistrations = Array.isArray(data?.recentRegistrations)
    ? data.recentRegistrations
    : [];

  const maxCount = Math.max(
    ...registrationsByCompetition.map((x) => x.count || 0),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Operations Overview
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
            Logged in as <span suppressHydrationWarning className="text-slate-900 dark:text-white font-semibold">{session?.user?.adminName || session?.user?.name || 'Administrator'}</span> • Live TiDB Database
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchDashboardData}
            title="Sync with TiDB Database"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl admin-glass-panel text-xs font-mono text-slate-700 dark:text-zinc-300 hover:border-blue-500/40 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Sync DB</span>
          </button>
          <Link
            href="/admin/competitions"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl admin-glass-panel text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-500/40 transition-all shadow-xs"
          >
            <Trophy className="w-3.5 h-3.5 text-blue-500" />
            <span>Competitions</span>
          </Link>
          <Link
            href="/admin/registrations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Manage Registrations</span>
          </Link>
        </div>
      </div>

      {/* Executive Festival Banner */}
      <div className="p-4 rounded-2xl admin-glass-panel flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Festival Scheduled: {data?.festivalDate || '19 October 2026'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ACTIVE EDITION
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Priyadarshini College of Engineering, Nagpur • NEXUS CITY Edition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/event-settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl admin-glass-card text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-blue-500/40 transition"
          >
            <span>Configure Dates & Identity</span>
            <ArrowUpRight className="w-3 h-3 text-blue-500" />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          icon={ClipboardList}
          label="Total Registrations"
          value={stats.totalRegistrations}
          detail="All tracks cumulative"
        />
        <StatCard
          icon={CheckCircle2}
          label="Confirmed"
          value={stats.submitted}
          detail="Verified submissions"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={stats.pending}
          detail="Awaiting review"
        />
        <StatCard
          icon={AlertTriangle}
          label="Failed Submissions"
          value={stats.failed}
          detail="Requires intervention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations by Competition */}
        <div className="admin-glass-panel rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5 dark:border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Registrations by Track
            </h3>
            <span className="text-[11px] font-mono opacity-60">
              {registrationsByCompetition.length} active
            </span>
          </div>

          <div className="space-y-3.5">
            {registrationsByCompetition.map((c) => {
              const count = c.count || 0;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={c.competition_slug} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      {SLUG_LABELS[c.competition_slug] || c.competition_slug}
                    </span>
                    <span className="font-mono text-xs opacity-75">
                      {count} <span className="text-[10px] opacity-60">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {registrationsByCompetition.length === 0 && (
              <p className="text-xs opacity-60 text-center py-8">
                No competition registrations recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* College Breakdown */}
        <div className="admin-glass-panel rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5 dark:border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              Institutional Representation
            </h3>
            <span className="text-[11px] font-mono opacity-60">
              Top Colleges
            </span>
          </div>

          <div className="space-y-2">
            {collegeBreakdown.map((c, i) => (
              <div
                key={c.leader_college || `college-${i}`}
                className="flex items-center justify-between p-3 rounded-xl admin-glass-card text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-semibold truncate">
                    {c.leader_college || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold shrink-0 ml-3">
                  {c.count || 0}
                </span>
              </div>
            ))}
            {collegeBreakdown.length === 0 && (
              <p className="text-xs opacity-60 text-center py-8">
                No institutional data recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="admin-glass-panel rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5 dark:border-white/5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Recent Registration Activity
            </h3>
            <p className="text-[11px] opacity-60 mt-0.5">
              Live registrations stream from database
            </p>
          </div>
          <Link
            href="/admin/registrations"
            className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 font-semibold"
          >
            View all {stats.totalRegistrations} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 text-left text-slate-600 dark:text-zinc-400 font-mono">
                <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">Candidate / Team</th>
                <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">Competition</th>
                <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-3 font-bold text-[11px] uppercase tracking-wider">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {recentRegistrations.map((r) => (
                <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{r.leader_name}</span>
                      <span className="text-slate-500 dark:text-zinc-400 text-[10px] font-mono">{r.leader_email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-zinc-300 font-medium">
                    {SLUG_LABELS[r.competition_slug] || r.competition_slug}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${STATUS_STYLES[(r.submission_status || '').toLowerCase()] || STATUS_STYLES.unknown}`}>
                      {r.submission_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-zinc-400">
                    No registrations recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="p-3.5 sm:p-5 rounded-2xl admin-glass-card flex flex-col justify-between group hover:border-blue-500/40 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-mono truncate">{label}</span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
          {Number(value || 0).toLocaleString()}
        </div>
        <div className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-zinc-400 mt-0.5 sm:mt-1 truncate">{detail}</div>
      </div>
    </div>
  );
}
