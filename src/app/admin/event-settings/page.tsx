'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Check,
  Loader2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Upload,
  ExternalLink,
  Globe,
  AlertTriangle,
  Database,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  Info,
  MessageCircle,
  AlertCircle,
  Percent,
  Award,
  Ticket,
  FileCheck,
  Radio,
  X,
} from 'lucide-react';
import AdminDatePicker from '@/components/admin/AdminDatePicker';
import { COLLEGE_OPTIONS, BRANCH_OPTIONS } from '@/data/registrationForms';

interface Setting {
  setting_key: string;
  setting_value: string;
  setting_group: string;
  label: string;
  field_type: string;
  updated_at: string;
}

export default function EventSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'identity' | 'venue' | 'assets' | 'registration' | 'discounts' | 'footer'>('identity');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [showCloseWarningModal, setShowCloseWarningModal] = useState(false);
  const [showPassCertDisableModal, setShowPassCertDisableModal] = useState(false);
  const [showLiveModeModal, setShowLiveModeModal] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || []);
        const vals: Record<string, string> = {};
        (d.settings || []).forEach((s: Setting) => {
          vals[s.setting_key] = s.setting_value;
        });
        setEditedValues(vals);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const changedSettings: { key: string; value: string }[] = [];
    Object.keys(editedValues).forEach((key) => {
      const orig = settings.find((s) => s.setting_key === key)?.setting_value;
      if (editedValues[key] !== orig) {
        changedSettings.push({ key, value: editedValues[key] });
      }
    });

    if (changedSettings.length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);

        // Refresh settings
        const r = await fetch('/api/admin/settings');
        const d = await r.json();
        setSettings(d.settings || []);
      }
    } catch (err) {
      console.error('Settings save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAssetUpload = async (key: string, file: File) => {
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', 'branding');
      formData.append('entityType', 'settings');

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.asset?.url) {
        setEditedValues((prev) => ({ ...prev, [key]: data.asset.url }));
      }
    } catch (err) {
      console.error('Asset upload error:', err);
    } finally {
      setUploadingKey(null);
    }
  };

  const hasUnsavedChanges = Object.keys(editedValues).some(
    (key) => editedValues[key] !== settings.find((s) => s.setting_key === key)?.setting_value
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-60 admin-glass-panel rounded-xl animate-pulse" />
        <div className="h-96 admin-glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            Festival Settings & Identity
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Global festival metadata, dates, venue coordinates, and NEXUS CITY visual assets.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-md cursor-pointer ${
            saved
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : hasUnsavedChanges
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              : 'border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-zinc-400 cursor-not-allowed font-semibold'
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saved ? 'Settings Saved & Synced!' : hasUnsavedChanges ? 'Publish Changes' : 'Saved'}</span>
        </button>
      </div>

      {/* Tabs - Horizontally scrollable on mobile */}
      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2 overflow-x-auto no-scrollbar scrollbar-none w-full">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'identity'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Identity & Dates</span>
        </button>

        <button
          onClick={() => setActiveTab('venue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'venue'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Venue & Campus</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'assets'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Visuals & Hero</span>
        </button>

        <button
          onClick={() => setActiveTab('registration')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'registration'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Registration Gateway</span>
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'discounts'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Department Discount Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('footer')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
            activeTab === 'footer'
              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/40'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Footer & Social Links</span>
        </button>
      </div>

      {/* Tab 1: Identity & Dates */}
      {activeTab === 'identity' && (
        <div className="admin-glass-panel rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Official Event Name</label>
              <input
                type="text"
                value={editedValues['event_name'] ?? ''}
                onChange={(e) => setEditedValues({ ...editedValues, event_name: e.target.value })}
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Edition / Year</label>
              <input
                type="text"
                value={editedValues['event_edition'] ?? ''}
                onChange={(e) => setEditedValues({ ...editedValues, event_edition: e.target.value })}
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Event Concept / World</label>
              <input
                type="text"
                value={editedValues['event_concept'] ?? ''}
                onChange={(e) => setEditedValues({ ...editedValues, event_concept: e.target.value })}
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <AdminDatePicker
                label="Official Festival Date *"
                value={editedValues['event_date'] ?? ''}
                onChange={(displayDate, isoDate) => {
                  setEditedValues((prev) => ({
                    ...prev,
                    event_date: displayDate,
                    ...(isoDate ? { event_iso_date: isoDate } : {}),
                  }));
                }}
                placeholder="Choose festival date..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Official Tagline</label>
            <input
              type="text"
              value={editedValues['event_tagline'] ?? ''}
              onChange={(e) => setEditedValues({ ...editedValues, event_tagline: e.target.value })}
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Hero Subheading & Description</label>
            <textarea
              rows={3}
              value={editedValues['event_subheading'] ?? ''}
              onChange={(e) => setEditedValues({ ...editedValues, event_subheading: e.target.value })}
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-black/5 dark:border-white/10">
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Host College</label>
              <input
                type="text"
                value={editedValues['event_college'] ?? ''}
                onChange={(e) => setEditedValues({ ...editedValues, event_college: e.target.value })}
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Organizing Department</label>
              <input
                type="text"
                value={editedValues['event_department'] ?? ''}
                onChange={(e) => setEditedValues({ ...editedValues, event_department: e.target.value })}
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Venue & Campus */}
      {activeTab === 'venue' && (
        <div className="admin-glass-panel rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Primary Venue / Campus</label>
            <input
              type="text"
              value={editedValues['event_venue'] ?? ''}
              onChange={(e) => setEditedValues({ ...editedValues, event_venue: e.target.value })}
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Short Location Tag</label>
            <input
              type="text"
              value={editedValues['event_location_short'] ?? ''}
              onChange={(e) => setEditedValues({ ...editedValues, event_location_short: e.target.value })}
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Full Postal Address & Navigation Instructions</label>
            <textarea
              rows={3}
              value={editedValues['event_address'] ?? ''}
              onChange={(e) => setEditedValues({ ...editedValues, event_address: e.target.value })}
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs resize-none"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Visuals & Hero */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {[
            { key: 'hero_artwork', title: 'Desktop Hero Artwork', desc: 'Main futuristic skyline art for large screens (1920x1080 recommended)' },
            { key: 'hero_artwork_mobile', title: 'Mobile Hero Artwork', desc: 'Optimized vertical illustration for smartphones' },
            { key: 'districts_map', title: 'Districts Map Artwork', desc: 'Isometric map of NEXUS CITY districts' },
            { key: 'logo_emblem', title: 'Official Logo Emblem', desc: 'Isolated emblem badge used in headers and passes' },
          ].map((item) => {
            const currentVal = editedValues[item.key] ?? '';
            return (
              <div key={item.key} className="admin-glass-panel rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start shadow-sm">
                {/* Image preview box */}
                <div className="w-full sm:w-48 h-32 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative group">
                  {currentVal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentVal} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">No Image</span>
                  )}
                  {currentVal && (
                    <a
                      href={currentVal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{item.title}</h3>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">{item.desc}</p>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => setEditedValues({ ...editedValues, [item.key]: e.target.value })}
                      placeholder="/images/... or https://..."
                      className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl admin-glass-panel text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-blue-500/40 transition cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>{uploadingKey === item.key ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingKey === item.key}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAssetUpload(item.key, f);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Global Registration Gateway & Data Storage Control */}
      {activeTab === 'registration' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Registration Environment & Campaign Control Card */}
          <div className="admin-glass-panel rounded-2xl p-6 space-y-5 shadow-sm border border-black/10 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Registration Environment &amp; Campaign Control
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Controls whether incoming registrations are classified as internal test submissions or official live participant records.
                </p>
              </div>

              {/* Current Mode Badge + Toggle */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block uppercase font-semibold">Active Mode</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                    (editedValues['registration_environment_mode'] || 'TESTING') === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      (editedValues['registration_environment_mode'] || 'TESTING') === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                    }`} />
                    {editedValues['registration_environment_mode'] || 'TESTING'}
                  </span>
                </div>

                {(editedValues['registration_environment_mode'] || 'TESTING') === 'TESTING' ? (
                  <button
                    type="button"
                    onClick={() => setShowLiveModeModal(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
                  >
                    Switch to LIVE
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedValues({
                        ...editedValues,
                        registration_environment_mode: 'TESTING',
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm cursor-pointer"
                  >
                    Switch to TESTING
                  </button>
                )}
              </div>
            </div>

            {/* Status Explanation Banner */}
            {(editedValues['registration_environment_mode'] || 'TESTING') === 'TESTING' ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wide font-mono block">Testing Mode Active</span>
                  <p className="text-[12px] leading-relaxed">
                    Testing mode is active. Registrations submitted in this mode are marked as test data (<code>registration_mode = &apos;TEST&apos;</code>) and are excluded from live participant reporting, payment reconciliation, and official attendance stats.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wide font-mono block">Live Registration Active</span>
                  <p className="text-[12px] leading-relaxed">
                    Live registration is active. New registrations are official participant submissions. All historical test submissions remain safely preserved as test data and will not appear in official participant counts.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Pass & Certificate Generation Master Control Card */}
          <div className="admin-glass-panel rounded-2xl p-6 space-y-5 shadow-sm border border-black/10 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Pass &amp; Certificate Generation Master Control
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Festival-wide master switch. When OFF, all new pass and certificate generation, downloads, and PDF rendering are blocked across the entire event.
                </p>
              </div>

              {/* Master Switch Button */}
              <button
                type="button"
                onClick={() => {
                  if ((editedValues['pass_certificate_generation_global_open'] ?? '1') === '1') {
                    setShowPassCertDisableModal(true);
                  } else {
                    setEditedValues({
                      ...editedValues,
                      pass_certificate_generation_global_open: '1',
                      pass_generation_global_open: '1',
                      certificate_generation_global_open: '1',
                    });
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-sm shrink-0 ${
                  (editedValues['pass_certificate_generation_global_open'] ?? '1') === '1'
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-rose-600 text-white shadow-rose-500/20'
                }`}
              >
                {(editedValues['pass_certificate_generation_global_open'] ?? '1') === '1'
                  ? '● GENERATION ACTIVE (ON)'
                  : '○ GENERATION DISABLED (OFF)'}
              </button>
            </div>

            {/* Current Policy Status Notice */}
            {(editedValues['pass_certificate_generation_global_open'] ?? '1') !== '1' ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wide font-mono block">Pass &amp; Certificate Generation Disabled</span>
                  <p className="text-[12px] leading-relaxed">
                    Pass and certificate generation is currently disabled by the event administrator. Public PDF downloads and new digital pass generation are blocked with HTTP 403. Existing records, payment screenshots, and campus gate QR verification (<code>/verify/[token]</code>) remain completely functional and intact.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-300 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block font-mono">Master &amp; Competition-Level Policy</span>
                  <p>
                    • <strong>Global Switch is Master</strong>: Generation is permitted ONLY when this global master switch AND the specific competition-level switch (<code>pass_enabled</code> / <code>certificate_enabled</code>) are ON.
                  </p>
                  <p>
                    • <strong>Individual Track Control</strong>: You can still disable passes or certificates for specific competitions in Competition Management without disabling festival-wide generation.
                  </p>
                </div>
              </div>
            )}

            {/* Granular Sub-Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Passes Sub-Switch */}
              <div className="p-3.5 rounded-xl admin-glass-card border border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">Pass Generation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">PDF &amp; digital passes for attendees</p>
                </div>
                <button
                  type="button"
                  disabled={(editedValues['pass_certificate_generation_global_open'] ?? '1') !== '1'}
                  onClick={() => {
                    setEditedValues({
                      ...editedValues,
                      pass_generation_global_open: (editedValues['pass_generation_global_open'] ?? '1') === '1' ? '0' : '1',
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer shrink-0 ${
                    (editedValues['pass_certificate_generation_global_open'] ?? '1') !== '1'
                      ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-neutral-800 text-slate-500'
                      : (editedValues['pass_generation_global_open'] ?? '1') === '1'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {(editedValues['pass_generation_global_open'] ?? '1') === '1' ? 'PASSES: ON' : 'PASSES: OFF'}
                </button>
              </div>

              {/* Certificates Sub-Switch */}
              <div className="p-3.5 rounded-xl admin-glass-card border border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">Certificate Generation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">PDF certificates of participation/merit</p>
                </div>
                <button
                  type="button"
                  disabled={(editedValues['pass_certificate_generation_global_open'] ?? '1') !== '1'}
                  onClick={() => {
                    setEditedValues({
                      ...editedValues,
                      certificate_generation_global_open: (editedValues['certificate_generation_global_open'] ?? '1') === '1' ? '0' : '1',
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer shrink-0 ${
                    (editedValues['pass_certificate_generation_global_open'] ?? '1') !== '1'
                      ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-neutral-800 text-slate-500'
                      : (editedValues['certificate_generation_global_open'] ?? '1') === '1'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {(editedValues['certificate_generation_global_open'] ?? '1') === '1' ? 'CERTIFICATES: ON' : 'CERTIFICATES: OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Global Registration Gateway Card */}
          <div className="admin-glass-panel rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl admin-glass-card border border-black/10 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Global Registration Master Switch
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Authoritative festival-wide gateway. When disabled, all new registrations are rejected by the server across every competition.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (editedValues['registration_global_open'] === '1') {
                    setShowCloseWarningModal(true);
                  } else {
                    setEditedValues({
                      ...editedValues,
                      registration_global_open: '1',
                    });
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-sm shrink-0 ${
                  editedValues['registration_global_open'] === '1'
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-rose-600 text-white shadow-rose-500/20'
                }`}
              >
                {editedValues['registration_global_open'] === '1' ? '● GATEWAY ACTIVE (OPEN)' : '○ GATEWAY CLOSED'}
              </button>
            </div>

            {/* Interaction Clarity Notice */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <span className="font-bold block uppercase tracking-wider">Gateway Precedence &amp; Overrides</span>
                <p>
                  • When Global Gateway is <strong>Active (Open)</strong>: individual competitions can still be closed independently via their respective editor without affecting other tracks.
                </p>
                <p>
                  • When Global Gateway is <strong>Closed</strong>: all registrations across the entire festival are immediately blocked and rejected on the server, regardless of individual track status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                  Public Closure Announcement Message
                </label>
                <input
                  type="text"
                  value={editedValues['registration_status_message'] ?? ''}
                  onChange={(e) =>
                    setEditedValues({ ...editedValues, registration_status_message: e.target.value })
                  }
                  placeholder="e.g. Official registrations are currently closed by festival administration."
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <AdminDatePicker
                  label="Registration Closure Deadline Date & Time"
                  value={editedValues['registration_deadline'] ?? ''}
                  onChange={(displayDate) =>
                    setEditedValues({ ...editedValues, registration_deadline: displayDate })
                  }
                  includeTime={true}
                  placeholder="Set registration closure deadline..."
                />
              </div>
            </div>
          </div>

          {/* B & C. Database Storage & Retention Control Panel */}
          <div className="admin-glass-panel rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Database Storage &amp; Data-Retention Control Panel
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                TiDB Storage Governance
              </span>
            </div>

            {/* Recommended Configuration Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs font-mono uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Recommended Architectural Configuration</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                <strong>Full Responses in TiDB: OFF</strong> · <strong>Minimal Operational Metadata: ON</strong> · <strong>Spreadsheet Submission: ON</strong>.
                This prevents unnecessary database duplication, ensures maximum participant privacy, and lets Google Sheets handle the official response logs while retaining essential verification tokens.
              </p>
            </div>

            {/* 3 Explicit Storage Toggles */}
            <div className="space-y-4 pt-1">
              {/* Setting 1: Full Responses in TiDB */}
              <div className="p-4 rounded-xl admin-glass-card border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      1. Save Full Form Responses to TiDB
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      editedValues['save_full_responses'] === '1'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {editedValues['save_full_responses'] === '1' ? 'ACTIVE (Storing Full JSON)' : 'DISABLED (Recommended)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                    <strong>Consequence:</strong> When enabled, duplicates the entire form answer JSON payload into the <code>registrations.form_data</code> column in TiDB. When disabled, full answers are omitted from the database to keep TiDB storage clean and preserve privacy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditedValues({
                      ...editedValues,
                      save_full_responses: editedValues['save_full_responses'] === '1' ? '0' : '1',
                      registration_storage_mode: editedValues['save_full_responses'] === '1' ? 'minimal' : 'full',
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                    editedValues['save_full_responses'] === '1'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {editedValues['save_full_responses'] === '1' ? 'FULL STORAGE: ON' : 'FULL STORAGE: OFF'}
                </button>
              </div>

              {/* Setting 2: Minimal Operational Metadata */}
              <div className="p-4 rounded-xl admin-glass-card border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      2. Save Minimal Operational Metadata to TiDB
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">
                      Essential Core
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                    <strong>Consequence:</strong> Retains only required operational columns (Registration ID, competition slug, team leader name, contact email, payment UTR, payment verification status, and cryptographic verification token). Required for live pass lookup, campus gate QR verification, and duplicate prevention.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditedValues({
                      ...editedValues,
                      save_minimal_metadata: editedValues['save_minimal_metadata'] === '0' ? '1' : '0',
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                    editedValues['save_minimal_metadata'] !== '0'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {editedValues['save_minimal_metadata'] !== '0' ? 'MINIMAL METADATA: ON' : 'METADATA: OFF'}
                </button>
              </div>

              {/* Setting 3: Spreadsheet Submission Workflow */}
              <div className="p-4 rounded-xl admin-glass-card border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      3. Send Detailed Responses to Spreadsheet Workflow
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 font-bold">
                      External Pipeline
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                    <strong>Consequence:</strong> When active, forwards every registration response directly to the official Google Forms endpoint linked to each competition track. All complete questions, team rosters, and uploaded file URLs land directly in Department Google Sheets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditedValues({
                      ...editedValues,
                      send_to_spreadsheet: editedValues['send_to_spreadsheet'] === '0' ? '1' : '0',
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                    editedValues['send_to_spreadsheet'] !== '0'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {editedValues['send_to_spreadsheet'] !== '0' ? 'SHEETS SYNC: ON' : 'SHEETS SYNC: OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* D. Global WhatsApp Community & Support */}
          <div className="admin-glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Global WhatsApp Community Gateway
              </h3>
            </div>
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Global Official WhatsApp Community / Group Link (Fallback)
              </label>
              <input
                type="url"
                value={editedValues['global_whatsapp_link'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, global_whatsapp_link: e.target.value })
                }
                placeholder="https://chat.whatsapp.com/..."
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This community link is presented on the registration confirmation view when an arena does not have an individual WhatsApp group configured.
              </p>
            </div>
          </div>

          {/* E. Configuration Audit Log Stamp */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>Governance Policy: Minimal TiDB Storage + Direct Sheets Dispatch</span>
            <span>Last Inspected: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Warning Modal when Disabling Global Registration */}
          {showCloseWarningModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-rose-200 dark:border-rose-900/40 shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Close Global Registration Gateway?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Disabling the global registration switch will immediately close registration across <strong>all nine competition tracks</strong>. Any delegate attempting to submit will receive an HTTP 403 response.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseWarningModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedValues({
                        ...editedValues,
                        registration_global_open: '0',
                      });
                      setShowCloseWarningModal(false);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-sm"
                  >
                    Confirm &amp; Disable
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Department Discount Rules */}
      {activeTab === 'discounts' && (() => {
        let rule: {
          enabled: boolean;
          institution: string;
          department: string;
          discountPercentage: number;
          applicableCompetitions: string[];
          effectiveFrom?: string;
          effectiveTo?: string;
        } = {
          enabled: true,
          institution: 'PCE',
          department: 'ITC',
          discountPercentage: 50,
          applicableCompetitions: ['all'],
          effectiveFrom: '2026-10-01',
          effectiveTo: '2026-10-31',
        };

        if (editedValues['department_discount_rules']) {
          try {
            rule = { ...rule, ...JSON.parse(editedValues['department_discount_rules']) };
          } catch {}
        }

        const updateRule = (patch: Partial<typeof rule>) => {
          const next = { ...rule, ...patch };
          setEditedValues({
            ...editedValues,
            department_discount_rules: JSON.stringify(next),
          });
        };

        const normalSample = 200;
        const discountSample = rule.enabled ? Math.round((normalSample * (rule.discountPercentage || 50)) / 100) : 0;
        const finalSample = normalSample - discountSample;

        return (
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-800 dark:text-zinc-200 flex items-start gap-3.5">
              <Percent className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Department Discount Rules &amp; Institutional Concessions
                </h3>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Configure department fee waivers approved by faculty. The system validates the participant&apos;s institution and department, dynamically updates the registration checkout &amp; UPI QR code, and enforces pricing authoritatively on the server.
                </p>
              </div>
            </div>

            {/* Rule Configuration Card */}
            <div className="admin-glass-panel rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Discount Rule Status
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enable or disable the special concession across all public registration forms.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateRule({ enabled: !rule.enabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    rule.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Eligible Institution */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block font-semibold">
                    Eligible Institution / College *
                  </label>
                  <select
                    value={rule.institution}
                    onChange={(e) => updateRule({ institution: e.target.value })}
                    className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium"
                  >
                    {COLLEGE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c === 'PCE' ? 'PCE (Priyadarshini College of Engineering - Host Institution)' : c}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Host College canonical code: <code>PCE</code>. Matches participant selection.
                  </p>
                </div>

                {/* Eligible Department */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block font-semibold">
                    Eligible Department / Branch *
                  </label>
                  <select
                    value={rule.department}
                    onChange={(e) => updateRule({ department: e.target.value })}
                    className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b === 'ITC' ? 'ITC (Information Technology & Computer / ITC - 50% Concession)' : b}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Host Department code: <code>ITC</code>. Must match participant branch selection.
                  </p>
                </div>

                {/* Discount Percentage */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block font-semibold">
                    Discount Percentage (%) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={rule.discountPercentage}
                      onChange={(e) => updateRule({ discountPercentage: Number(e.target.value) })}
                      className="admin-glass-input w-28 px-3.5 py-2 rounded-xl text-xs font-mono font-bold"
                    />
                    <div className="flex items-center gap-1">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => updateRule({ discountPercentage: pct })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                            rule.discountPercentage === pct
                              ? 'bg-blue-600 text-white'
                              : 'admin-glass-panel hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Default: 50% approved faculty concession.</p>
                </div>

                {/* Applicable Competitions Scope */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block font-semibold">
                    Applicable Competitions Scope
                  </label>
                  <select
                    value={rule.applicableCompetitions.includes('all') ? 'all' : 'selected'}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        updateRule({ applicableCompetitions: ['all'] });
                      }
                    }}
                    className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="all">All Applicable Paid Competitions (Universal)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Applies automatically across all paid festival arenas. Free competitions remain ₹0.
                  </p>
                </div>
              </div>

              {/* Live Fee Calculator Simulator Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Real-Time Pricing Verification Simulator</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    rule.enabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {rule.enabled ? 'Rule Active' : 'Rule Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Eligible Participant Box */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        ✓ Eligible: PCE + ITC Student
                      </span>
                      <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                        {rule.enabled ? `${rule.discountPercentage}% OFF` : '0% OFF'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500 text-[11px]">Normal Configured Fee:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">₹{normalSample}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-emerald-600 dark:text-emerald-400">
                      <span className="text-[11px]">Department Concession:</span>
                      <span className="font-mono font-bold">-₹{discountSample}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-emerald-500/20 font-bold">
                      <span className="text-slate-900 dark:text-white text-xs">Final Payable Amount:</span>
                      <span className="font-mono text-sm text-blue-600 dark:text-blue-400">₹{finalSample}</span>
                    </div>
                  </div>

                  {/* Ineligible Participant Box */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-zinc-300 text-xs">
                        Other College / Department
                      </span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Standard Fee
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-500 text-[11px]">Normal Configured Fee:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">₹{normalSample}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-slate-400">
                      <span className="text-[11px]">Department Concession:</span>
                      <span className="font-mono font-bold">₹0</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 font-bold">
                      <span className="text-slate-900 dark:text-white text-xs">Final Payable Amount:</span>
                      <span className="font-mono text-sm text-slate-800 dark:text-zinc-200">₹{normalSample}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Note: Server independently verifies department eligibility on submission. Free tracks remain free. Existing registrations retain their historical recorded fees.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 5: Footer & Social Links */}
      {activeTab === 'footer' && (
        <div className="admin-glass-panel rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
              Footer Brand Description
            </label>
            <textarea
              rows={3}
              value={editedValues['footer_description'] ?? ''}
              onChange={(e) =>
                setEditedValues({ ...editedValues, footer_description: e.target.value })
              }
              placeholder="YUGANTAR 2026 is the premier intercollegiate technical symposium..."
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Public Contact Email
              </label>
              <input
                type="email"
                value={editedValues['footer_email'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, footer_email: e.target.value })
                }
                placeholder="teleera.etc@pcenagpur.edu.in"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Public Contact Phone / Helpdesk
              </label>
              <input
                type="text"
                value={editedValues['footer_phone'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, footer_phone: e.target.value })
                }
                placeholder="+91 7104 236381 / 236382"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Official Instagram URL
              </label>
              <input
                type="url"
                value={editedValues['footer_instagram'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, footer_instagram: e.target.value })
                }
                placeholder="https://instagram.com/teleera_pce"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Official LinkedIn URL
              </label>
              <input
                type="url"
                value={editedValues['footer_linkedin'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, footer_linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/company/pce-nagpur-etc"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Official GitHub / Codebase URL
              </label>
              <input
                type="url"
                value={editedValues['footer_github'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, footer_github: e.target.value })
                }
                placeholder="https://github.com/codebyom2309/yugantar"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                Official College Website URL
              </label>
              <input
                type="url"
                value={editedValues['footer_college_url'] ?? ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, footer_college_url: e.target.value })
                }
                placeholder="https://www.pcenagpur.edu.in"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
              Footer Custom Helpful Links (JSON format)
            </label>
            <textarea
              rows={3}
              value={editedValues['footer_custom_links'] ?? ''}
              onChange={(e) =>
                setEditedValues({ ...editedValues, footer_custom_links: e.target.value })
              }
              placeholder='[{"label":"Campus Guidelines","url":"/about#campus"}]'
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Array of objects with <code>label</code> and <code>url</code> keys.
            </p>
          </div>
        </div>
      )}

      {/* Modal 1: Disable Pass & Certificate Generation Confirmation */}
      {showPassCertDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1528] border border-black/10 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Disable Pass &amp; Certificate Generation?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Master Festival-Wide Override
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPassCertDisableModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 space-y-2 leading-relaxed">
              <p className="font-bold">
                Are you sure you want to turn OFF Pass &amp; Certificate Generation festival-wide?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>No new digital or PDF registration passes will be generated.</li>
                <li>No new certificates of participation or merit will be generated.</li>
                <li>Public PDF download buttons will be disabled/hidden with a clear notice.</li>
                <li>Direct PDF and certificate API endpoints will return HTTP 403 Forbidden.</li>
                <li><strong>Campus gate QR verification (<code>/verify/[token]</code>) remains fully operational.</strong></li>
                <li>All existing registrations, payment proofs, and attendee records remain safe and untouched.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPassCertDisableModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedValues({
                    ...editedValues,
                    pass_certificate_generation_global_open: '0',
                    pass_generation_global_open: '0',
                    certificate_generation_global_open: '0',
                  });
                  setShowPassCertDisableModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Yes, Disable Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Switch Registration Mode to LIVE Confirmation */}
      {showLiveModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1528] border border-black/10 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Switch to LIVE Official Registration?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Production Campaign Activation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveModeModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-2 leading-relaxed">
              <p className="font-bold">
                Confirm transition from Internal Testing to LIVE Official Delegate Registration:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>All 47 previous testing submissions will remain permanently tagged as <strong>TEST DATA</strong>.</li>
                <li>New submissions will be recorded with <code>registration_mode = &apos;LIVE&apos;</code>.</li>
                <li>Official attendance dashboards, reports, and payment reconciliations will default to LIVE participants only.</li>
                <li>Existing test registrations will NEVER be mixed into official participant reports or deleted.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLiveModeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedValues({
                    ...editedValues,
                    registration_environment_mode: 'LIVE',
                  });
                  setShowLiveModeModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Confirm Switch to LIVE Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Global Registration Gateway Closure Confirmation */}
      {showCloseWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1528] border border-black/10 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Close Global Registration Gateway?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Festival-Wide Intake Shutdown
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseWarningModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 space-y-2 leading-relaxed">
              <p className="font-bold">
                Closing the Global Registration Gateway will immediately block incoming registrations across all competitions:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>All public registration submission forms will show registration closed.</li>
                <li>Server APIs will strictly reject incoming registration requests.</li>
                <li>Existing registrations and passes are preserved completely.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseWarningModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedValues({
                    ...editedValues,
                    registration_global_open: '0',
                  });
                  setShowCloseWarningModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Yes, Close Gateway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
