'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { getAbsoluteUrl } from '@/lib/site-url';
import {
  ClipboardList,
  Search,
  Download,
  Filter,
  Eye,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Printer,
  ShieldCheck,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import AdminDatePicker from '@/components/admin/AdminDatePicker';

interface Registration {
  id: string;
  competition_slug: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  leader_college: string;
  leader_branch: string;
  leader_semester: string;
  team_name: string | null;
  team_size: number;
  payment_id: string | null;
  payment_proof_url: string | null;
  submission_status: string;
  submission_error: string | null;
  submitted_at: string | null;
  created_at: string;
  verification_token: string | null;
  payment_status?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  normal_fee?: number | null;
  discount_amount?: number | null;
  discount_rule?: string | null;
  final_fee?: number | null;
  registration_mode?: 'LIVE' | 'TEST' | string;
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
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold',
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-semibold',
  failed: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-semibold',
  unknown: 'bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700 font-semibold',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  free: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-semibold',
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold',
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold',
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-semibold',
  rejected: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-semibold',
};

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [competition, setCompetition] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFilterDisplay, setDateFilterDisplay] = useState('');
  const [dateFilterIso, setDateFilterIso] = useState('');
  const [storageMode, setStorageMode] = useState<string>('minimal');
  const [spreadsheetsMap, setSpreadsheetsMap] = useState<Record<string, string>>({});
  const [modeFilter, setModeFilter] = useState<'LIVE' | 'TEST' | 'ALL'>('LIVE');
  const [countsByMode, setCountsByMode] = useState<{ live: number; test: number; all: number }>({ live: 0, test: 0, all: 0 });

  // View Layout Mode: auto (responsive cards on mobile, table on desktop) or explicit
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Detail & QR Modal States
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const [qrModalReg, setQrModalReg] = useState<Registration | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const fetchRegistrations = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '25' });
      if (modeFilter) params.set('mode', modeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (competition) params.set('competition', competition);
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
      if (dateFilterIso) params.set('date', dateFilterIso);

      const r = await fetch(`/api/admin/registrations?${params}`, { signal: controller.signal });
      const d = await r.json();
      if (r.ok && d.registrations) {
        setRegistrations(d.registrations);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        if (d.storageMode) setStorageMode(d.storageMode);
        if (d.countsByMode) setCountsByMode(d.countsByMode);
      } else {
        setRegistrations([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // aborted by subsequent keystroke or filter change
      }
      console.error('Failed to fetch registrations:', err);
      setRegistrations([]);
      setTotal(0);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [page, modeFilter, debouncedSearch, competition, statusFilter, paymentStatusFilter, dateFilterIso]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    // Load spreadsheet links for direct external sheet navigation
    fetch('/api/admin/spreadsheets')
      .then((res) => res.json())
      .then((data) => {
        if (data.spreadsheets && Array.isArray(data.spreadsheets)) {
          const map: Record<string, string> = {};
          data.spreadsheets.forEach((s: any) => {
            if (s.competition_slug) map[s.competition_slug] = s.spreadsheet_url;
          });
          setSpreadsheetsMap(map);
        }
      })
      .catch((err) => console.warn('Failed to load spreadsheets map:', err));
  }, []);

  // Bulk Selection Handlers
  const isAllCurrentSelected = useMemo(() => {
    if (registrations.length === 0) return false;
    return registrations.every((r) => selectedIds.includes(r.id));
  }, [registrations, selectedIds]);

  const toggleSelectAllCurrent = () => {
    if (isAllCurrentSelected) {
      const currentIds = new Set(registrations.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !currentIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...registrations.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, submissionStatus: newStatus }),
      });
      fetchRegistrations();
      if (selectedReg && selectedReg.id === id) {
        setSelectedReg((prev) => prev ? { ...prev, submission_status: newStatus } : null);
      }
      if (qrModalReg && qrModalReg.id === id) {
        setQrModalReg((prev) => prev ? { ...prev, submission_status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update registration status:', err);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newPaymentStatus: 'confirmed' | 'rejected') => {
    try {
      await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paymentStatus: newPaymentStatus }),
      });
      fetchRegistrations();
      if (selectedReg && selectedReg.id === id) {
        setSelectedReg((prev) =>
          prev
            ? {
                ...prev,
                payment_status: newPaymentStatus,
                submission_status: newPaymentStatus === 'confirmed' ? 'confirmed' : prev.submission_status,
              }
            : null
        );
      }
      if (qrModalReg && qrModalReg.id === id) {
        setQrModalReg((prev) =>
          prev
            ? {
                ...prev,
                payment_status: newPaymentStatus,
                submission_status: newPaymentStatus === 'confirmed' ? 'confirmed' : prev.submission_status,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  const handleBulkPaymentStatusChange = async (newPaymentStatus: 'confirmed' | 'rejected') => {
    if (selectedIds.length === 0) return;
    setIsBulkOperating(true);
    try {
      await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, paymentStatus: newPaymentStatus }),
      });
      setSelectedIds([]);
      fetchRegistrations();
    } catch (err) {
      console.error('Failed to execute bulk payment status update:', err);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setIsBulkOperating(true);
    try {
      await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, submissionStatus: newStatus }),
      });
      setSelectedIds([]);
      fetchRegistrations();
    } catch (err) {
      console.error('Failed to execute bulk status update:', err);
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this registration record from database?')) return;
    try {
      await fetch('/api/admin/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchRegistrations();
    } catch (err) {
      console.error('Failed to delete registration:', err);
    }
  };

  const handleViewDetail = async (reg: Registration) => {
    setSelectedReg(reg);
    try {
      const r = await fetch(`/api/admin/registrations/${reg.id}`);
      const d = await r.json();
      setDetailData(d.registration || null);
    } catch {
      setDetailData(null);
    }
  };

  // In-app QR Code generation & preview
  const handleOpenQrModal = async (reg: Registration) => {
    setQrModalReg(reg);
    try {
      const verifyToken = reg.verification_token || reg.id;
      const verifyUrl = getAbsoluteUrl(`/verify/${verifyToken}`);
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 260,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate modal QR:', err);
    }
  };

  const generateAndDownloadCSV = (dataToExport: Registration[], filenamePrefix = 'registrations') => {
    const headers = [
      'Registration ID',
      'Track Slug',
      'Track Name',
      'Leader Name',
      'Leader Email',
      'Leader Phone',
      'Leader College',
      'Leader Branch',
      'Leader Semester',
      'Team Name',
      'Team Size',
      'Payment ID (UTR)',
      'Payment Status',
      'Verified By',
      'Verified At',
      'Accreditation Status',
      'Registration Mode',
      'Date Created',
      'Verification Token',
    ];
    const rows = dataToExport.map((r) => [
      r.id,
      r.competition_slug,
      SLUG_LABELS[r.competition_slug] || r.competition_slug,
      r.leader_name,
      r.leader_email,
      r.leader_phone,
      r.leader_college,
      r.leader_branch,
      r.leader_semester,
      r.team_name || '',
      r.team_size,
      r.payment_id || '',
      r.payment_status || (r.payment_id ? 'pending' : 'free'),
      r.verified_by || '',
      r.verified_at ? new Date(r.verified_at).toLocaleString() : '',
      r.submission_status,
      r.registration_mode || 'LIVE',
      new Date(r.created_at).toLocaleString(),
      r.verification_token || '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yugantar-${filenamePrefix}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllMatching = async () => {
    setIsExportingAll(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (modeFilter) params.set('mode', modeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (competition) params.set('competition', competition);
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
      if (dateFilterIso) params.set('date', dateFilterIso);

      const r = await fetch(`/api/admin/registrations?${params}`);
      const d = await r.json();
      if (r.ok && Array.isArray(d.registrations)) {
        generateAndDownloadCSV(d.registrations, 'all-filtered');
      } else {
        generateAndDownloadCSV(registrations, 'page');
      }
    } catch (err) {
      console.error('Export failed:', err);
      generateAndDownloadCSV(registrations, 'page');
    } finally {
      setIsExportingAll(false);
    }
  };

  const exportSelectedOnly = () => {
    const selectedRows = registrations.filter((r) => selectedIds.includes(r.id));
    generateAndDownloadCSV(selectedRows, 'selected');
  };

  // Quick summary counts
  const confirmedCount = registrations.filter((r) => r.submission_status === 'submitted' || r.submission_status === 'confirmed').length;
  const pendingPaymentCount = registrations.filter((r) => (r.payment_status || (r.payment_id ? 'pending' : 'free')).toLowerCase() === 'pending').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500 shrink-0" />
            <span>Registration Control</span>
            <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg shrink-0">
              {total} Total
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
            Real-time participant database, payment verification, and pass credentials
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                storageMode === 'minimal'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800'
              }`}
              title="Storage mode from site_settings. Minimal mode keeps TiDB lean and preserves full responses in Google Sheets."
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Retention: {storageMode === 'minimal' ? 'Minimal (TiDB Storage Optimized)' : storageMode.toUpperCase()}</span>
            </span>

            {/* Direct Google Sheets quick link if filtered or general */}
            {competition && spreadsheetsMap[competition] && (
              <a
                href={spreadsheetsMap[competition]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Open Google Sheet ({SLUG_LABELS[competition] || competition})</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}

            <Link
              href="/admin/spreadsheets"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10 transition"
            >
              <span>Manage Sheets</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle (Cards vs Table) */}
          <div className="flex rounded-xl border border-black/10 dark:border-white/10 p-0.5 bg-black/5 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Card Roster View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={exportSelectedOnly}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportAllMatching}
            disabled={total === 0 || isExportingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-40 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isExportingAll ? 'Exporting...' : `Export CSV (${total})`}</span>
          </button>
        </div>
      </div>

      {/* Registration Environment & Campaign Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl admin-glass-panel border border-black/10 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setModeFilter('LIVE');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              modeFilter === 'LIVE'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>LIVE Participants</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              modeFilter === 'LIVE' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
            }`}>
              {countsByMode.live}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModeFilter('TEST');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              modeFilter === 'TEST'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Test Data (Internal QA)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              modeFilter === 'TEST' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
            }`}>
              {countsByMode.test}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModeFilter('ALL');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              modeFilter === 'ALL'
                ? 'bg-slate-800 dark:bg-zinc-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>All Records</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              modeFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
            }`}>
              {countsByMode.all}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 px-2">
          {modeFilter === 'LIVE' && 'Viewing official attendee submissions only'}
          {modeFilter === 'TEST' && 'Viewing isolated QA testing data'}
          {modeFilter === 'ALL' && 'Viewing combined dataset (LIVE + TEST)'}
        </div>
      </div>

      {modeFilter === 'TEST' && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            <strong>Internal Test Mode View Active:</strong> Showing {total} internal test records. These submissions are strictly isolated from official participant attendance and payment reconciliation.
          </span>
        </div>
      )}

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-2xl admin-glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-zinc-400 block font-semibold">Total Filtered</span>
            <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">{total}</span>
          </div>
          <Layers className="w-4 h-4 text-blue-500" />
        </div>

        <div className="p-3 rounded-2xl admin-glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 block font-semibold">Confirmed</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{confirmedCount}</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="p-3 rounded-2xl admin-glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-600 dark:text-amber-400 block font-semibold">Payment Pending</span>
            <span className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{pendingPaymentCount}</span>
          </div>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>

        <div className="p-3 rounded-2xl admin-glass-card flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-purple-600 dark:text-purple-400 block font-semibold">Selected</span>
            <span className="text-base sm:text-lg font-bold font-mono text-purple-600 dark:text-purple-400">{selectedIds.length}</span>
          </div>
          <CheckSquare className="w-4 h-4 text-purple-500" />
        </div>
      </div>

      {/* Fully Mobile-Responsive Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl admin-glass-panel flex flex-col gap-2.5 shadow-xs">
        {/* Full-text Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate, email, team name, or payment UTR..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="admin-glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
          />
        </div>

        {/* Filters Row: Stacks vertically on phone screens, wraps gracefully on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex items-center gap-2">
          {/* Competition Filter */}
          <select
            value={competition}
            onChange={(e) => {
              setCompetition(e.target.value);
              setPage(1);
            }}
            className="admin-glass-input w-full lg:w-auto px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Competition Tracks</option>
            {Object.entries(SLUG_LABELS).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className="admin-glass-input w-full lg:w-auto px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Payment Statuses</option>
            <option value="free">Free Registration Track</option>
            <option value="confirmed">Payment Verified</option>
            <option value="pending">Verification Pending</option>
            <option value="rejected">Payment Rejected</option>
          </select>

          {/* Accreditation / Submission Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="admin-glass-input w-full lg:w-auto px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Entry Statuses</option>
            <option value="submitted">Confirmed (Submitted)</option>
            <option value="pending">Pending Review</option>
            <option value="failed">Failed / Flagged</option>
          </select>

          {/* Date Picker Filter */}
          <div className="w-full lg:w-48">
            <AdminDatePicker
              value={dateFilterDisplay}
              onChange={(displayDate, isoDate) => {
                setDateFilterDisplay(displayDate);
                setDateFilterIso(isoDate || '');
                setPage(1);
              }}
              placeholder="Filter by date..."
            />
          </div>

          {/* Reset Filters button */}
          {(searchInput || competition || statusFilter || paymentStatusFilter || dateFilterIso) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setCompetition('');
                setStatusFilter('');
                setPaymentStatusFilter('');
                setDateFilterDisplay('');
                setDateFilterIso('');
                setPage(1);
              }}
              className="p-2 rounded-xl admin-glass-panel text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition shadow-xs cursor-pointer flex items-center justify-center gap-1 text-xs shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="sm:hidden">Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBulkOperating}
              onClick={() => handleBulkPaymentStatusChange('confirmed')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Payment</span>
            </button>
            <button
              type="button"
              disabled={isBulkOperating}
              onClick={() => handleBulkPaymentStatusChange('rejected')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Payment</span>
            </button>
            <button
              type="button"
              disabled={isBulkOperating}
              onClick={() => handleBulkStatusChange('submitted')}
              className="px-3 py-1.5 rounded-xl admin-glass-panel text-slate-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              Mark Confirmed
            </button>
            <button
              type="button"
              disabled={isBulkOperating}
              onClick={() => handleBulkStatusChange('pending')}
              className="px-3 py-1.5 rounded-xl admin-glass-panel text-slate-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              Mark Pending
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-xl admin-glass-panel text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Mobile Card Roster View (shows when on mobile OR viewMode === 'cards') */}
      <div className={`space-y-3 ${viewMode === 'cards' ? 'block' : 'block md:hidden'}`}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl admin-glass-panel animate-pulse space-y-3">
              <div className="h-5 bg-black/10 dark:bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2" />
              <div className="h-8 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))
        ) : registrations.length === 0 ? (
          <div className="p-8 rounded-2xl admin-glass-panel text-center text-xs text-slate-500 dark:text-zinc-400">
            No registrations found matching the active criteria.
          </div>
        ) : (
          registrations.map((r) => {
            const isChecked = selectedIds.includes(r.id);
            return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl admin-glass-panel space-y-3 border transition-all ${
                  isChecked
                    ? 'border-blue-500/40 bg-blue-500/5'
                    : 'border-black/5 dark:border-white/10'
                }`}
              >
                {/* Header: Checkbox + Name + Status Selector */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(r.id)}
                      className="mt-0.5 cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-blue-500"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {r.leader_name}
                        </h3>
                        {r.registration_mode === 'TEST' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            TEST DATA
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            LIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 block mt-0.5">
                        {r.leader_email}
                      </span>
                    </div>
                  </div>

                  <select
                    value={(r.submission_status || '').toLowerCase()}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase font-mono bg-transparent cursor-pointer border shrink-0 ${
                      STATUS_STYLES[(r.submission_status || '').toLowerCase()] || STATUS_STYLES.unknown
                    }`}
                  >
                    <option value="submitted" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400">SUBMITTED</option>
                    <option value="pending" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400">PENDING</option>
                    <option value="failed" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400">FAILED</option>
                  </select>
                </div>

                {/* Info Badges & Details */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-xl admin-glass-card">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono uppercase block">Track</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {SLUG_LABELS[r.competition_slug] || r.competition_slug}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl admin-glass-card">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono uppercase block">College</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {r.leader_college || '—'}
                    </span>
                  </div>
                </div>

                {/* Subtitle row: Team, UTR, Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400 pt-1 border-t border-black/5 dark:border-white/5">
                  <span className="truncate max-w-[180px]">
                    UTR: {r.payment_id || 'Not Recorded'}
                  </span>
                  <span>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>

                {/* Payment Status & Quick Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400 pt-1 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase">Payment:</span>
                    {(() => {
                      const pStatus = (r.payment_status || (r.payment_id ? 'pending' : 'free')).toLowerCase();
                      return (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                            PAYMENT_STATUS_STYLES[pStatus] || PAYMENT_STATUS_STYLES.pending
                          }`}
                        >
                          {pStatus === 'free'
                            ? 'Free Track'
                            : pStatus === 'confirmed' || pStatus === 'verified'
                            ? 'Verified'
                            : pStatus === 'rejected'
                            ? 'Rejected'
                            : 'Pending'}
                        </span>
                      );
                    })()}
                  </div>

                  {(() => {
                    const pStatus = (r.payment_status || (r.payment_id ? 'pending' : 'free')).toLowerCase();
                    if (pStatus === 'pending') {
                      return (
                        <button
                          type="button"
                          onClick={() => handleUpdatePaymentStatus(r.id, 'confirmed')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold cursor-pointer transition shadow-2xs"
                          title="Quick Verify Payment"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verify Payment</span>
                        </button>
                      );
                    }
                    if (r.verified_by) {
                      return (
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[120px]">
                          by {r.verified_by.split('@')[0]}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => handleOpenQrModal(r)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Pass & QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewDetail(r)}
                    className="p-1.5 rounded-xl admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    title="Full Record"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden on small screens if not forced) */}
      <div className={`admin-glass-panel rounded-2xl overflow-hidden shadow-sm ${
        viewMode === 'cards' ? 'hidden' : 'hidden md:block'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-zinc-400 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-left font-mono">
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllCurrent}
                    className="cursor-pointer text-slate-500 dark:text-zinc-400 hover:text-blue-500"
                    title={isAllCurrentSelected ? 'Deselect all' : 'Select all on page'}
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">Candidate / Team</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Track</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">College</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Payment UTR</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Payment Status</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Accreditation</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Date Recorded</th>
                <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3 text-center"><div className="w-4 h-4 bg-black/10 dark:bg-white/10 rounded mx-auto" /></td>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-3 px-3">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                    No registrations found matching the active criteria.
                  </td>
                </tr>
              ) : (
                registrations.map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                        isChecked ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(r.id)}
                          className="cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-blue-500"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Candidate info */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white block">{r.leader_name}</span>
                            {r.registration_mode === 'TEST' ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                TEST
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                LIVE
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 dark:text-zinc-400 text-[10px] font-mono">{r.leader_email}</span>
                          {r.team_name && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-mono">
                              Squad: {r.team_name} ({r.team_size} members)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-300 font-medium">
                        {SLUG_LABELS[r.competition_slug] || r.competition_slug}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">{r.leader_college || '—'}</td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                        {r.payment_id ? (
                          <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                            {r.payment_id}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Payment Status Cell */}
                      <td className="py-3 px-3">
                        {(() => {
                          const pStatus = (r.payment_status || (r.payment_id ? 'pending' : 'free')).toLowerCase();
                          return (
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border whitespace-nowrap ${
                                    PAYMENT_STATUS_STYLES[pStatus] || PAYMENT_STATUS_STYLES.pending
                                  }`}
                                >
                                  {pStatus === 'free'
                                    ? 'Free Track'
                                    : pStatus === 'confirmed' || pStatus === 'verified'
                                    ? 'Verified'
                                    : pStatus === 'rejected'
                                    ? 'Rejected'
                                    : 'Pending'}
                                </span>
                                {pStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePaymentStatus(r.id, 'confirmed')}
                                    className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-pointer transition shadow-2xs"
                                    title="Quick Verify Payment"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              {r.verified_by && (
                                <span
                                  className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[120px]"
                                  title={`Verified by ${r.verified_by} ${r.verified_at ? `on ${new Date(r.verified_at).toLocaleDateString()}` : ''}`}
                                >
                                  by {r.verified_by.split('@')[0]}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={(r.submission_status || '').toLowerCase()}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-transparent cursor-pointer border ${
                            STATUS_STYLES[(r.submission_status || '').toLowerCase()] || STATUS_STYLES.unknown
                          }`}
                        >
                          <option value="submitted" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400">SUBMITTED</option>
                          <option value="pending" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400">PENDING</option>
                          <option value="failed" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400">FAILED</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenQrModal(r)}
                            className="p-1.5 rounded-lg admin-glass-panel text-blue-600 dark:text-blue-400 hover:border-blue-500/40 transition-colors cursor-pointer"
                            title="Digital Pass & QR Preview"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewDetail(r)}
                            className="p-1.5 rounded-lg admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition-colors cursor-pointer"
                            title="Full Record Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Page {page} of {totalPages} ({total} entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Bar for Mobile Cards View */}
      {totalPages > 1 && (
        <div className={`flex md:hidden items-center justify-between p-3 rounded-2xl admin-glass-panel ${
          viewMode === 'cards' ? 'flex' : ''
        }`}>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg admin-glass-panel text-xs text-slate-600 dark:text-zinc-400 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-lg admin-glass-panel text-xs text-slate-600 dark:text-zinc-400 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* In-App Interactive Digital Pass & QR Modal Preview */}
      {qrModalReg && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setQrModalReg(null)}
        >
          <div
            className="admin-glass-panel rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-center relative border border-black/10 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: 'blur(32px) saturate(200%)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 text-left">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-blue-500 font-bold block">
                  AUTHENTICATION CREDENTIAL
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delegate Entry Pass
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalReg(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate & Track Summary */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {qrModalReg.leader_name}
              </h2>
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {SLUG_LABELS[qrModalReg.competition_slug] || qrModalReg.competition_slug}
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400">
                {qrModalReg.leader_college || 'Priyadarshini College of Engineering'}
              </div>
            </div>

            {/* High-Resolution QR Graphic */}
            <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border border-zinc-200">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Verification Code for ${qrModalReg.leader_name}`}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-zinc-500">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Reference Badge */}
            <div className="p-2.5 rounded-xl admin-glass-card font-mono text-xs text-slate-700 dark:text-zinc-300">
              <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block">Pass Reference</span>
              <span className="font-bold tracking-wider text-slate-900 dark:text-white">
                YUG-26-{qrModalReg.id.substring(0, 8).toUpperCase()}
              </span>
            </div>

            {/* Quick Payment Status Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">Payment Status:</span>
              <div className="flex items-center gap-1.5">
                {(() => {
                  const pStatus = (qrModalReg.payment_status || (qrModalReg.payment_id ? 'pending' : 'free')).toLowerCase();
                  return (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                        PAYMENT_STATUS_STYLES[pStatus] || PAYMENT_STATUS_STYLES.pending
                      }`}
                    >
                      {pStatus === 'free'
                        ? 'Free Track'
                        : pStatus === 'confirmed' || pStatus === 'verified'
                        ? 'Verified'
                        : pStatus === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
                    </span>
                  );
                })()}
                {(qrModalReg.payment_status || (qrModalReg.payment_id ? 'pending' : 'free')).toLowerCase() === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdatePaymentStatus(qrModalReg.id, 'confirmed')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold font-mono transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verify</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">Accreditation:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStatusChange(qrModalReg.id, 'submitted')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                    qrModalReg.submission_status === 'submitted' || qrModalReg.submission_status === 'confirmed'
                      ? 'bg-emerald-600 text-white'
                      : 'admin-glass-panel text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(qrModalReg.id, 'pending')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                    qrModalReg.submission_status === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'admin-glass-panel text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Actions: Print and Open Full Page */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl admin-glass-card text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-500/40 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>

              <Link
                href={`/pass/${qrModalReg.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Full Pass Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Registration Full Record Detail Modal */}
      {selectedReg && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => {
            setSelectedReg(null);
            setDetailData(null);
          }}
        >
          <div
            className="admin-glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: 'blur(32px) saturate(200%)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Candidate Registration Record</span>
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                    ID: {selectedReg.id}
                  </span>
                  {selectedReg.registration_mode === 'TEST' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      INTERNAL TEST DATA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      LIVE OFFICIAL PARTICIPANT
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReg(null);
                  setDetailData(null);
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment & Audit Verification Control Panel */}
            <div className="p-3.5 rounded-2xl admin-glass-card space-y-3 border border-black/5 dark:border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400 block font-semibold">
                    Payment Verification Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const pStatus = (selectedReg.payment_status || (selectedReg.payment_id ? 'pending' : 'free')).toLowerCase();
                      return (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase font-mono border ${
                            PAYMENT_STATUS_STYLES[pStatus] || PAYMENT_STATUS_STYLES.pending
                          }`}
                        >
                          {pStatus === 'free'
                            ? 'Free Registration Track'
                            : pStatus === 'confirmed' || pStatus === 'verified'
                            ? 'Payment Verified'
                            : pStatus === 'rejected'
                            ? 'Payment Rejected'
                            : 'Verification Pending'}
                        </span>
                      );
                    })()}
                  </div>
                  {selectedReg.verified_by && (
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono block mt-1">
                      Verified by <strong className="text-slate-800 dark:text-slate-200">{selectedReg.verified_by}</strong>
                      {selectedReg.verified_at ? ` on ${new Date(selectedReg.verified_at).toLocaleString()}` : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdatePaymentStatus(selectedReg.id, 'confirmed')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePaymentStatus(selectedReg.id, 'rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Accreditation / Submission Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl admin-glass-card">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Candidate Accreditation / Entry Status:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedReg.id, 'submitted')}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    selectedReg.submission_status === 'submitted' || selectedReg.submission_status === 'confirmed'
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-emerald-500'
                  }`}
                >
                  Confirm (Submitted)
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedReg.id, 'pending')}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    selectedReg.submission_status === 'pending'
                      ? 'bg-amber-600 text-white shadow-amber-500/20'
                      : 'admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-amber-500'
                  }`}
                >
                  Pending Review
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <DetailRow label="Candidate Name" value={selectedReg.leader_name} />
              <DetailRow label="Email Address" value={selectedReg.leader_email} />
              <DetailRow label="Contact Phone" value={selectedReg.leader_phone} />
              <DetailRow label="College" value={selectedReg.leader_college} />
              <DetailRow label="Branch" value={selectedReg.leader_branch} />
              <DetailRow label="Semester" value={selectedReg.leader_semester} />
              <DetailRow label="Competition Track" value={SLUG_LABELS[selectedReg.competition_slug] || selectedReg.competition_slug} />
              <DetailRow label="Team / Squad Name" value={selectedReg.team_name || 'Individual Entry'} />
              <DetailRow label="Team Size" value={String(selectedReg.team_size || 1)} />
              <DetailRow label="Payment UTR ID" value={selectedReg.payment_id || '—'} mono />
              {selectedReg.normal_fee !== undefined && selectedReg.normal_fee !== null && (
                <DetailRow label="Normal Registration Fee" value={`₹${selectedReg.normal_fee}`} mono />
              )}
              {selectedReg.discount_amount !== undefined && selectedReg.discount_amount !== null && selectedReg.discount_amount > 0 && (
                <DetailRow
                  label="Department Concession"
                  value={`-₹${selectedReg.discount_amount} (${selectedReg.discount_rule || 'Special Waiver'})`}
                />
              )}
              {selectedReg.final_fee !== undefined && selectedReg.final_fee !== null && (
                <DetailRow label="Final Payable Fee" value={`₹${selectedReg.final_fee}`} mono />
              )}
              <DetailRow label="Date Recorded" value={new Date(selectedReg.created_at).toLocaleString()} />

              {selectedReg.verification_token && (
                <DetailRow label="Pass Verification Token" value={selectedReg.verification_token} mono />
              )}

              {selectedReg.payment_proof_url && (
                <div className="p-3.5 rounded-xl admin-glass-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-zinc-400 font-medium">Payment Proof Screenshot</span>
                    <a
                      href={selectedReg.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      View Full Size <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-h-56 bg-black/5 flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedReg.payment_proof_url}
                      alt="Payment Proof Screenshot"
                      className="max-h-52 object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {storageMode === 'minimal' && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-blue-500" />
                  <span>
                    Storage Mode: <strong>Minimal</strong> (TiDB storage optimized). Full responses archived directly in Google Sheets.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedReg(null);
                  handleOpenQrModal(selectedReg);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl admin-glass-panel text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" /> View QR Credential
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedReg(null);
                  setDetailData(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="p-2 sm:p-2.5 rounded-xl admin-glass-card flex items-center justify-between gap-3">
      <span className="text-slate-500 dark:text-zinc-400 font-mono text-[11px] shrink-0 font-medium">{label}</span>
      <span className={`text-slate-900 dark:text-white font-semibold text-right truncate ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}
