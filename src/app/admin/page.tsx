'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Users, ClipboardList, CheckCircle2,
  Clock, AlertTriangle, TrendingUp, Building2, ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  stats: { totalRegistrations: number; submitted: number; pending: number; failed: number; adminUsers: number };
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
  submitted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  unknown: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-400" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Welcome back, {session?.user?.adminName || session?.user?.name}
          </p>
        </div>
        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          View All Registrations
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Registrations" value={stats?.totalRegistrations || 0} color="blue" />
        <StatCard icon={CheckCircle2} label="Confirmed" value={stats?.submitted || 0} color="emerald" />
        <StatCard icon={Clock} label="Pending" value={stats?.pending || 0} color="amber" />
        <StatCard icon={AlertTriangle} label="Failed" value={stats?.failed || 0} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations by Competition */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Registrations by Competition
          </h3>
          <div className="space-y-2.5">
            {data?.registrationsByCompetition.map((c) => {
              const maxCount = Math.max(...(data.registrationsByCompetition.map((x) => x.count) || [1]));
              const pct = Math.round((c.count / maxCount) * 100);
              return (
                <div key={c.competition_slug} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{SLUG_LABELS[c.competition_slug] || c.competition_slug}</span>
                    <span className="text-slate-400 font-mono">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!data?.registrationsByCompetition || data.registrationsByCompetition.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-4">No registrations yet</p>
            )}
          </div>
        </div>

        {/* College Breakdown */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Top Colleges
          </h3>
          <div className="space-y-2">
            {data?.collegeBreakdown.map((c, i) => (
              <div key={c.leader_college} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-xs text-slate-300 font-medium">{c.leader_college || 'Unknown'}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{c.count}</span>
              </div>
            ))}
            {(!data?.collegeBreakdown || data.collegeBreakdown.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-4">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            Recent Registrations
          </h3>
          <Link href="/admin/registrations" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left py-2 pr-3 font-medium">Name</th>
                <th className="text-left py-2 pr-3 font-medium">Competition</th>
                <th className="text-left py-2 pr-3 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentRegistrations.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-2.5 pr-3">
                    <div>
                      <span className="text-slate-200 font-medium block">{r.leader_name}</span>
                      <span className="text-slate-500 text-[10px]">{r.leader_email}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{SLUG_LABELS[r.competition_slug] || r.competition_slug}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${STATUS_STYLES[r.submission_status] || STATUS_STYLES.unknown}`}>
                      {r.submission_status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!data?.recentRegistrations || data.recentRegistrations.length === 0) && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No registrations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
  };
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold text-white">{value.toLocaleString()}</span>
      </div>
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}
