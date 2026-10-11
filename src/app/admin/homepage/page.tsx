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
