'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, Check, Loader2, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import AdminDatePicker from '@/components/admin/AdminDatePicker';

interface Setting {
  setting_key: string;
  setting_value: string;
  setting_group: string;
  label: string;
  field_type: string;
}

export default function HomepagePage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const all = d.settings || [];
        setSettings(all);
        const vals: Record<string, string> = {};
        all.forEach((s: Setting) => {
          vals[s.setting_key] = s.setting_value;
        });
        setEditedValues(vals);
        setLoading(false);
      });
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

    if (changedSettings.length > 0) {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      });
      const r = await fetch('/api/admin/settings');
      const d = await r.json();
      setSettings(d.settings || []);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const heroKeys = [
    'event_name',
    'event_edition',
    'event_concept',
    'event_tagline',
    'event_subheading',
    'event_date',
  ];
  const assetKeys = ['hero_artwork', 'hero_artwork_mobile', 'logo_emblem', 'districts_map'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 admin-glass-panel rounded-xl animate-pulse" />
        <div className="h-64 admin-glass-panel rounded-2xl animate-pulse" />
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
            Homepage Content Management
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Hero headings, event tagline, festival concept keywords, and main landing visuals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl admin-glass-panel text-xs font-mono text-slate-700 dark:text-zinc-300 hover:border-blue-500/40 transition shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>Live Site</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div className="admin-glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-black/5 dark:border-white/10">
          Hero Section Copy & Metadata
        </h3>
        <div className="space-y-4">
          {settings
            .filter((s) => heroKeys.includes(s.setting_key))
            .map((s) => (
              <div key={s.setting_key}>
                {s.setting_key === 'event_date' ? (
                  <AdminDatePicker
                    label={s.label || 'Festival Date (Display)'}
                    value={editedValues[s.setting_key] || ''}
                    onChange={(displayDate, isoDate) =>
                      setEditedValues((prev) => ({
                        ...prev,
                        event_date: displayDate,
                        ...(isoDate ? { event_iso_date: isoDate } : {}),
                      }))
                    }
                    placeholder="Choose festival date..."
                  />
                ) : (
                  <>
                    <label className="block text-xs font-mono text-slate-700 dark:text-zinc-300 mb-1 font-semibold">
                      {s.label || s.setting_key}
                    </label>
                    {s.field_type === 'textarea' || (editedValues[s.setting_key] || '').length > 80 ? (
                      <textarea
                        value={editedValues[s.setting_key] || ''}
                        onChange={(e) =>
                          setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })
                        }
                        rows={3}
                        className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editedValues[s.setting_key] || ''}
                        onChange={(e) =>
                          setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })
                        }
                        className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                      />
                    )}
                  </>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Homepage Innovation Corridors Card Artwork (Admin Managed) */}
      <div className="admin-glass-panel rounded-2xl p-6 space-y-4 shadow-sm border border-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/10">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Innovation Corridors Homepage Card Artwork
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
              Admin-managed card visual located immediately above &ldquo;Department of ETC&rdquo; on the public homepage.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Priority 6 Feature
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Live Preview Box */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block font-semibold">
              Live Card Preview
            </span>
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#DCE5F2] shadow-sm bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
              {editedValues.homepage_hero_card_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editedValues.homepage_hero_card_image}
                  alt="Innovation Corridors Artwork Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default on broken image to prevent ugly broken image icon
                    (e.target as HTMLImageElement).src = '/images/nexus-city/hero-futuristic-city-clouds.webp';
                  }}
                />
              ) : (
                <span className="text-xs text-slate-400 font-mono">No image configured</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#10264A]/75 via-transparent to-transparent flex items-end p-4 pointer-events-none">
                <span className="text-[10px] font-mono font-bold text-white tracking-wider uppercase">
                  INTERCONNECTED INNOVATION CORRIDORS
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono text-center">
              Aspect Ratio: 16:9 · Scaled for desktop &amp; mobile viewports
            </p>
          </div>

          {/* Controls & Filebase Uploader */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-700 dark:text-zinc-300 mb-1 font-semibold">
                Image Asset URL or Filebase Storage Path
              </label>
              <input
                type="text"
                value={editedValues.homepage_hero_card_image || ''}
                onChange={(e) =>
                  setEditedValues({ ...editedValues, homepage_hero_card_image: e.target.value })
                }
                placeholder="/images/nexus-city/hero-futuristic-city-clouds.webp"
                className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            {/* File Upload to Filebase */}
            <div className="p-4 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-dashed border-slate-300 dark:border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                    Upload New Image to Filebase
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Direct binary storage in Filebase bucket. Updates the database reference automatically.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer transition shadow-xs">
                  <span>Browse &amp; Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSaving(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('role', 'artwork');
                        formData.append('entityType', 'homepage');
                        const res = await fetch('/api/admin/media', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await res.json();
                        if (res.ok && data.asset?.url) {
                          setEditedValues((prev) => ({
                            ...prev,
                            homepage_hero_card_image: data.asset.url,
                          }));
                        } else {
                          alert(`Upload failed: ${data.error || 'Server rejected file'}`);
                        }
                      } catch (err) {
                        alert(`Upload failed: ${err instanceof Error ? err.message : 'Network error'}`);
                      } finally {
                        setSaving(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setEditedValues((prev) => ({
                      ...prev,
                      homepage_hero_card_image: '/images/nexus-city/hero-futuristic-city-clouds.webp',
                    }))
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-mono hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Reset to Default Artwork
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Assets */}
      <div className="admin-glass-panel rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-black/5 dark:border-white/10">
          Key Visual Asset Paths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings
            .filter((s) => assetKeys.includes(s.setting_key))
            .map((s) => (
              <div key={s.setting_key}>
                <label className="block text-xs font-mono text-slate-700 dark:text-zinc-300 mb-1 font-semibold">
                  {s.label || s.setting_key}
                </label>
                <input
                  type="text"
                  value={editedValues[s.setting_key] || ''}
                  onChange={(e) =>
                    setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })
                  }
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
