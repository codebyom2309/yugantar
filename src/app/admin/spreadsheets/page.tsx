'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Info,
  Clock,
  Database,
  Eye,
  X,
  Loader2,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { COMPETITIONS } from '@/data/events';

interface SpreadsheetLink {
  id: string;
  display_name: string;
  competition_slug: string | null;
  spreadsheet_url: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function SpreadsheetManagerPage() {
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpreadsheetLink | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    competitionSlug: '',
    spreadsheetUrl: '',
    description: '',
    category: 'Main Responses',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load spreadsheets
  const fetchSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/spreadsheets');
      if (!res.ok) throw new Error('Failed to load spreadsheets.');
      const data = await res.json();
      setSpreadsheets(data.spreadsheets || []);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch spreadsheet links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheets();
  }, []);

  // Filtered List
  const filtered = useMemo(() => {
    return spreadsheets.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.spreadsheet_url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesComp =
        selectedCompetition === 'all' ||
        (selectedCompetition === 'unassigned' && !s.competition_slug) ||
        s.competition_slug === selectedCompetition;

      return matchesSearch && matchesComp;
    });
  }, [spreadsheets, searchQuery, selectedCompetition]);

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      displayName: '',
      competitionSlug: '',
      spreadsheetUrl: '',
      description: '',
      category: 'Main Responses',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SpreadsheetLink) => {
    setEditingItem(item);
    setFormData({
      displayName: item.display_name,
      competitionSlug: item.competition_slug || '',
      spreadsheetUrl: item.spreadsheet_url,
      description: item.description || '',
      category: item.category || 'Main Responses',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.displayName.trim()) {
      setFormError('Display name is required.');
      return;
    }
    if (!formData.spreadsheetUrl.trim()) {
      setFormError('Spreadsheet URL is required.');
      return;
    }
    try {
      const parsed = new URL(formData.spreadsheetUrl.trim());
      if (parsed.protocol !== 'https:') {
        setFormError('URL must use secure HTTPS protocol.');
        return;
      }
    } catch {
      setFormError('Please enter a valid HTTPS URL.');
      return;
    }

    setFormSubmitting(true);
    try {
      const url = '/api/admin/spreadsheets';
      const method = editingItem ? 'PUT' : 'POST';
      const payload = {
        id: editingItem?.id,
        displayName: formData.displayName.trim(),
        competitionSlug: formData.competitionSlug || null,
        spreadsheetUrl: formData.spreadsheetUrl.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || 'Main Responses',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save spreadsheet link');
      }

      setIsModalOpen(false);
      fetchSpreadsheets();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this spreadsheet link from the admin directory? (The original Google Sheet will remain untouched)')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/spreadsheets?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      fetchSpreadsheets();
    } catch (err: any) {
      alert(`Error deleting link: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getCompBadge = (slug: string | null) => {
    if (!slug) {
      return {
        name: 'General / Festival Wide',
        color: '#60728A',
        bg: '#F1F5F9',
      };
    }
    const comp = COMPETITIONS.find((c) => c.slug === slug);
    if (!comp) {
      return {
        name: slug.replace(/-/g, ' ').toUpperCase(),
        color: '#4B91E8',
        bg: '#EDF5FC',
      };
    }
    return {
      name: comp.name,
      color: comp.accentColor,
      bg: comp.accentBg,
    };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* =====================================================================
          HEADER & METRICS
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Registration Spreadsheets
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
            Centralized directory of official response spreadsheets. Links open directly in Google Sheets in a new tab.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSpreadsheets}
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-300 transition-colors"
            title="Refresh link directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#172B49] hover:bg-[#253D66] text-white text-xs font-mono font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#F5A16F]" />
            <span>Add Spreadsheet URL</span>
          </button>
        </div>
      </div>

      {/* Strict Links-Only Security Banner */}
      <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-sky-900 dark:text-sky-200">
          <p className="font-bold">
            Zero-Scraping Guarantee &amp; Content Isolation
          </p>
          <p className="text-sky-700 dark:text-sky-300 leading-relaxed">
            This module stores, organizes, and opens destination URLs only. It does not parse cells, import respondents, or replicate private spreadsheet contents into TiDB. Native Google account permissions govern sheet access.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
            Saved Spreadsheets
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {spreadsheets.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500">
            Across active technical &amp; cultural arenas
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
            Covered Arenas
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {new Set(spreadsheets.map((s) => s.competition_slug).filter(Boolean)).size} / {COMPETITIONS.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500">
            Mapped competition tracks
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xs space-y-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
            Data Architecture Mode
          </span>
          <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <Database className="w-4 h-4" />
            <span>Links-Only Directory</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500">
            TiDB storage minimized • Clean audit logs
          </p>
        </div>
      </div>

      {/* =====================================================================
          FILTER & SEARCH TOOLBAR
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, URL, or notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Competition Arenas ({spreadsheets.length})</option>
            {COMPETITIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
            <option value="unassigned">General / Unassigned</option>
          </select>
        </div>
      </div>

      {/* =====================================================================
          SPREADSHEET LIST / TABLE
          ===================================================================== */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
            Loading spreadsheet links directory...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl">
          <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Spreadsheet Links Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
            {searchQuery || selectedCompetition !== 'all'
              ? 'No links match your current search or filter criteria. Try adjusting your filters.'
              : 'No external spreadsheet links have been added yet. Click "Add Spreadsheet URL" to get started.'}
          </p>
          {(searchQuery || selectedCompetition !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCompetition('all');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 underline pt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const badge = getCompBadge(item.competition_slug);
            const isGoogleSheet = item.spreadsheet_url.includes('docs.google.com');

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Badges & Category */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      style={{
                        color: badge.color,
                        borderColor: `${badge.color}40`,
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border bg-black/5 dark:bg-white/5 truncate max-w-[220px]"
                    >
                      {badge.name}
                    </span>

                    <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 shrink-0">
                      {item.category}
                    </span>
                  </div>

                  {/* Title & Notes */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.display_name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Safe URL Display */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Target Destination
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                        {item.spreadsheet_url}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item.id, item.spreadsheet_url)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                        title="Copy spreadsheet link"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                      title="Edit metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={item.spreadsheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold transition shadow-xs shrink-0"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          ADD / EDIT MODAL
          ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Spreadsheet Link' : 'Add Spreadsheet Link'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Spreadsheet Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Coding Arena — Master Registrations"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Associated Competition */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Associated Competition Arena
                </label>
                <select
                  value={formData.competitionSlug}
                  onChange={(e) => setFormData({ ...formData, competitionSlug: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">None / General Festival Wide</option>
                  {COMPETITIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.district})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Associating a competition allows this spreadsheet URL to appear directly inside that arena&apos;s admin editor.
                </p>
              </div>

              {/* Spreadsheet URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Full Spreadsheet URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.spreadsheetUrl}
                  onChange={(e) => setFormData({ ...formData, spreadsheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Must be a secure HTTPS link. Google Sheets, Excel 365, or Airtable URLs accepted.
                </p>
              </div>

              {/* Category / Label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Category / Role
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Main Responses, Attendance Desk, Final Jury Marks"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Description / Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Internal Notes &amp; Access Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Shared with ETC faculty coordinators and student forum heads."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              {/* Strict Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300">
                ⚠️ Saving this link stores its URL destination only. The system will NOT read, import, or synchronize sheet records into the database.
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold transition disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Save Spreadsheet Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
