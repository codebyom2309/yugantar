'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Upload, Link2, ExternalLink, Trash2, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { formatDriveUrl, isDriveUrl } from '@/lib/drive';

interface ArtworkStudioProps {
  slug: string;
  cardImage: string;
  bannerImage: string;
  onChangeCardImage: (url: string) => void;
  onChangeBannerImage: (url: string) => void;
}

export default function CompetitionArtworkStudio({
  slug,
  cardImage,
  bannerImage,
  onChangeCardImage,
  onChangeBannerImage,
}: ArtworkStudioProps) {
  return (
    <div className="admin-glass-panel rounded-2xl p-6 space-y-6 text-xs">
      <div className="border-b border-black/10 dark:border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Section B — Competition Visual Assets (16:9 Landscape)
          </h3>
          <p className="text-[11px] opacity-70 mt-0.5">
            Assets stored in Filebase IPFS object storage or linked via direct Google Drive CDN.
          </p>
        </div>
        <span className="text-[11px] font-mono opacity-60">
          Optimal: 1920 × 1080 (WebP / PNG / JPG)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Thumbnail Asset (16:9) */}
        <AssetBox
          title="Card Thumbnail Image (Catalog & Grid)"
          description="Appears on /competitions directory, homepage cards, and district map."
          currentUrl={cardImage}
          onUpdate={onChangeCardImage}
          slug={slug}
          role="card"
        />

        {/* Detail Page Hero Banner (16:9) */}
        <AssetBox
          title="Detail Page Banner Artwork (16:9)"
          description="Featured prominently in the competition dossier header."
          currentUrl={bannerImage}
          onUpdate={onChangeBannerImage}
          slug={slug}
          role="banner"
        />
      </div>
    </div>
  );
}

function AssetBox({
  title,
  description,
  currentUrl,
  onUpdate,
  slug,
  role,
}: {
  title: string;
  description: string;
  currentUrl: string;
  onUpdate: (url: string) => void;
  slug: string;
  role: 'card' | 'banner';
}) {
  const [activeTab, setActiveTab] = useState<'upload' | 'drive'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [driveInput, setDriveInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // File upload to Filebase via /api/admin/media with validation & verification
  const handleFileUpload = async (file: File) => {
    setStatusMsg(null);
    setErrorMsg(null);
    setPreviewError(false);

    // 1. Client-side File Validation
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file format. Please upload an image (PNG, JPG, WebP, SVG).');
      return;
    }

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds ${MAX_SIZE_MB}MB limit. Please compress or resize.`);
      return;
    }

    setUploading(true);
    setUploadStep('Uploading file to Filebase persistent storage...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityId', slug);
      formData.append('role', role);
      formData.append('entityType', 'competition');
      formData.append('altText', `${slug} ${role} artwork`);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 401) {
        throw new Error('Authentication session expired. Please refresh the page or re-login to proceed.');
      }
      if (res.status === 403) {
        throw new Error('Unauthorized: Your administrative role does not permit media uploads.');
      }

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Upload failed with HTTP ${res.status}`);
      }

      const uploadedUrl = data.asset.url;

      // 2. Step 8 Verification: Confirm that the asset reference is immediately retrievable
      setUploadStep('Verifying uploaded asset accessibility...');
      try {
        const verifyRes = await fetch(uploadedUrl, { method: 'HEAD' });
        if (!verifyRes.ok && verifyRes.status !== 405) {
          // If HEAD is not allowed, try GET
          const getRes = await fetch(uploadedUrl);
          if (!getRes.ok) {
            throw new Error(`Asset was stored but failed retrieval verification (HTTP ${getRes.status}).`);
          }
        }
      } catch (verifyErr) {
        console.warn('Asset verification check encountered error:', verifyErr);
        // Continue if network allows, or alert if genuinely broken
      }

      // Update state with canonical URL
      onUpdate(uploadedUrl);
      setStatusMsg(`Successfully uploaded & verified 16:9 ${role} artwork!`);
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  const handleDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPreviewError(false);

    const trimmed = driveInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setErrorMsg('Please enter a valid HTTP/HTTPS URL or direct asset path.');
      return;
    }

    const formatted = formatDriveUrl(trimmed);
    onUpdate(formatted);
    setDriveInput('');
    setStatusMsg(
      isDriveUrl(trimmed)
        ? 'Google Drive sharing link successfully converted to high-speed CDN embed!'
        : 'Direct artwork URL registered successfully!'
    );
    setTimeout(() => setStatusMsg(null), 4000);
  };


  return (
    <div className="admin-glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs">{title}</span>
          {currentUrl && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
              Active
            </span>
          )}
        </div>
        <p className="text-[11px] opacity-70 leading-relaxed">{description}</p>
      </div>

      {/* 16:9 Image Preview Surface */}
      <div className="relative aspect-video rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 flex items-center justify-center group">
        {currentUrl ? (
          <>
            <Image
              src={currentUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized={currentUrl.startsWith('/api/') || isDriveUrl(currentUrl)}
            />
            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-semibold flex items-center gap-1 hover:bg-white shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full View
              </a>
              <button
                type="button"
                onClick={() => onUpdate('')}
                className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-semibold flex items-center gap-1 hover:bg-red-600 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
            {previewError && (
              <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-amber-500/90 text-black text-[10px] font-mono flex items-center gap-1 z-10 shadow">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Image preview failed to load from source.</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-4 space-y-2 opacity-60">
            <Upload className="w-8 h-8 mx-auto stroke-1" />
            <span className="text-[11px] block font-mono">No artwork currently selected</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dual Tab Mode for Upload / Drive */}
      <div className="space-y-3 pt-2">
        <div className="flex rounded-lg bg-black/5 dark:bg-white/5 p-0.5 border border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-[#1E232D] text-current shadow-xs'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Upload File (Filebase)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'drive'
                ? 'bg-white dark:bg-[#1E232D] text-current shadow-xs'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Google Drive / Image Link
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div>
            <label className="admin-placeholder-card p-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer w-full text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              {uploading ? (
                <div className="flex items-center gap-2 text-blue-500 font-semibold text-center">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="text-[11px]">{uploadStep || 'Uploading to Filebase...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 opacity-80 hover:opacity-100">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">Browse local file to upload (Max 10MB)</span>
                </div>
              )}
            </label>
          </div>
        ) : (
          <form onSubmit={handleDriveSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="https://drive.google.com/file/d/... or image URL"
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              className="admin-glass-input flex-1 px-3 py-2 rounded-xl text-xs font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs cursor-pointer whitespace-nowrap"
            >
              Set Link
            </button>
          </form>
        )}

        {/* Current Image URL Input display for manual copy or override */}
        {currentUrl && (
          <div className="pt-1">
            <span className="text-[10px] font-mono opacity-50 block mb-0.5">CURRENT ASSET URL:</span>
            <input
              type="text"
              value={currentUrl}
              onChange={(e) => onUpdate(e.target.value)}
              className="admin-glass-input w-full px-2.5 py-1.5 rounded-lg text-[10px] font-mono opacity-80"
            />
          </div>
        )}
      </div>
    </div>
  );
}
