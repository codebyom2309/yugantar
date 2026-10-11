'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList, Search, Filter, Download, Eye, Trash2,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle,
  X, ExternalLink,
} from 'lucide-react';

interface Registration {
  id: string; competition_slug: string; leader_name: string; leader_email: string;
  leader_phone: string; leader_college: string; leader_branch: string; leader_semester: string;
  team_name: string | null; team_size: number; payment_id: string | null;
  payment_proof_url: string | null; submission_status: string; submission_error: string | null;
  submitted_at: string | null; created_at: string; verification_token: string | null;
}

const SLUG_LABELS: Record<string, string> = {
  'project-competition': 'Project', 'ppt-presentation': 'PPT', 'breadboard-competition': 'Breadboard',
  'ideathon': 'Ideathon', 'poster-competition': 'Poster', 'e-gaming': 'E-Gaming',
  'open-mic': 'Open Mic', 'mock-placement-drive': 'Mock Placement',
};

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  unknown: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [competition, setCompetition] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '25' });
    if (search) params.set('search', search);
    if (competition) params.set('competition', competition);
    if (statusFilter) params.set('status', statusFilter);

    const r = await fetch(`/api/admin/registrations?${params}`);
    const d = await r.json();
    setRegistrations(d.registrations || []);
    setTotal(d.total || 0);
    setTotalPages(d.totalPages || 1);
    setLoading(false);
  }, [page, search, competition, statusFilter]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch('/api/admin/registrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, submissionStatus: newStatus }),
    });
    fetchRegistrations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this registration?')) return;
    await fetch('/api/admin/registrations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchRegistrations();
  };

  const handleViewDetail = async (reg: Registration) => {
    setSelectedReg(reg);
    const r = await fetch(`/api/admin/registrations/${reg.id}`);
    const d = await r.json();
    setDetailData(d.registration || null);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'College', 'Branch', 'Semester', 'Competition', 'Team', 'Team Size', 'Payment ID', 'Status', 'Date'];
    const rows = registrations.map((r) => [
      r.leader_name, r.leader_email, r.leader_phone, r.leader_college, r.leader_branch,
      r.leader_semester, r.competition_slug, r.team_name || '', r.team_size, r.payment_id || '',
      r.submission_status, new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `registrations-${Date.now()}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-400" />
          Registrations
          <span className="text-sm font-normal text-slate-400">({total})</span>
        </h1>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, team, payment ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <select
          value={competition}
          onChange={(e) => { setCompetition(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">All Competitions</option>
          {Object.entries(SLUG_LABELS).map(([slug, label]) => (
            <option key={slug} value={slug}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50 bg-slate-800/60">
                <th className="text-left py-3 px-4 font-medium">Participant</th>
                <th className="text-left py-3 px-3 font-medium">Competition</th>
                <th className="text-left py-3 px-3 font-medium">College</th>
                <th className="text-left py-3 px-3 font-medium">Payment</th>
                <th className="text-left py-3 px-3 font-medium">Status</th>
                <th className="text-left py-3 px-3 font-medium">Date</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                    {[...Array(7)].map((_, j) => <td key={j} className="py-3 px-3"><div className="h-4 bg-slate-700/50 rounded" /></td>)}
                  </tr>
                ))
              ) : registrations.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No registrations found</td></tr>
              ) : (
                registrations.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{r.leader_name}</div>
                      <div className="text-slate-500 text-[10px]">{r.leader_email}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{SLUG_LABELS[r.competition_slug] || r.competition_slug}</td>
                    <td className="py-3 px-3 text-slate-400">{r.leader_college}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{r.payment_id || '—'}</td>
                    <td className="py-3 px-3">
                      <select
                        value={r.submission_status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase bg-transparent cursor-pointer ${STATUS_STYLES[r.submission_status] || STATUS_STYLES.unknown}`}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewDetail(r)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Page {page} of {totalPages} ({total} total)</span>
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

      {/* Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedReg(null); setDetailData(null); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Registration Detail</h3>
              <button onClick={() => { setSelectedReg(null); setDetailData(null); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <DetailRow label="ID" value={selectedReg.id} mono />
              <DetailRow label="Name" value={selectedReg.leader_name} />
              <DetailRow label="Email" value={selectedReg.leader_email} />
              <DetailRow label="Phone" value={selectedReg.leader_phone} />
              <DetailRow label="College" value={selectedReg.leader_college} />
              <DetailRow label="Branch" value={selectedReg.leader_branch} />
              <DetailRow label="Semester" value={selectedReg.leader_semester} />
              <DetailRow label="Competition" value={SLUG_LABELS[selectedReg.competition_slug] || selectedReg.competition_slug} />
              <DetailRow label="Team" value={selectedReg.team_name || 'Individual'} />
              <DetailRow label="Team Size" value={String(selectedReg.team_size)} />
              <DetailRow label="Payment ID" value={selectedReg.payment_id || '—'} mono />
              {selectedReg.payment_proof_url && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                  <span className="text-slate-400">Payment Proof</span>
                  <a href={selectedReg.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <DetailRow label="Status" value={selectedReg.submission_status} />
              <DetailRow label="Created" value={new Date(selectedReg.created_at).toLocaleString()} />
              {selectedReg.submitted_at && <DetailRow label="Submitted" value={new Date(selectedReg.submitted_at).toLocaleString()} />}
              {selectedReg.submission_error && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                  <span className="text-red-400 font-medium block mb-1">Error</span>
                  <span className="text-red-300/80">{selectedReg.submission_error}</span>
                </div>
              )}
              {(() => {
                const fd = detailData?.form_data;
                if (!fd || typeof fd !== 'object') return null;
                const entries = Object.entries(fd as Record<string, string>);
                if (entries.length === 0) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <h4 className="text-sm font-bold text-white mb-3">Full Form Data</h4>
                    <div className="space-y-2">
                      {entries.map(([key, value]) => (
                        <DetailRow key={key} label={key} value={String(value)} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
      <span className="text-slate-400">{label}</span>
      <span className={`text-slate-200 font-medium ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
    </div>
  );
}
