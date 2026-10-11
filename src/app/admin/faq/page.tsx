'use client';

import React, { useEffect, useState } from 'react';
import { HelpCircle, Plus, Edit3, Trash2, X, Save, Loader2, Eye, EyeOff } from 'lucide-react';

interface FAQ {
  id: string; category: string; question: string; answer: string;
  competition_slug: string | null; display_order: number; is_published: number;
}

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ category: '', question: '', answer: '', competitionSlug: '', displayOrder: 0 });
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    const r = await fetch('/api/admin/faqs');
    const d = await r.json();
    setFaqs(d.faqs || []);
    setLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openCreate = () => {
    setEditingFaq(null);
    setForm({ category: 'General', question: '', answer: '', competitionSlug: '', displayOrder: faqs.length });
    setShowModal(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, competitionSlug: faq.competition_slug || '', displayOrder: faq.display_order });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingFaq) {
      await fetch('/api/admin/faqs', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingFaq.id, ...form }),
      });
    } else {
      await fetch('/api/admin/faqs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await fetch('/api/admin/faqs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchFaqs();
  };

  const togglePublish = async (faq: FAQ) => {
    await fetch('/api/admin/faqs', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: faq.id, category: faq.category, question: faq.question, answer: faq.answer, isPublished: faq.is_published ? 0 : 1 }),
    });
    fetchFaqs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-400" />
          FAQ Management
          <span className="text-sm font-normal text-slate-400">({faqs.length})</span>
        </h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />)
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No FAQs yet. Click &ldquo;Add FAQ&rdquo; to create one.</div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className={`bg-slate-800/40 border rounded-2xl p-4 ${faq.is_published ? 'border-slate-700/50' : 'border-red-500/20 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">{faq.category}</span>
                    {faq.competition_slug && <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">{faq.competition_slug}</span>}
                    {!faq.is_published && <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">HIDDEN</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{faq.question}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePublish(faq)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors" title={faq.is_published ? 'Hide' : 'Publish'}>
                    {faq.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(faq)} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(faq.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., General, Registration, Payment"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Question</label>
                <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Answer</label>
                <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingFaq ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
