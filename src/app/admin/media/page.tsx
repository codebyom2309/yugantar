'use client';

import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  public_id: string | null;
  storage_provider: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  role: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetFilename, setNewAssetFilename] = useState('');
  const [newAssetRole, setNewAssetRole] = useState('artwork');

  const loadAssets = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (roleFilter) q.set('role', roleFilter);
      const res = await fetch(`/api/admin/media?${q.toString()}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [roleFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', 'artwork');
      formData.append('entityType', 'competition');

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setUploadError(data.error || 'Upload failed');
      } else {
        await loadAssets();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload network error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRegisterUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl || !newAssetFilename) return;

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newAssetUrl,
          filename: newAssetFilename,
          role: newAssetRole,
          storageProvider: 'external',
          mimeType: 'image/webp',
        }),
      });
      if (res.ok) {
        setShowAddUrlModal(false);
        setNewAssetUrl('');
        setNewAssetFilename('');
        await loadAssets();
      }
    } catch (err) {
      console.error('Register URL error:', err);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this media record?')) return;
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            Media Library
            <span className="text-sm font-normal text-slate-500 dark:text-zinc-400 font-mono">({assets.length})</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Central repository for competition artwork, posters, banners, and festival branding assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddUrlModal(true)}
            className="px-3.5 py-2 rounded-xl admin-glass-panel text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-blue-500/40 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>Add Asset Link</span>
          </button>

          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Storage Architecture Notice */}
      <div className="p-3.5 rounded-2xl admin-glass-panel text-xs text-slate-600 dark:text-zinc-400 flex items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span>
            Storage Pipeline: <strong className="text-slate-900 dark:text-white">Filebase S3 / IPFS & Google Drive Direct Embeds</strong>. Synchronized with TiDB.
          </span>
        </div>
        <button
          onClick={loadAssets}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 shrink-0 font-mono text-[11px] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename, role or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAssets()}
            className="admin-glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-glass-input px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="artwork">Competition Artwork</option>
            <option value="banner">Detail Banner</option>
            <option value="poster">Poster / PDF</option>
            <option value="logo">Emblem & Branding</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 admin-glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 admin-glass-panel rounded-2xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-zinc-600 opacity-40" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-300">No media assets found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
            Upload competition posters, cards, or branding assets to populate the library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="admin-glass-panel rounded-2xl overflow-hidden group hover:border-blue-500/40 transition-all shadow-sm flex flex-col"
            >
              {/* Media Preview Box */}
              <div className="relative aspect-video sm:aspect-square bg-black/5 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                {asset.mime_type?.startsWith('image/') || asset.url?.match(/\.(webp|png|jpe?g|svg)$/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 gap-1">
                    <FileText className="w-8 h-8 text-slate-500 dark:text-zinc-500" />
                    <span className="text-[10px] font-mono uppercase">
                      {asset.mime_type?.split('/')[1] || 'DOC'}
                    </span>
                  </div>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    onClick={() => copyUrl(asset.id, asset.url)}
                    title="Copy URL"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition cursor-pointer"
                  >
                    {copiedId === asset.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDelete(asset.id)}
                    title="Remove asset record"
                    className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 border border-rose-400/40 text-white transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Asset Meta Info */}
              <div className="p-3 admin-glass-card flex-1 flex flex-col justify-between border-t border-black/5 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                      {asset.role || 'artwork'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                      {formatSize(asset.size_bytes)}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                  <span>{asset.storage_provider || 'cloud'}</span>
                  <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md admin-glass-panel rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Track Media Asset</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4">
              Register an existing image link (e.g., Filebase IPFS/S3 URL, Google Drive link, or NEXUS CITY visual asset).
            </p>

            <form onSubmit={handleRegisterUrl} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Asset URL</label>
                <input
                  type="text"
                  required
                  placeholder="/images/... or https://..."
                  value={newAssetUrl}
                  onChange={(e) => setNewAssetUrl(e.target.value)}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Filename / Label</label>
                <input
                  type="text"
                  required
                  placeholder="nexus-city-hero.webp"
                  value={newAssetFilename}
                  onChange={(e) => setNewAssetFilename(e.target.value)}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Asset Role</label>
                <select
                  value={newAssetRole}
                  onChange={(e) => setNewAssetRole(e.target.value)}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  <option value="artwork">Competition Artwork (16:9)</option>
                  <option value="banner">Detail Banner</option>
                  <option value="poster">Poster / PDF</option>
                  <option value="logo">Emblem / Logo</option>
                  <option value="map">City District Map</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUrlModal(false)}
                  className="px-4 py-2 rounded-xl admin-glass-panel text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
