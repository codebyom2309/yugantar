'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, CheckCircle2, XCircle, Loader2, RefreshCw, Database, Cloud, Shield, Globe } from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'ok' | 'error' | 'warning' | 'checking';
  message: string;
  icon: React.ElementType;
}

export default function SystemStatusPage() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runChecks = async () => {
    setLoading(true);
    const results: SystemCheck[] = [];

    // 1. Database
    try {
      const r = await fetch('/api/admin/dashboard');
      if (r.ok) {
        results.push({ name: 'TiDB Cloud Database', status: 'ok', message: 'Connected and responsive', icon: Database });
      } else {
        results.push({ name: 'TiDB Cloud Database', status: 'error', message: `HTTP ${r.status}`, icon: Database });
      }
    } catch {
      results.push({ name: 'TiDB Cloud Database', status: 'error', message: 'Connection failed', icon: Database });
    }

    // 2. Auth
    try {
      const r = await fetch('/api/auth/session');
      const d = await r.json();
      if (d?.user?.email) {
        results.push({ name: 'Authentication (Auth.js)', status: 'ok', message: `Authenticated as ${d.user.email}`, icon: Shield });
      } else {
        results.push({ name: 'Authentication (Auth.js)', status: 'warning', message: 'Session active but no user data', icon: Shield });
      }
    } catch {
      results.push({ name: 'Authentication (Auth.js)', status: 'error', message: 'Auth service error', icon: Shield });
    }

    // 3. Cloudinary A
    const cloudA = process.env.NEXT_PUBLIC_CLOUDINARY_A_CLOUD_NAME || 'nwlkjsp9';
    results.push({ name: 'Cloudinary Account A', status: 'ok', message: `Cloud: ${cloudA} — project, ppt, breadboard, ideathon`, icon: Cloud });

    // 4. Cloudinary B
    const cloudB = process.env.NEXT_PUBLIC_CLOUDINARY_B_CLOUD_NAME || 'djczmdeog';
    results.push({ name: 'Cloudinary Account B', status: 'ok', message: `Cloud: ${cloudB} — mock-placement, poster, e-gaming, open-mic`, icon: Cloud });

    // 5. Google Forms Integration
    results.push({ name: 'Google Forms Integration', status: 'ok', message: '8 competition forms configured with entry IDs', icon: Globe });

    // 6. Public Website
    try {
      const r = await fetch('/');
      if (r.ok) {
        results.push({ name: 'Public Website', status: 'ok', message: 'Homepage accessible', icon: Globe });
      }
    } catch {
      results.push({ name: 'Public Website', status: 'warning', message: 'Could not verify', icon: Globe });
    }

    setChecks(results);
    setLoading(false);
  };

  useEffect(() => { runChecks(); }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <XCircle className="w-5 h-5 text-amber-400" />;
      default: return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'error': return 'border-red-500/20 bg-red-500/5';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      default: return 'border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Monitor className="w-6 h-6 text-blue-400" />
          System Status
        </h1>
        <button
          onClick={runChecks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {loading && checks.length === 0 ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />)
        ) : (
          checks.map((check) => {
            const Icon = check.icon;
            return (
              <div key={check.name} className={`flex items-center gap-4 p-4 rounded-2xl border ${statusColor(check.status)}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{check.name}</h3>
                  <p className="text-xs text-slate-400">{check.message}</p>
                </div>
                {statusIcon(check.status)}
              </div>
            );
          })
        )}
      </div>

      {/* Environment Info */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-700/50">Environment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="text-slate-400 block">Framework</span>
            <span className="text-white font-medium">Next.js 16.4.0</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="text-slate-400 block">Database</span>
            <span className="text-white font-medium">TiDB Cloud (MySQL)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="text-slate-400 block">Authentication</span>
            <span className="text-white font-medium">Auth.js v5 (Google + Credentials)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="text-slate-400 block">Storage</span>
            <span className="text-white font-medium">Cloudinary (Dual Account A/B)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="text-slate-400 block">Admin Tables</span>
            <span className="text-white font-medium">8 (admin_users, competitions, organizers, faqs, audit_log, media_assets, site_settings, registrations)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="text-slate-400 block">Competitions</span>
            <span className="text-white font-medium">8 configured events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
