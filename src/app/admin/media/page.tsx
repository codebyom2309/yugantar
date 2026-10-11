'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, ExternalLink, Copy, Check } from 'lucide-react';

interface MediaAsset {
  id: string; filename: string; url: string; public_id: string; cloudinary_account: string;
  mime_type: string; size_bytes: number; alt_text: string; role: string;
  entity_type: string; entity_id: string; created_at: string;
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/media')
      .then((r) => r.json())
      .then((d) => { setAssets(d.assets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('competitionSlug', 'general');

    const r = await fetch('/api/upload', { method: 'POST', body: formData });
    const d = await r.json();

    if (d.success) {
      // Save to media_assets via admin API
      await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          url: d.url,
          publicId: d.publicId,
          cloudinaryAccount: d.account,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      // Refresh
      const r2 = await fetch('/api/admin/media');
      const d2 = await r2.json();
      setAssets(d2.assets || []);
    }
    setUploading(false);
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media asset?')) return;
    await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setAssets(assets.filter((a) => a.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-400" />
          Media Library
          <span className="text-sm font-normal text-slate-400">({assets.length})</span>
        </h1>
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" accept="image/*,application/pdf" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      <p className="text-xs text-slate-400 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
        Files are uploaded to your <strong className="text-slate-300">Cloudinary</strong> accounts and tracked here. Max 8 MB. Supported: JPEG, PNG, WebP, PDF.
      </p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No media assets yet. Upload files to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden group">
              <div className="relative aspect-square bg-slate-900/50">
                {asset.mime_type?.startsWith('image/') ? (
                  <img src={asset.url} alt={asset.alt_text || asset.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-slate-600">📄</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(asset.id, asset.url)} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                    {copiedId === asset.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(asset.id)} className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-200 font-medium truncate">{asset.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500">{formatSize(asset.size_bytes || 0)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Acct {asset.cloudinary_account || '?'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
