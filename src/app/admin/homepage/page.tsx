'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, Check, Loader2, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
        all.forEach((s: Setting) => { vals[s.setting_key] = s.setting_value; });
        setEditedValues(vals);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const changedSettings = settings
      .filter((s) => editedValues[s.setting_key] !== s.setting_value)
      .map((s) => ({ key: s.setting_key, value: editedValues[s.setting_key] }));

    if (changedSettings.length > 0) {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const heroKeys = ['event_name', 'event_edition', 'event_concept', 'event_tagline', 'event_subheading', 'event_date'];
  const assetKeys = ['hero_artwork', 'hero_artwork_mobile', 'logo_emblem', 'districts_map'];

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-slate-800 rounded-lg" /><div className="h-64 bg-slate-800/50 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          Homepage Content
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors">
            <Eye className="w-4 h-4" /> Preview <ExternalLink className="w-3 h-3" />
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-700/50">Hero Section Content</h3>
        <div className="space-y-4">
          {settings.filter((s) => heroKeys.includes(s.setting_key)).map((s) => (
            <div key={s.setting_key}>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{s.label || s.setting_key}</label>
              {s.field_type === 'textarea' || (editedValues[s.setting_key] || '').length > 80 ? (
                <textarea value={editedValues[s.setting_key] || ''} onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
              ) : (
                <input type="text" value={editedValues[s.setting_key] || ''} onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visual Assets */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-700/50">Visual Assets (Image Paths)</h3>
        <div className="space-y-4">
          {settings.filter((s) => assetKeys.includes(s.setting_key)).map((s) => (
            <div key={s.setting_key}>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{s.label || s.setting_key}</label>
              <input type="text" value={editedValues[s.setting_key] || ''} onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              {editedValues[s.setting_key] && editedValues[s.setting_key].startsWith('/') && (
                <div className="mt-2 p-2 rounded-xl bg-slate-900/30 border border-slate-700/30">
                  <img src={editedValues[s.setting_key]} alt={s.label} className="max-h-24 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Registration Config */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-700/50">Registration Configuration</h3>
        <div className="space-y-4">
          {settings.filter((s) => s.setting_group === 'registration').map((s) => (
            <div key={s.setting_key}>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{s.label || s.setting_key}</label>
              {s.field_type === 'boolean' ? (
                <select value={editedValues[s.setting_key] || '0'} onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="1">Enabled (Open)</option>
                  <option value="0">Disabled (Closed)</option>
                </select>
              ) : (
                <input type="text" value={editedValues[s.setting_key] || ''} onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
