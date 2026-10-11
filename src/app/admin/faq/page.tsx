'use client';

import React, { useEffect, useState } from 'react';
import { HelpCircle, Plus, Edit3, Trash2, X, Save, Loader2, Eye, EyeOff, Search } from 'lucide-react';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  competition_slug: string | null;
  display_order: number;
  is_published: number;
}

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({
    category: 'General',
    question: '',
    answer: '',
    competitionSlug: '',
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFaqs = async () => {
    try {
      const r = await fetch('/api/admin/faqs');
      const d = await r.json();
      setFaqs(d.faqs || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openCreate = () => {
    setEditingFaq(null);
    setForm({
      category: 'General',
      question: '',
      answer: '',
      competitionSlug: '',
      displayOrder: faqs.length,
    });
    setShowModal(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      competitionSlug: faq.competition_slug || '',
      displayOrder: faq.display_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFaq) {
        await fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFaq.id, ...form }),
        });
      } else {
        await fetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      fetchFaqs();
    } catch (err) {
      console.error('Error saving FAQ:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ entry?')) return;
    try {
      await fetch('/api/admin/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchFaqs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  const togglePublish = async (faq: FAQ) => {
    try {
      await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: faq.id,
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          isPublished: faq.is_published ? 0 : 1,
        }),
      });
      fetchFaqs();
    } catch (err) {
      console.error('Error toggling publish:', err);
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            FAQ Management
            <span className="text-sm font-normal text-slate-500 dark:text-zinc-400 font-mono">({faqs.length})</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Global festival inquiries, track-specific guidelines, eligibility questions, and answers.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Filter FAQs by question, category or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 admin-glass-panel rounded-2xl animate-pulse" />
          ))
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-16 admin-glass-panel rounded-2xl text-slate-500 dark:text-zinc-400 text-xs">
            No FAQs found matching your criteria.
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`admin-glass-panel rounded-2xl p-5 transition-all shadow-xs ${
                faq.is_published
                  ? 'hover:border-blue-500/40'
                  : 'opacity-60 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">
                      {faq.category}
                    </span>
                    {faq.competition_slug && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase admin-glass-card text-slate-600 dark:text-zinc-400">
                        Track: {faq.competition_slug}
                      </span>
                    )}
                    {!faq.is_published && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                        DRAFT / HIDDEN
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                    {faq.question}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => togglePublish(faq)}
                    title={faq.is_published ? 'Hide FAQ' : 'Publish FAQ'}
                    className="p-2 rounded-xl admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition cursor-pointer"
                  >
                    {faq.is_published ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <button
                    onClick={() => openEdit(faq)}
                    title="Edit"
                    className="p-2 rounded-xl admin-glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    title="Delete"
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg admin-glass-panel rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingFaq ? 'Edit FAQ' : 'Add FAQ Question'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="General, Schedule, Eligibility"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Competition Scope (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank for global"
                    value={form.competitionSlug}
                    onChange={(e) => setForm({ ...form, competitionSlug: e.target.value })}
                    className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Can participants from different colleges form a team?"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">Answer</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide comprehensive, clear instructions..."
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs resize-none"
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
                  <span>{editingFaq ? 'Update FAQ' : 'Create FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
