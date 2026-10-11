'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Search,
  Eye,
  Edit3,
  Users,
  ClipboardList,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  X,
  Save,
  Loader2,
} from 'lucide-react';

interface CompetitionRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  district: string;
  venue: string;
  eligibility: string;
  team_size_limit: string;
  is_published: number;
  registration_open: number;
  display_order: number;
  registration_count: number;
  coordinator_count: number;
  card_image: string | null;
}

export default function CompetitionsCataloguePage() {
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New competition form state
  const [newComp, setNewComp] = useState({
    name: '',
    slug: '',
    category: 'Hardware & Circuits',
    district: 'Innovation District',
    venue: 'ETC Department, PCE Campus',
    eligibility: 'All Semesters',
    teamSizeLimit: 'Max 4 Members',
    maxTeamMembers: '4',
    shortDescription: '',
  });

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/competitions');
      const data = await res.json();
      setCompetitions(data.competitions || []);
    } catch (err) {
      console.error('Failed to load competitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleTogglePublish = async (slug: string, currentStatus: number) => {
    try {
      await fetch(`/api/admin/competitions/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: currentStatus === 1 ? 0 : 1 }),
      });
      fetchCompetitions();
    } catch (err) {
      console.error('Toggle publish failed:', err);
    }
  };

  const handleToggleRegistration = async (slug: string, currentStatus: number) => {
    try {
      await fetch(`/api/admin/competitions/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationOpen: currentStatus === 1 ? 0 : 1 }),
      });
      fetchCompetitions();
    } catch (err) {
      console.error('Toggle registration failed:', err);
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComp),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create competition');
      }

      setShowCreateModal(false);
      setNewComp({
        name: '',
        slug: '',
        category: 'Hardware & Circuits',
        district: 'Innovation District',
        venue: 'ETC Department, PCE Campus',
        eligibility: 'All Semesters',
        teamSizeLimit: 'Max 4 Members',
        maxTeamMembers: '4',
        shortDescription: '',
      });
      fetchCompetitions();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  // Filtered list
  const filtered = competitions.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'published' && c.is_published === 1) ||
      (statusFilter === 'draft' && c.is_published === 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(competitions.map((c) => c.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-blue-500" />
            Competition Management
            <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
              {competitions.length} active
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
            Database-backed competition catalog & workspace • Updates propagate directly to public website
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Competition
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 sm:p-4 rounded-2xl admin-glass-panel flex flex-col md:flex-row gap-2.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracks by name, slug, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
          />
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2 shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-glass-input w-full md:w-auto px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-glass-input w-full md:w-auto px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft / Unpublished</option>
          </select>
        </div>
      </div>

      {/* Mobile Card Roster View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl admin-glass-panel animate-pulse space-y-3">
              <div className="h-5 bg-black/10 dark:bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-8 rounded-2xl admin-glass-panel text-center text-xs text-slate-500 dark:text-zinc-400">
            No competition tracks match your filter criteria.
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.slug} className="p-4 rounded-2xl admin-glass-panel space-y-3 border border-black/5 dark:border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/admin/competitions/${c.slug}`}
                    className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-500 transition-colors block"
                  >
                    {c.name}
                  </Link>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                    /{c.slug} • {c.category}
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePublish(c.slug, c.is_published)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono border transition-colors cursor-pointer shrink-0 ${
                    c.is_published === 1
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-neutral-400 border-black/10 dark:border-white/10'
                  }`}
                >
                  {c.is_published === 1 ? 'Live' : 'Draft'}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-mono pt-1 border-t border-black/5 dark:border-white/5">
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3 text-blue-500" />
                  {c.registration_count || 0} Registrations
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-500" />
                  {c.coordinator_count || 0} Coordinators
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                <Link
                  href={`/competitions/${c.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl admin-glass-panel text-xs text-slate-700 dark:text-zinc-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3 text-blue-500" />
                  <span>Preview</span>
                </Link>
                <Link
                  href={`/admin/competitions/${c.slug}`}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Track</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Catalogue Table */}
      <div className="hidden md:block admin-glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-zinc-400 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-left font-mono">
                <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider">#</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Competition Track</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Category & District</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Venue</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Team Size</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Stats</th>
                <th className="py-3 px-3 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-3 px-3">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                    No competition tracks match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.slug} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-3">
                      <div>
                        <Link
                          href={`/admin/competitions/${c.slug}`}
                          className="font-medium text-slate-900 dark:text-white hover:underline flex items-center gap-1.5"
                        >
                          {c.name}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block">
                          /{c.slug}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-900 dark:text-white font-medium">{c.category || 'General'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {c.district || 'Unassigned'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400 max-w-[160px] truncate">
                      {c.venue || 'TBA'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400 font-mono">
                      {c.team_size_limit || 'Individual'}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-slate-900 dark:text-white flex items-center gap-1" title="Confirmed Registrations">
                          <ClipboardList className="w-3 h-3 text-blue-500" />
                          {c.registration_count || 0}
                        </span>
                        <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1" title="Active Coordinators">
                          <Users className="w-3 h-3 text-slate-400" />
                          {c.coordinator_count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => handleTogglePublish(c.slug, c.is_published)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono border transition-colors cursor-pointer ${
                            c.is_published === 1
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-neutral-400 border-black/10 dark:border-white/10 hover:bg-black/10'
                          }`}
                          title="Click to toggle publication"
                        >
                          {c.is_published === 1 ? 'Published' : 'Draft'}
                        </button>
                        <button
                          onClick={() => handleToggleRegistration(c.slug, c.registration_open)}
                          className={`text-[9px] font-mono font-medium ${
                            c.registration_open === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}
                          title="Registration status"
                        >
                          {c.registration_open === 1 ? '• Reg Open' : '• Reg Closed'}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/competitions/${c.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition-colors"
                          title="Preview Public Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/competitions/${c.slug}`}
                          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium shadow-xs"
                          title="Open Full Workspace Editor"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Competition Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="admin-glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create New Competition Track
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCompetition} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">Official Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Autonomous Robotics Challenge"
                  value={newComp.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewComp((p) => ({ ...p, name, slug: p.slug ? p.slug : autoSlug }));
                  }}
                  className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., autonomous-robotics"
                  value={newComp.slug}
                  onChange={(e) => setNewComp((p) => ({ ...p, slug: e.target.value }))}
                  className="admin-glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={newComp.category}
                    onChange={(e) => setNewComp((p) => ({ ...p, category: e.target.value }))}
                    className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={newComp.district}
                    onChange={(e) => setNewComp((p) => ({ ...p, district: e.target.value }))}
                    className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">Eligibility</label>
                  <input
                    type="text"
                    value={newComp.eligibility}
                    onChange={(e) => setNewComp((p) => ({ ...p, eligibility: e.target.value }))}
                    className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">Max Team Members</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newComp.maxTeamMembers}
                    onChange={(e) => setNewComp((p) => ({ ...p, maxTeamMembers: e.target.value, teamSizeLimit: `Max ${e.target.value} Members` }))}
                    className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">Venue Overwrite</label>
                <input
                  type="text"
                  value={newComp.venue}
                  onChange={(e) => setNewComp((p) => ({ ...p, venue: e.target.value }))}
                  className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-semibold mb-1">Short Card Description</label>
                <textarea
                  rows={2}
                  value={newComp.shortDescription}
                  onChange={(e) => setNewComp((p) => ({ ...p, shortDescription: e.target.value }))}
                  placeholder="One sentence description for catalog cards..."
                  className="admin-glass-input w-full p-2.5 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl admin-glass-panel text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Create Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
