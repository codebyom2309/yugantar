'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface AuditEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Audit Log & System History
            <span className="text-sm font-normal text-slate-500 dark:text-zinc-400 font-mono">({total} entries)</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Immutable administrative activity trail, configuration changes, and registration operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="admin-glass-input px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Entity Types</option>
            <option value="competition">Competitions</option>
            <option value="site_settings">Settings</option>
            <option value="registration">Registrations</option>
            <option value="media">Media Assets</option>
            <option value="admin_user">Admin Users</option>
            <option value="faq">FAQs</option>
            <option value="organizer">Organizers</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="admin-glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-zinc-400 text-left font-mono">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                    No audit records found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-zinc-300 font-mono text-[11px] font-semibold">
                      {log.admin_email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-800 dark:text-zinc-200 font-medium">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 8)})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px] max-w-xs truncate">
                      {log.details ? (
                        <span title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-mono">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded admin-glass-panel disabled:opacity-40 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded admin-glass-panel disabled:opacity-40 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
