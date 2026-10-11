'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit3, Trash2, X, Save, Loader2 } from 'lucide-react';

interface Organizer {
  id: string; name: string; role: string; department: string; description: string;
  badge: string; leadership_note: string; logo_url: string | null; display_order: number; is_published: number;
}

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organizer | null>(null);
  const [form, setForm] = useState({ name: '', role: '', department: '', description: '', badge: '', leadershipNote: '', logoUrl: '', displayOrder: 0 });
  const [saving, setSaving] = useState(false);

  const fetchOrgs = async () => {
    const r = await fetch('/api/admin/organizers');
    const d = await r.json();
    setOrganizers(d.organizers || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrgs(); }, []);

  const openCreate = () => {
    setEditingOrg(null);
    setForm({ name: '', role: '', department: '', description: '', badge: '', leadershipNote: '', logoUrl: '', displayOrder: organizers.length });
    setShowModal(true);
  };

  const openEdit = (org: Organizer) => {
    setEditingOrg(org);
    setForm({ name: org.name, role: org.role, department: org.department, description: org.description, badge: org.badge, leadershipNote: org.leadership_note, logoUrl: org.logo_url || '', displayOrder: org.display_order });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingOrg) {
      await fetch('/api/admin/organizers', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOrg.id, ...form }),
      });
    } else {
      await fetch('/api/admin/organizers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchOrgs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this organizer?')) return;
    await fetch('/api/admin/organizers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchOrgs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          Organizers
        </h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Organizer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />)
        ) : (
          organizers.map((org) => (
            <div key={org.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold mb-2 inline-block">{org.badge || 'Organization'}</span>
                  <h3 className="text-sm font-bold text-white">{org.name}</h3>
                  <p className="text-xs text-slate-400">{org.role}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(org)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(org.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{org.description}</p>
              <p className="text-[10px] text-slate-500">{org.department}</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editingOrg ? 'Edit Organizer' : 'Add Organizer'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'role', label: 'Role', type: 'text' },
                { key: 'department', label: 'Department', type: 'text' },
                { key: 'badge', label: 'Badge Label', type: 'text' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">{f.label}</label>
                  <input type="text" value={(form as Record<string, string | number>)[f.key] as string} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Leadership Note</label>
                <textarea value={form.leadershipNote} onChange={(e) => setForm({ ...form, leadershipNote: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingOrg ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
