'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Upload,
  Link2,
  CheckCircle2,
  Loader2,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  Sparkles,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { formatDriveUrl, isDriveUrl } from '@/lib/drive';

export interface Coordinator {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  display_order: number;
  is_public: number;
  is_active: number;
}

interface CoordinatorManagerProps {
  slug: string;
  coordinators: Coordinator[];
  onRefresh: () => void;
}

export default function CoordinatorManager({
  slug,
  coordinators,
  onRefresh,
}: CoordinatorManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCoord, setEditingCoord] = useState<Coordinator | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: 'Student Coordinator',
    email: '',
    phone: '',
    avatarUrl: '',
    isPublic: true,
  });

  const [activePhotoTab, setActivePhotoTab] = useState<'upload' | 'drive'>('upload');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [driveInput, setDriveInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facultyProfiles, setFacultyProfiles] = useState<Array<{ id: string; name: string; role: string; avatar_url?: string; department?: string; email?: string; phone?: string }>>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  useEffect(() => {
    if (showModal && facultyProfiles.length === 0) {
      setLoadingFaculty(true);
      fetch('/api/admin/organizers/members?category=faculty')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.members)) {
            setFacultyProfiles(data.members);
          }
        })
        .catch((err) => console.error('Failed to load faculty profiles:', err))
        .finally(() => setLoadingFaculty(false));
    }
  }, [showModal, facultyProfiles.length]);

  const openAddModal = () => {
    setEditingCoord(null);
    setFormData({
      id: '',
      name: '',
      role: 'Student Coordinator',
      email: '',
      phone: '',
      avatarUrl: '',
      isPublic: true,
    });
    setDriveInput('');
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (c: Coordinator) => {
    setEditingCoord(c);
    setFormData({
      id: c.id,
      name: c.name,
      role: c.role,
      email: c.email || '',
      phone: c.phone || '',
      avatarUrl: c.avatar_url || '',
      isPublic: Boolean(c.is_public),
    });
    setDriveInput(c.avatar_url || '');
    setErrorMsg(null);
    setShowModal(true);
  };

  // Upload local photo to Filebase S3
  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityId', slug);
      fd.append('role', 'coordinator_avatar');
      fd.append('entityType', 'coordinator');
      fd.append('altText', `${formData.name || 'Coordinator'} profile photo`);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload photo to Filebase');
      }
      setFormData((prev) => ({ ...prev, avatarUrl: data.asset.url }));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDrivePhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveInput.trim()) return;
    const directUrl = formatDriveUrl(driveInput);
    setFormData((prev) => ({ ...prev, avatarUrl: directUrl }));
  };

  const handleSaveCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Coordinator name is required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const method = editingCoord ? 'PUT' : 'POST';
      const payload = {
        id: editingCoord ? editingCoord.id : undefined,
        name: formData.name,
        role: formData.role,
        email: formData.email || null,
        phone: formData.phone || null,
        avatarUrl: formData.avatarUrl || null,
        isPublic: formData.isPublic,
        displayOrder: editingCoord ? editingCoord.display_order : coordinators.length,
      };

      const res = await fetch(`/api/admin/competitions/${slug}/coordinators`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save coordinator');
      }

      setShowModal(false);
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this coordinator from track?')) return;
    try {
      const res = await fetch(`/api/admin/competitions/${slug}/coordinators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="admin-glass-panel rounded-2xl p-6 space-y-6 text-xs">
      {/* Header */}
      <div className="border-b border-black/10 dark:border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Section G — Track Coordinators & Faculty Leads ({coordinators.length})
          </h3>
          <p className="text-[11px] opacity-70 mt-0.5">
            Student coordinators and faculty advisors displayed on public competition pages with direct contact links.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Coordinator</span>
        </button>
      </div>

      {/* Grid of Coordinator Cards + Placeholder Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Render Existing Coordinator Cards */}
        {coordinators.map((c) => (
          <div
            key={c.id}
            className="admin-glass-card rounded-2xl p-4.5 space-y-3.5 flex flex-col justify-between group hover:border-blue-500/40"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {/* Avatar with Photo or Fallback Initials */}
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0 shadow-inner">
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.name}
                      fill
                      className="object-cover"
                      unoptimized={c.avatar_url.startsWith('/api/') || isDriveUrl(c.avatar_url)}
                    />
                  ) : (
                    <span className="font-bold text-sm font-display text-blue-500">
                      {c.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name & Role */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs truncate leading-snug">{c.name}</h4>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase shrink-0 font-bold ${
                        c.is_public
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                      }`}
                    >
                      {c.is_public ? 'Public' : 'Hidden'}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-75 font-medium block truncate mt-0.5">
                    {c.role}
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-1.5 pt-1 text-[11px] font-mono opacity-80">
                {c.phone && (
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3 h-3 text-purple-500 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono opacity-50">#{c.display_order + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="p-1.5 rounded-lg border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete coordinator"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* =========================================================================
            VISUAL PLACEHOLDER CARD: "+ Add Coordinator"
        ========================================================================= */}
        <button
          type="button"
          onClick={openAddModal}
          className="admin-placeholder-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 min-h-[160px] cursor-pointer group shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xs block group-hover:text-blue-500 transition-colors">
              + Add Coordinator
            </span>
            <span className="text-[11px] opacity-60 block mt-0.5">
              Upload local photo or paste Google Drive link
            </span>
          </div>
        </button>
      </div>

      {/* =========================================================================
          COORDINATOR MODAL (ADD / EDIT)
      ========================================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="admin-glass-panel rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm">
                  {editingCoord ? 'Edit Track Coordinator' : 'Add Track Coordinator'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoordinator} className="space-y-4">
              {/* Photo Selector Section */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono font-bold opacity-75">
                  COORDINATOR PHOTO (FILEBASE / GOOGLE DRIVE)
                </label>

                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                    {formData.avatarUrl ? (
                      <Image
                        src={formData.avatarUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized={formData.avatarUrl.startsWith('/api/') || isDriveUrl(formData.avatarUrl)}
                      />
                    ) : (
                      <Users className="w-6 h-6 opacity-40" />
                    )}
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex-1 space-y-2">
                    <div className="flex rounded-lg bg-black/5 dark:bg-white/5 p-0.5 border border-black/5 dark:border-white/5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setActivePhotoTab('upload')}
                        className={`flex-1 py-1 rounded-md font-semibold transition-all ${
                          activePhotoTab === 'upload'
                            ? 'bg-white dark:bg-[#1E232D] text-current shadow-xs'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        Upload Local (Filebase)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhotoTab('drive')}
                        className={`flex-1 py-1 rounded-md font-semibold transition-all ${
                          activePhotoTab === 'drive'
                            ? 'bg-white dark:bg-[#1E232D] text-current shadow-xs'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        Google Drive Link
                      </button>
                    </div>

                    {activePhotoTab === 'upload' ? (
                      <label className="admin-placeholder-card p-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-[11px] hover:border-blue-500">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                          }}
                        />
                        {uploadingPhoto ? (
                          <div className="flex items-center gap-1.5 text-blue-500 font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading to Filebase...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 opacity-80">
                            <Upload className="w-3.5 h-3.5 text-blue-500" />
                            <span>Select photo file</span>
                          </div>
                        )}
                      </label>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://drive.google.com/file/d/..."
                          value={driveInput}
                          onChange={(e) => setDriveInput(e.target.value)}
                          className="admin-glass-input flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleDrivePhotoSubmit}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs whitespace-nowrap cursor-pointer"
                        >
                          Use Link
                        </button>
                      </div>
                    )}

                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, avatarUrl: '' }))}
                        className="text-[10px] text-red-400 hover:underline block"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Select from Existing Faculty Profiles */}
              {facultyProfiles.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Select From Existing Faculty Profiles</span>
                    </label>
                    {loadingFaculty && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                  </div>
                  <select
                    onChange={(e) => {
                      const fac = facultyProfiles.find((f) => f.id === e.target.value);
                      if (fac) {
                        setFormData((p) => ({
                          ...p,
                          name: fac.name,
                          role: 'Faculty Coordinator',
                          avatarUrl: fac.avatar_url || p.avatarUrl,
                        }));
                      }
                    }}
                    defaultValue=""
                    className="admin-glass-input w-full p-2 rounded-lg text-xs"
                  >
                    <option value="" disabled>-- Choose a faculty advisor / HOD --</option>
                    {facultyProfiles.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.department || fac.role || 'Faculty'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Autofills name, role, and avatar from existing faculty records without creating redundant profiles.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[11px] font-mono font-bold opacity-75 mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Om Satange"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[11px] font-mono font-bold opacity-75 mb-1">
                  ROLE / DESIGNATION *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Coordinator or Faculty Advisor"
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  className="admin-glass-input w-full p-2.5 rounded-xl text-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Student Coordinator', 'Co-Coordinator', 'Faculty Coordinator', 'Technical Head'].map(
                    (suggested) => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, role: suggested }))}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 border border-black/5 dark:border-white/5 transition-colors cursor-pointer"
                      >
                        {suggested}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold opacity-75 mb-1">
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="admin-glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold opacity-75 mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    placeholder="coordinator@pce.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="admin-glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Public Visibility Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((p) => ({ ...p, isPublic: e.target.checked }))}
                  className="rounded w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-xs font-medium">
                  Visible publicly on the official competition page
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 opacity-70 hover:opacity-100 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{editingCoord ? 'Update Coordinator' : 'Save Coordinator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
