'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, Check, Loader2 } from 'lucide-react';

interface Setting {
  setting_key: string;
  setting_value: string;
  setting_group: string;
  label: string;
  field_type: string;
  updated_at: string;
}

const GROUP_LABELS: Record<string, string> = {
  general: 'General Event Info',
  venue: 'Venue & Location',
  assets: 'Visual Assets',
  registration: 'Registration Config',
};

export default function EventSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || []);
        const vals: Record<string, string> = {};
        (d.settings || []).forEach((s: Setting) => { vals[s.setting_key] = s.setting_value; });
        setEditedValues(vals);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const changedSettings = settings
      .filter((s) => editedValues[s.setting_key] !== s.setting_value)
      .map((s) => ({ key: s.setting_key, value: editedValues[s.setting_key] }));

    if (changedSettings.length === 0) { setSaving(false); return; }

    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: changedSettings }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Refresh
    const r = await fetch('/api/admin/settings');
    const d = await r.json();
    setSettings(d.settings || []);
  };

  const groups = [...new Set(settings.map((s) => s.setting_group))];

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-slate-800 rounded-lg" /><div className="h-64 bg-slate-800/50 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          Event Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {groups.map((group) => (
        <div key={group} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-700/50">
            {GROUP_LABELS[group] || group}
          </h3>
          <div className="space-y-4">
            {settings.filter((s) => s.setting_group === group).map((s) => (
              <div key={s.setting_key}>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {s.label || s.setting_key}
                  <span className="text-slate-600 font-normal ml-2">({s.setting_key})</span>
                </label>
                {s.field_type === 'textarea' ? (
                  <textarea
                    value={editedValues[s.setting_key] || ''}
                    onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
                  />
                ) : s.field_type === 'boolean' ? (
                  <select
                    value={editedValues[s.setting_key] || '0'}
                    onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="1">Enabled</option>
                    <option value="0">Disabled</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editedValues[s.setting_key] || ''}
                    onChange={(e) => setEditedValues({ ...editedValues, [s.setting_key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
