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
} from 'lucide-react';
import AdminDatePicker from '@/components/admin/AdminDatePicker';

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
  const [activeTab, setActiveTab] = useState<'identity' | 'venue' | 'assets' | 'registration' | 'footer'>('identity');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

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

      {/* Tab 4: Global Registration Gateway */}
      {activeTab === 'registration' && (
        <div className="admin-glass-panel rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between p-4 rounded-xl admin-glass-card border border-black/10 dark:border-white/10">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Global Registration Master Switch
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                When turned off, registration forms across all competitions are disabled.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditedValues({
                  ...editedValues,
                  registration_global_open: (editedValues['registration_global_open'] === '1' ? '0' : '1'),
                })
              }
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                editedValues['registration_global_open'] === '1'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-rose-600 text-white shadow-rose-500/20'
              }`}
            >
              {editedValues['registration_global_open'] === '1' ? 'GATEWAY ACTIVE (OPEN)' : 'GATEWAY CLOSED'}
            </button>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
              Public Status Announcement / Notification Message
            </label>
            <input
              type="text"
              value={editedValues['registration_status_message'] ?? ''}
              onChange={(e) =>
                setEditedValues({ ...editedValues, registration_status_message: e.target.value })
              }
              className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          <div className="pt-2">
            <AdminDatePicker
              label="Registration Deadline Date & Time"
              value={editedValues['registration_deadline'] ?? ''}
              onChange={(displayDate) =>
                setEditedValues({ ...editedValues, registration_deadline: displayDate })
              }
              includeTime={true}
              placeholder="Set registration closure deadline..."
            />
          </div>
        </div>
      )}

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
    </div>
  );
}
