'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface AuditEntry {
  id: string; admin_id: string; admin_email: string; action: string;
  entity_type: string; entity_id: string; details: string | null;
  ip_address: string | null; created_at: string;
}

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  update: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function getActionStyle(action: string) {
  if (action.startsWith('create')) return ACTION_STYLES.create;
  if (action.startsWith('update')) return ACTION_STYLES.update;
  if (action.startsWith('delete')) return ACTION_STYLES.delete;
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '30' });
    if (entityType) params.set('entityType', entityType);

    fetch(`/api/admin/audit-log?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, entityType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          Audit Log
          <span className="text-sm font-normal text-slate-400">({total} entries)</span>
        </h1>
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">All Entity Types</option>
          <option value="site_settings">Settings</option>
          <option value="registration">Registrations</option>
          <option value="admin_user">Admin Users</option>
          <option value="faq">FAQs</option>
          <option value="organizer">Organizers</option>
        </select>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50 bg-slate-800/60">
                <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                <th className="text-left py-3 px-3 font-medium">Admin</th>
                <th className="text-left py-3 px-3 font-medium">Action</th>
                <th className="text-left py-3 px-3 font-medium">Entity</th>
                <th className="text-left py-3 px-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                    {[...Array(5)].map((_, j) => <td key={j} className="py-3 px-3"><div className="h-4 bg-slate-700/50 rounded" /></td>)}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">No audit entries found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{log.admin_email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${getActionStyle(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-400">{log.entity_type}</span>
                      <span className="text-slate-600 font-mono text-[10px] block">{log.entity_id?.substring(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {log.details ? (() => { try { const d = JSON.parse(log.details); return JSON.stringify(d); } catch { return log.details; } })() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
