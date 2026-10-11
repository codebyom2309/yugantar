'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit3, Trash2, Shield, X, Save, Loader2 } from 'lucide-react';

interface AdminUser {
  id: string; email: string; name: string; role: string; auth_provider: string;
  is_enabled: number; avatar_url: string | null; last_login_at: string | null; created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', color: 'text-red-400' },
  { value: 'content_admin', label: 'Content Admin', color: 'text-blue-400' },
  { value: 'registration_admin', label: 'Registration Admin', color: 'text-amber-400' },
  { value: 'readonly_admin', label: 'Read Only', color: 'text-slate-400' },
];

const ROLE_STYLES: Record<string, string> = {
  super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  content_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  registration_admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  readonly_admin: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ email: '', name: '', role: 'readonly_admin', password: '', authProvider: 'google' as string });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const r = await fetch('/api/admin/users');
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: '', name: '', role: 'readonly_admin', password: '', authProvider: 'google' });
    setShowModal(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({ email: user.email, name: user.name, role: user.role, password: '', authProvider: user.auth_provider });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingUser) {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, name: form.name, role: form.role, password: form.password || undefined }),
      });
    } else {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, role: form.role, password: form.password || undefined, authProvider: form.authProvider }),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchUsers();
  };

  const handleToggle = async (user: AdminUser) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, isEnabled: user.is_enabled ? 0 : 1 }),
    });
    fetchUsers();
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete admin user "${user.name}" (${user.email})?`)) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          Admin Users
        </h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50 bg-slate-800/60">
                <th className="text-left py-3 px-4 font-medium">User</th>
                <th className="text-left py-3 px-3 font-medium">Role</th>
                <th className="text-left py-3 px-3 font-medium">Provider</th>
                <th className="text-left py-3 px-3 font-medium">Status</th>
                <th className="text-left py-3 px-3 font-medium">Last Login</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                    {[...Array(6)].map((_, j) => <td key={j} className="py-3 px-3"><div className="h-4 bg-slate-700/50 rounded" /></td>)}
                  </tr>
                ))
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{u.name}</div>
                          <div className="text-slate-500 text-[10px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${ROLE_STYLES[u.role] || ROLE_STYLES.readonly_admin}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 capitalize">{u.auth_provider}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => handleToggle(u)} className="flex items-center gap-1.5">
                        {u.is_enabled ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">ENABLED</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">DISABLED</span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editingUser ? 'Edit Admin User' : 'Add Admin User'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Auth Provider</label>
                  <select value={form.authProvider} onChange={(e) => setForm({ ...form, authProvider: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                    <option value="google">Google OAuth Only</option>
                    <option value="credentials">Email/Password Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{editingUser ? 'New Password (optional)' : 'Password (for credentials login)'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank for Google-only"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
