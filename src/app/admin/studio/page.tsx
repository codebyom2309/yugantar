'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Award,
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Sparkles,
  Layers,
  Settings,
  ArrowRight,
  ExternalLink,
  Download,
  Check,
  RefreshCw,
  Sliders,
  Shield,
  HelpCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  Users,
  Calendar,
} from 'lucide-react';
import { PassTemplate, CompetitionAssignment, DocumentType, PaperSize, Orientation } from '@/types/studio';
import { COMPETITIONS } from '@/data/events';
import { exportTokenDocumentation } from '@/lib/studioTokens';

export default function StudioLandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'library' | 'assignments' | 'tokens' | 'issuance'>('library');
  const [templates, setTemplates] = useState<PassTemplate[]>([]);
  const [assignments, setAssignments] = useState<CompetitionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedTokens, setCopiedTokens] = useState(false);

  // Issued Credentials state
  const [issuedCertificates, setIssuedCertificates] = useState<any[]>([]);
  const [issuanceComp, setIssuanceComp] = useState<string>('project-competition');
  const [issuanceCertType, setIssuanceCertType] = useState<string>('participation_cert');
  const [issuanceCitation, setIssuanceCitation] = useState<string>('Certificate of Participation');
  const [issuanceMode, setIssuanceMode] = useState<'custom' | 'batch'>('custom');
  const [customRecipientName, setCustomRecipientName] = useState<string>('');
  const [customRecipientCollege, setCustomRecipientCollege] = useState<string>('PCE Nagpur');
  const [customRecipientEmail, setCustomRecipientEmail] = useState<string>('');
  const [availableRegistrations, setAvailableRegistrations] = useState<any[]>([]);
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [issuingLoading, setIssuingLoading] = useState(false);
  const [issuanceMessage, setIssuanceMessage] = useState<string | null>(null);
  const [issuanceError, setIssuanceError] = useState<string | null>(null);
  const [issuanceTeamScope, setIssuanceTeamScope] = useState<'individual_all' | 'leaders_only'>('individual_all');

  function extractRecipientsFromRegistration(
    reg: any,
    scope: 'individual_all' | 'leaders_only',
    defaultCitation: string
  ) {
    const recipients: Array<{
      registrationId: string;
      recipientName: string;
      recipientEmail: string;
      recipientCollege: string;
      rankCitation: string;
      isLeader: boolean;
      teamName: string | null;
    }> = [];

    if (!reg?.leader_name) return recipients;

    // 1. Leader is always included
    recipients.push({
      registrationId: reg.id,
      recipientName: reg.leader_name.trim(),
      recipientEmail: reg.leader_email?.trim() || '',
      recipientCollege: reg.leader_college?.trim() || 'PCE',
      rankCitation: defaultCitation,
      isLeader: true,
      teamName: reg.team_name,
    });

    if (scope === 'individual_all') {
      let parsed: Record<string, any> = {};
      if (reg.form_data) {
        try {
          parsed = typeof reg.form_data === 'string' ? JSON.parse(reg.form_data) : reg.form_data;
        } catch {}
      }

      // Check members array if present
      if (Array.isArray(parsed.members)) {
        for (const m of parsed.members) {
          if (
            m?.name &&
            typeof m.name === 'string' &&
            m.name.trim() &&
            m.name.trim().toLowerCase() !== reg.leader_name.trim().toLowerCase()
          ) {
            recipients.push({
              registrationId: reg.id,
              recipientName: m.name.trim(),
              recipientEmail: m.email?.trim() || reg.leader_email || '',
              recipientCollege: m.college?.trim() || reg.leader_college || 'PCE',
              rankCitation: defaultCitation,
              isLeader: false,
              teamName: reg.team_name,
            });
          }
        }
      } else {
        // Check individual numbered member keys: member2Name, member3Name, squadMember2Name, etc.
        const teamSize = Number(reg.team_size) || 4;
        for (let i = 2; i <= Math.max(teamSize, 10); i++) {
          const mName =
            parsed[`member${i}Name`] || parsed[`squadMember${i}Name`] || parsed[`member_${i}_name`];
          const mEmail = parsed[`member${i}Email`] || parsed[`squadMember${i}Email`];
          const mCollege = parsed[`member${i}College`] || parsed[`squadMember${i}College`];
          if (mName && typeof mName === 'string' && mName.trim()) {
            recipients.push({
              registrationId: reg.id,
              recipientName: mName.trim(),
              recipientEmail: mEmail?.trim() || reg.leader_email || '',
              recipientCollege: mCollege?.trim() || reg.leader_college || 'PCE',
              rankCitation: defaultCitation,
              isLeader: false,
              teamName: reg.team_name,
            });
          }
        }
      }
    }

    return recipients;
  }

  // New Template Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<DocumentType>('registration_pass');
  const [newPaperSize, setNewPaperSize] = useState<PaperSize>('A4');
  const [newOrientation, setNewOrientation] = useState<Orientation>('portrait');
  const [cloneFromId, setCloneFromId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // PDF Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<PassTemplate | null>(null);
  const [previewCompSlug, setPreviewCompSlug] = useState<string>('project-competition');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/admin/studio/certificates');
      const data = await res.json();
      if (data.certificates) setIssuedCertificates(data.certificates);
    } catch (err) {
      console.warn('Failed to load certificates:', err);
    }
  };

  const fetchEligibleRegistrations = async (compSlug: string) => {
    try {
      const res = await fetch(`/api/admin/registrations?competition=${compSlug}&limit=50`);
      const data = await res.json();
      if (data.registrations) {
        setAvailableRegistrations(data.registrations);
        setSelectedRegIds(data.registrations.map((r: any) => r.id));
      }
    } catch (err) {
      console.warn('Failed to load eligible registrations:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, assignRes] = await Promise.all([
        fetch('/api/admin/studio/templates'),
        fetch('/api/admin/studio/assignments'),
      ]);
      const tplData = await tplRes.json();
      const assignData = await assignRes.json();
      if (tplData.templates) setTemplates(tplData.templates);
      if (assignData.assignments) setAssignments(assignData.assignments);
      await fetchCertificates();
    } catch (err) {
      console.error('Failed to load studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'issuance') {
      fetchEligibleRegistrations(issuanceComp);
    }
  }, [activeTab, issuanceComp]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/admin/studio/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          paper_size: newPaperSize,
          orientation: newOrientation,
          duplicateFromId: cloneFromId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.id) {
        setShowCreateModal(false);
        router.push(`/admin/studio/designer/${data.id}`);
      }
    } catch (err) {
      console.error('Error creating template:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      const res = await fetch('/api/admin/studio/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicateFromId: id,
          title: `${title} (Copy)`,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to duplicate template:', err);
    }
  };

  const handleTogglePublish = async (template: PassTemplate) => {
    try {
      const res = await fetch(`/api/admin/studio/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_published: !template.is_published,
        }),
      });
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === template.id ? { ...t, is_published: !template.is_published } : t
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/studio/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAssignTemplate = async (
    competitionSlug: string,
    documentType: DocumentType,
    templateId: string
  ) => {
    try {
      if (templateId === '__global__') {
        // Reset to global
        await fetch('/api/admin/studio/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competition_slug: competitionSlug,
            document_type: documentType,
            action: 'remove',
          }),
        });
      } else {
        await fetch('/api/admin/studio/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competition_slug: competitionSlug,
            document_type: documentType,
            template_id: templateId,
          }),
        });
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to update assignment:', err);
    }
  };

  const openPdfPreview = async (template: PassTemplate, compSlug?: string) => {
    setPreviewTemplate(template);
    const targetComp = compSlug || previewCompSlug;
    setPreviewCompSlug(targetComp);
    setPreviewLoading(true);

    try {
      const res = await fetch('/api/admin/studio/preview/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          competitionSlug: targetComp,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
      }
    } catch (err) {
      console.error('Failed to generate PDF preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopyTokensDoc = () => {
    const doc = exportTokenDocumentation();
    navigator.clipboard.writeText(doc);
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2500);
  };

  const handleIssueSingleCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRecipientName.trim()) return;
    setIssuingLoading(true);
    setIssuanceMessage(null);
    setIssuanceError(null);

    try {
      const res = await fetch('/api/admin/studio/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: customRecipientName,
          recipientCollege: customRecipientCollege,
          recipientEmail: customRecipientEmail,
          competitionSlug: issuanceComp,
          certificateType: issuanceCertType,
          rankCitation: issuanceCitation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Issuance failed');

      setIssuanceMessage(
        `Certificate ${data.certificate.certificate_code} issued successfully to ${customRecipientName}!`
      );
      setCustomRecipientName('');
      await fetchCertificates();
    } catch (err: any) {
      setIssuanceError(err.message || 'Failed to issue certificate.');
    } finally {
      setIssuingLoading(false);
    }
  };

  const handleIssueBatchCerts = async () => {
    if (selectedRegIds.length === 0) return;
    setIssuingLoading(true);
    setIssuanceMessage(null);
    setIssuanceError(null);

    const selectedRegistrations = availableRegistrations.filter((r) => selectedRegIds.includes(r.id));
    const allEligibleItems: Array<{
      registrationId: string;
      recipientName: string;
      recipientEmail: string;
      recipientCollege: string;
      rankCitation: string;
    }> = [];

    for (const reg of selectedRegistrations) {
      const items = extractRecipientsFromRegistration(reg, issuanceTeamScope, issuanceCitation);
      for (const item of items) {
        allEligibleItems.push({
          registrationId: item.registrationId,
          recipientName: item.recipientName,
          recipientEmail: item.recipientEmail,
          recipientCollege: item.recipientCollege,
          rankCitation: item.rankCitation,
        });
      }
    }

    if (allEligibleItems.length === 0) {
      setIssuingLoading(false);
      setIssuanceError('No eligible recipients found in the selected registrations.');
      return;
    }

    try {
      const res = await fetch('/api/admin/studio/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionSlug: issuanceComp,
          certificateType: issuanceCertType,
          rankCitation: issuanceCitation,
          items: allEligibleItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch issuance failed');

      setIssuanceMessage(
        `Batch complete: ${data.summary.issuedCount} issued, ${data.summary.duplicateCount} duplicate skipped across ${allEligibleItems.length} candidate recipient(s).`
      );
      await fetchCertificates();
    } catch (err: any) {
      setIssuanceError(err.message || 'Batch issuance error.');
    } finally {
      setIssuingLoading(false);
    }
  };

  const handleRevokeCert = async (id: string) => {
    const reason = prompt('Enter the formal reason for revoking this certificate:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/studio/certificates/${id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await fetchCertificates();
      }
    } catch (err) {
      console.error('Revocation failed:', err);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const passesCount = templates.filter((t) => t.type.includes('pass')).length;
  const certsCount = templates.filter((t) => t.type.includes('cert')).length;
  const publishedCount = templates.filter((t) => t.is_published).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Studio Header */}
      <div className="admin-glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              YUGANTAR 2026 Admin Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pass & Certificate Studio
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
              Design, customize, preview, and assign registration passes and participation certificates across all 9 Arenas without rewriting code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyTokensDoc}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold admin-glass-panel text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-black/10 dark:border-white/10 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              {copiedTokens ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Tokens Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Canva Spec
                </>
              )}
            </button>

            <button
              onClick={() => {
                setNewType('registration_pass');
                setNewPaperSize('A4');
                setNewOrientation('portrait');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-black/5 dark:border-white/5">
          <div className="p-3.5 rounded-xl bg-slate-500/5 border border-black/5 dark:border-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Templates</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {templates.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-500/5 border border-black/5 dark:border-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pass Designs</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {passesCount}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-500/5 border border-black/5 dark:border-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Certificate Designs</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {certsCount}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-500/5 border border-black/5 dark:border-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Published Live</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {publishedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'library'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Design Library ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Competition Assignments (9 Arenas)
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tokens'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Data Tokens & Spec Guide
        </button>
        <button
          onClick={() => setActiveTab('issuance')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'issuance'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Credential Issuance &amp; Records ({issuedCertificates.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DESIGN LIBRARY                                          */}
      {/* ============================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'all', label: 'All Templates' },
                { id: 'registration_pass', label: 'Registration Passes' },
                { id: 'participation_cert', label: 'Certificates' },
                { id: 'delegate_pass', label: 'Delegate' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    typeFilter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'admin-glass-panel text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Cards Grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-60" />
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20 admin-glass-panel rounded-2xl border border-dashed border-black/10 dark:border-white/10">
              <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No templates found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Try adjusting your search query or create a new template.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const isPass = template.type.includes('pass');
                const isLandscape = template.orientation === 'landscape';

                return (
                  <div
                    key={template.id}
                    className="admin-glass-panel rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 flex flex-col hover:shadow-lg transition-all group"
                  >
                    {/* Visual Card Canvas Preview Representation */}
                    <div className="relative bg-slate-950/40 p-6 flex items-center justify-center border-b border-black/5 dark:border-white/5 min-h-[220px]">
                      <div
                        className={`shadow-md border border-slate-700/50 rounded flex flex-col justify-between p-3 relative overflow-hidden transition-transform group-hover:scale-[1.02] ${
                          isLandscape ? 'w-48 h-32' : 'w-32 h-44'
                        }`}
                        style={{
                          backgroundColor: template.background_url ? '#1E293B' : isPass ? '#0F172A' : '#FFFFFF',
                          backgroundImage: template.background_url ? `url(${template.background_url})` : undefined,
                          backgroundSize: template.background_fit || 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Mini preview elements overlay */}
                        <div className="space-y-1 relative z-10">
                          <div className={`text-[7px] font-bold truncate ${isPass ? 'text-white' : 'text-slate-900'}`}>
                            {template.title}
                          </div>
                          <div className={`text-[5px] truncate ${isPass ? 'text-blue-300' : 'text-slate-500'}`}>
                            {template.paper_size} {template.orientation} • v{template.version}
                          </div>
                        </div>

                        <div className="flex items-end justify-between relative z-10">
                          <div className={`text-[6px] font-mono ${isPass ? 'text-slate-400' : 'text-slate-600'}`}>
                            YUGANTAR 2026
                          </div>
                          <div className="w-5 h-5 bg-white/90 rounded p-0.5 flex items-center justify-center shadow-xs">
                            <Ticket className="w-3.5 h-3.5 text-slate-900" />
                          </div>
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isPass ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {template.type.replace('_', ' ')}
                        </span>
                        {template.is_global && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Global
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                          template.is_published
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {template.is_published ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Draft
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {template.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {template.description || 'Custom layout with data token bindings and dynamic verification QR.'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-3">
                          <span>{template.paper_size} ({template.width_pt} × {template.height_pt} pt)</span>
                          <span>•</span>
                          <span>{Array.isArray(template.elements) ? template.elements.length : 0} Elements</span>
                          <span>•</span>
                          <span>v{template.version}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openPdfPreview(template)}
                            title="Preview Generated PDF"
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template.id, template.title)}
                            title="Duplicate Template"
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(template)}
                            title={template.is_published ? 'Unpublish' : 'Publish'}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          {template.id !== 'global-registration-pass-default' &&
                            template.id !== 'global-participation-cert-default' && (
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                title="Delete Template"
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                        </div>

                        <Link
                          href={`/admin/studio/designer/${template.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Canvas
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: COMPETITION ASSIGNMENT MATRIX                           */}
      {/* ============================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="admin-glass-panel p-5 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Arena Template Assignments
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Assign competition-specific designs or let them inherit the active Global Template.
              </p>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
              Resolution Order: Specific Template → Global Template → Fallback Engine
            </div>
          </div>

          <div className="admin-glass-panel rounded-2xl overflow-hidden border border-black/10 dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 bg-slate-500/5 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Competition Arena</th>
                    <th className="py-3.5 px-4">Assigned Registration Pass</th>
                    <th className="py-3.5 px-4">Assigned Certificate</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {COMPETITIONS.map((comp) => {
                    // Find assigned templates
                    const passAssignment = assignments.find(
                      (a) => a.competition_slug === comp.slug && a.document_type === 'registration_pass'
                    );
                    const certAssignment = assignments.find(
                      (a) => a.competition_slug === comp.slug && a.document_type === 'participation_cert'
                    );

                    return (
                      <tr key={comp.slug} className="hover:bg-slate-500/5 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-bold text-slate-900 dark:text-white">{comp.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {comp.category} • {comp.district}
                          </div>
                        </td>

                        {/* Pass Selector */}
                        <td className="py-4 px-4">
                          <select
                            value={passAssignment?.template_id || '__global__'}
                            onChange={(e) =>
                              handleAssignTemplate(comp.slug, 'registration_pass', e.target.value)
                            }
                            className="w-full max-w-xs px-3 py-1.5 text-xs rounded-lg admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="__global__">✨ Global Registration Pass (Inherited)</option>
                            {templates
                              .filter((t) => t.type.includes('pass') && t.is_published)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.title}
                                </option>
                              ))}
                          </select>
                        </td>

                        {/* Certificate Selector */}
                        <td className="py-4 px-4">
                          <select
                            value={certAssignment?.template_id || '__global__'}
                            onChange={(e) =>
                              handleAssignTemplate(comp.slug, 'participation_cert', e.target.value)
                            }
                            className="w-full max-w-xs px-3 py-1.5 text-xs rounded-lg admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="__global__">🏆 Global Participation Certificate (Inherited)</option>
                            {templates
                              .filter((t) => t.type.includes('cert') && t.is_published)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.title}
                                </option>
                              ))}
                          </select>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => {
                              const targetTemplate =
                                templates.find((t) => t.id === passAssignment?.template_id) ||
                                templates.find((t) => t.type === 'registration_pass' && t.is_global) ||
                                templates[0];
                              if (targetTemplate) openPdfPreview(targetTemplate, comp.slug);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold admin-glass-panel hover:text-blue-600 dark:hover:text-blue-400 border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview Pass
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DATA TOKENS & CANVA REFERENCE                           */}
      {/* ============================================================== */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="admin-glass-panel p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Canva & AI Background Design Tokens Guide
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                When designing your passes in Canva, Photoshop, Figma, or generating layouts with AI, keep placeholder areas for these tokens. The Studio dynamically renders verified attendee data over your design.
              </p>
            </div>
            <button
              onClick={handleCopyTokensDoc}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              {copiedTokens ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedTokens ? 'Tokens Copied to Clipboard!' : 'Copy Full Token Specification'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Registration Tokens',
                tokens: [
                  { token: '{{registration.id}}', label: 'Registration ID', sample: 'YUG-PROJ-8421' },
                  { token: '{{registration.date}}', label: 'Date Registered', sample: '14 Oct 2026' },
                  { token: '{{registration.verifyToken}}', label: 'Security QR Reference', sample: 'yug_vf_9a2b8e3d' },
                ],
              },
              {
                title: 'Participant & Academic',
                tokens: [
                  { token: '{{participant.name}}', label: 'Candidate Full Name', sample: 'Aarav Deshmukh' },
                  { token: '{{participant.college}}', label: 'College / Institute', sample: 'PCE Nagpur' },
                  { token: '{{participant.branch}}', label: 'Department / Branch', sample: 'ETC' },
                  { token: '{{participant.semester}}', label: 'Semester', sample: 'VII Sem' },
                ],
              },
              {
                title: 'Team & Squad Roster',
                tokens: [
                  { token: '{{team.name}}', label: 'Team / Squad Name', sample: 'Nexus Innovators' },
                  { token: '{{team.size}}', label: 'Total Team Size', sample: '3 Members' },
                  { token: '{{team.membersList}}', label: 'Full Team Member List', sample: 'Aarav (Lead), Tanvi, Rohan' },
                ],
              },
              {
                title: 'Competition Track',
                tokens: [
                  { token: '{{competition.name}}', label: 'Competition Name', sample: 'Project Competition' },
                  { token: '{{competition.venue}}', label: 'Venue Room / Lab', sample: 'PCE Campus, Nagpur' },
                  { token: '{{competition.date}}', label: 'Festival Date', sample: '21 October 2026' },
                ],
              },
              {
                title: 'Payment Settlement',
                tokens: [
                  { token: '{{payment.status}}', label: 'Verified Status', sample: 'Verified' },
                  { token: '{{payment.fee}}', label: 'Registration Fee', sample: '₹300 / Team' },
                  { token: '{{payment.id}}', label: 'UTR Transaction ID', sample: 'UPI482910482910' },
                ],
              },
              {
                title: 'Certificate Issuance',
                tokens: [
                  { token: '{{certificate.id}}', label: 'Certificate Code', sample: 'CERT-YUG-2026-9481' },
                  { token: '{{certificate.recipient}}', label: 'Awardee Name', sample: 'Aarav Deshmukh' },
                  { token: '{{certificate.rank}}', label: 'Achievement Award', sample: '1st Place Winner' },
                ],
              },
            ].map((group, idx) => (
              <div
                key={idx}
                className="admin-glass-panel p-5 rounded-2xl border border-black/10 dark:border-white/10 space-y-3"
              >
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.tokens.map((t) => (
                    <div
                      key={t.token}
                      className="p-2.5 rounded-xl bg-slate-500/5 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {t.token}
                        </code>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.label}</div>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic max-w-[110px] truncate text-right">
                        e.g. {t.sample}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: CREDENTIAL ISSUANCE & RECORDS                           */}
      {/* ============================================================== */}
      {activeTab === 'issuance' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Section 1: 9 Arenas Credential Configuration Matrix */}
          <div className="admin-glass-panel rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Arena Credential Status &amp; Generation Matrix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect active pass and certificate templates, live generation status, and template versions for all 9 competition arenas.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                ● Live Generator Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3 px-3">Competition Arena</th>
                    <th className="py-3 px-3">Active Pass Template</th>
                    <th className="py-3 px-3">Active Cert Template</th>
                    <th className="py-3 px-3">Pass Gen</th>
                    <th className="py-3 px-3">Cert Gen</th>
                    <th className="py-3 px-3 text-right">Quick Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {COMPETITIONS.map((comp) => {
                    const passAssign = assignments.find(
                      (a) => a.competition_slug === comp.slug && a.document_type === 'registration_pass'
                    );
                    const certAssign = assignments.find(
                      (a) => a.competition_slug === comp.slug && a.document_type === 'participation_cert'
                    );
                    const passTpl = passAssign
                      ? templates.find((t) => t.id === passAssign.template_id)
                      : templates.find((t) => t.is_global && t.type === 'registration_pass');
                    const certTpl = certAssign
                      ? templates.find((t) => t.id === certAssign.template_id)
                      : templates.find((t) => t.is_global && t.type === 'participation_cert');

                    return (
                      <tr key={comp.slug} className="hover:bg-slate-500/5 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{comp.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{comp.slug}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {passTpl?.title || 'Global Registration Pass'}
                          </span>
                          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                            (v{passTpl?.version || 1})
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {certTpl?.title || 'Global Participation Certificate'}
                          </span>
                          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                            (v{certTpl?.version || 1})
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {passTpl && (
                              <button
                                type="button"
                                onClick={() => openPdfPreview(passTpl, comp.slug)}
                                className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[11px] font-mono font-medium transition cursor-pointer"
                              >
                                Pass PDF
                              </button>
                            )}
                            {certTpl && (
                              <button
                                type="button"
                                onClick={() => openPdfPreview(certTpl, comp.slug)}
                                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 text-[11px] font-mono font-medium transition cursor-pointer"
                              >
                                Cert PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Certificate Issuance Console */}
          <div className="admin-glass-panel rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Official Certificate Issuance Console
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Issue verifiable certificates with dynamic QR codes to confirmed participants or podium winners.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-500/10 border border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIssuanceMode('batch')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    issuanceMode === 'batch'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Batch from Registrations
                </button>
                <button
                  type="button"
                  onClick={() => setIssuanceMode('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    issuanceMode === 'custom'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Single / Custom Recipient
                </button>
              </div>
            </div>

            {/* Issuance Feedback Alert */}
            {issuanceMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{issuanceMessage}</span>
              </div>
            )}
            {issuanceError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{issuanceError}</span>
              </div>
            )}

            {/* Common Controls: Competition, Type, Citation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Competition Arena
                </label>
                <select
                  value={issuanceComp}
                  onChange={(e) => setIssuanceComp(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white bg-white dark:bg-neutral-900"
                >
                  {COMPETITIONS.map((c) => (
                    <option key={c.slug} value={c.slug} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Certificate Category
                </label>
                <select
                  value={issuanceCertType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIssuanceCertType(val);
                    if (val === 'participation_cert') setIssuanceCitation('Certificate of Participation');
                    else if (val === 'winner_cert') setIssuanceCitation('1st Place Winner');
                    else setIssuanceCitation('Certificate of Excellence');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white bg-white dark:bg-neutral-900"
                >
                  <option value="participation_cert" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">Participation Certificate</option>
                  <option value="winner_cert" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">Winner / Podium Certificate</option>
                  <option value="custom_cert" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">Custom Merit Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Award Citation Title
                </label>
                <input
                  type="text"
                  value={issuanceCitation}
                  onChange={(e) => setIssuanceCitation(e.target.value)}
                  placeholder="e.g. 1st Place Winner or Participation"
                  className="w-full px-3 py-2 text-xs rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Mode A: Batch Issuance from Confirmed Registrations */}
            {issuanceMode === 'batch' && (
              <div className="space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
                {/* Team Multi-Member Issuance Scope */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Multi-Member Team Issuance Policy
                    </span>
                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {issuanceTeamScope === 'individual_all' ? 'All Eligible Members' : 'Leaders Only'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      onClick={() => setIssuanceTeamScope('individual_all')}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                        issuanceTeamScope === 'individual_all'
                          ? 'bg-white dark:bg-neutral-900 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white/50 dark:bg-neutral-900/50 border-black/10 dark:border-white/10 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="teamScope"
                        checked={issuanceTeamScope === 'individual_all'}
                        onChange={() => setIssuanceTeamScope('individual_all')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Individual Member Certificates
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Issues a uniquely named, individual certificate to every team member + leader.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setIssuanceTeamScope('leaders_only')}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                        issuanceTeamScope === 'leaders_only'
                          ? 'bg-white dark:bg-neutral-900 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white/50 dark:bg-neutral-900/50 border-black/10 dark:border-white/10 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="teamScope"
                        checked={issuanceTeamScope === 'leaders_only'}
                        onChange={() => setIssuanceTeamScope('leaders_only')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Team Leader / Solo Only
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Issues 1 certificate per team to the registered leader or solo entrant.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Eligible Registrations ({availableRegistrations.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRegIds(availableRegistrations.map((r) => r.id))}
                      className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRegIds([])}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {availableRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                    No registrations found for this arena yet. You can use Single / Custom mode to issue directly.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 border border-black/10 dark:border-white/10 rounded-xl p-2 bg-slate-500/5">
                    {availableRegistrations.map((reg) => {
                      const isSelected = selectedRegIds.includes(reg.id);
                      const recipients = extractRecipientsFromRegistration(reg, issuanceTeamScope, issuanceCitation);

                      return (
                        <div
                          key={reg.id}
                          onClick={() => {
                            setSelectedRegIds((prev) =>
                              isSelected ? prev.filter((id) => id !== reg.id) : [...prev, reg.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 shadow-xs'
                              : 'hover:bg-slate-500/5 border-black/5 dark:border-white/5 bg-white/40 dark:bg-neutral-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div className="truncate">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {reg.leader_name}
                                </span>
                                {reg.team_name && (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px] ml-1.5">
                                    [{reg.team_name}]
                                  </span>
                                )}
                                <span className="text-slate-400 text-[10px] ml-2">
                                  · {reg.leader_college || 'PCE'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {reg.id.slice(0, 8)}
                            </span>
                          </div>

                          {/* Member Breakdown Preview */}
                          {recipients.length > 1 && (
                            <div className="mt-2 pl-6 pt-1.5 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                {recipients.length} Recipients:
                              </span>
                              {recipients.map((rec, rIdx) => (
                                <span
                                  key={rIdx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${
                                    rec.isLeader
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold'
                                      : 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
                                  }`}
                                >
                                  {rec.isLeader ? '👑 Leader: ' : '👤 '}
                                  {rec.recipientName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleIssueBatchCerts}
                    disabled={selectedRegIds.length === 0 || issuingLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {issuingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                    <span>
                      Issue Certificates ({selectedRegIds.length} Teams · {
                        availableRegistrations
                          .filter((r) => selectedRegIds.includes(r.id))
                          .reduce((sum, r) => sum + extractRecipientsFromRegistration(r, issuanceTeamScope, issuanceCitation).length, 0)
                      } Personalized Certs)
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode B: Single / Custom Recipient Issuance */}
            {issuanceMode === 'custom' && (
              <form onSubmit={handleIssueSingleCert} className="space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customRecipientName}
                      onChange={(e) => setCustomRecipientName(e.target.value)}
                      placeholder="e.g. Aarav Deshmukh"
                      className="w-full px-3 py-2 text-xs rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient College / Institute
                    </label>
                    <input
                      type="text"
                      value={customRecipientCollege}
                      onChange={(e) => setCustomRecipientCollege(e.target.value)}
                      placeholder="e.g. PCE Nagpur"
                      className="w-full px-3 py-2 text-xs rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recipient Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={customRecipientEmail}
                      onChange={(e) => setCustomRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={issuingLoading || !customRecipientName.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {issuingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                    <span>Issue Individual Certificate</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 3: Issued Credentials Registry & Audit Trail */}
          <div className="admin-glass-panel rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Official Credential Issuance Registry ({issuedCertificates.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Permanent audit log of issued certificates, verification tokens, assigned template versions, and revocation states.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCertificates}
                className="px-3 py-1.5 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Registry</span>
              </button>
            </div>

            {issuedCertificates.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
                No certificates have been issued yet. Use the console above to issue your first certificate!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-slate-400 font-mono uppercase text-[11px]">
                      <th className="py-3 px-3">Certificate ID</th>
                      <th className="py-3 px-3">Recipient</th>
                      <th className="py-3 px-3">Citation / Award</th>
                      <th className="py-3 px-3">Arena</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Issued Date</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {issuedCertificates.map((cert) => {
                      const isRevoked = Boolean(cert.revoked_at);
                      return (
                        <tr key={cert.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {cert.certificate_code}
                            <div className="text-[10px] text-slate-400 font-normal">v{cert.template_version}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{cert.recipient_name}</div>
                            <div className="text-[11px] text-slate-400">{cert.recipient_college || 'PCE Nagpur'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                            {cert.rank_citation}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {cert.competition_slug}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                                isRevoked
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              }`}
                            >
                              {isRevoked ? 'Revoked' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                            {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/api/certificate/${cert.certificate_code}/pdf`}
                                download={`YUGANTAR-2026-CERTIFICATE-${cert.certificate_code}.pdf`}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <Link
                                href={`/verify/${cert.certificate_code}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer"
                                title="Verify Live"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              {!isRevoked && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeCert(cert.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                                  title="Revoke Certificate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE TEMPLATE                                         */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="admin-glass-panel w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Design Template</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Delegate Pass or Ideathon Winner Certificate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="registration_pass">Registration Pass</option>
                    <option value="delegate_pass">Delegate Pass</option>
                    <option value="team_pass">Team Pass</option>
                    <option value="participation_cert">Participation Certificate</option>
                    <option value="winner_cert">Winner Certificate</option>
                    <option value="custom_cert">Custom Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paper Size
                  </label>
                  <select
                    value={newPaperSize}
                    onChange={(e) => setNewPaperSize(e.target.value as PaperSize)}
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="A5">A5 (148 × 210 mm)</option>
                    <option value="ID_BADGE">ID Badge (54 × 86 mm)</option>
                    <option value="CUSTOM">Custom Size</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOrientation('portrait')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      newOrientation === 'portrait'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'admin-glass-panel text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10'
                    }`}
                  >
                    Portrait (Vertical)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOrientation('landscape')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      newOrientation === 'landscape'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'admin-glass-panel text-slate-600 dark:text-slate-400 border-black/10 dark:border-white/10'
                    }`}
                  >
                    Landscape (Horizontal)
                  </button>
                </div>
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Clone from Existing (Optional)
                  </label>
                  <select
                    value={cloneFromId}
                    onChange={(e) => setCloneFromId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Start from clean canvas</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass-panel text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-black/10 dark:border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Open in Designer Canvas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LIVE PDF PREVIEW                                        */}
      {/* ============================================================== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="admin-glass-panel w-full max-w-4xl h-[90vh] rounded-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Live PDF Preview: {previewTemplate.title}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Compiled directly via vector PDF engine using official {previewTemplate.paper_size} {previewTemplate.orientation} specs
                  </div>
                </div>
              </div>

              {/* Competition Selector for Preview */}
              <div className="flex items-center gap-2">
                <select
                  value={previewCompSlug}
                  onChange={(e) => openPdfPreview(previewTemplate, e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg admin-glass-panel border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none"
                >
                  {COMPETITIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {previewPdfUrl && (
                  <a
                    href={previewPdfUrl}
                    download={`preview-${previewTemplate.title.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                    className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => {
                    setPreviewTemplate(null);
                    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / PDF Iframe */}
            <div className="flex-1 bg-slate-900 relative">
              {previewLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                  <span className="text-xs">Generating vector PDF preview...</span>
                </div>
              ) : previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  Could not load PDF preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
