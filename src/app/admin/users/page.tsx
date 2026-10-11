'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit3, Trash2, Shield, X, Save, Loader2, CheckCircle2, Ban } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  auth_provider: string;
  is_enabled: number;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full root access to all settings, users, and data' },
  { value: 'content_admin', label: 'Content Admin', desc: 'Can edit festival content, competitions, and FAQs' },
  { value: 'registration_admin', label: 'Registration Admin', desc: 'Can review and verify delegate registrations' },
  { value: 'readonly_admin', label: 'Read Only', desc: 'View-only access for operational auditing' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'readonly_admin',
    password: '',
    authProvider: 'google',
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const r = await fetch('/api/admin/users');
      const d = await r.json();
      setUsers(d.users || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      email: '',
      name: '',
      role: 'readonly_admin',
      password: '',
      authProvider: 'google',
    });
    setShowModal(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
      authProvider: user.auth_provider,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            name: form.name,
            role: form.role,
            password: form.password || undefined,
          }),
        });
      } else {
        await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.name,
            role: form.role,
            password: form.password || undefined,
            authProvider: form.authProvider,
          }),
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user: AdminUser) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isEnabled: user.is_enabled ? 0 : 1 }),
      });
      fetchUsers();
    } catch (err) {
      console.error('Error toggling user:', err);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to revoke access for "${user.name}" (${user.email})?`)) return;
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Administrator Accounts
            <span className="text-sm font-normal text-slate-500 dark:text-zinc-400 font-mono">({users.length})</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Role-based access control, Google Sign-In provisioning, and system permissions.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision Admin</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="admin-glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-zinc-400 text-left font-mono">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Auth Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-black/10 dark:bg-white/10 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                    No administrators found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-300 font-semibold">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400 uppercase text-[11px]">
                      {u.auth_provider}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          u.is_enabled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {u.is_enabled ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(u)}
                          title={u.is_enabled ? 'Suspend' : 'Activate'}
                          className="p-1.5 rounded-lg admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition cursor-pointer"
                        >
                          {u.is_enabled ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit"
                          className="p-1.5 rounded-lg admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          title="Revoke"
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md admin-glass-panel rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Edit Administrator' : 'Provision Administrator'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Om Satange"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="admin@domain.edu.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Role & Permissions</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Authentication Method</label>
                  <select
                    value={form.authProvider}
                    onChange={(e) => setForm({ ...form, authProvider: e.target.value })}
                    className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                  >
                    <option value="google">Google Workspace / Sign-In</option>
                    <option value="credentials">Email & Password</option>
                    <option value="both">Both (Google + Password)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
                  {editingUser ? 'Reset Password (leave blank to keep unchanged)' : 'Initial Password (optional for Google SSO)'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl admin-glass-panel text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingUser ? 'Save Changes' : 'Provision User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
