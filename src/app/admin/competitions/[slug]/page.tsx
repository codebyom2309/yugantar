'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import CompetitionArtworkStudio from '@/components/admin/CompetitionArtworkStudio';
import CoordinatorManager from '@/components/admin/CoordinatorManager';
import AdminTimeRangePicker from '@/components/admin/AdminTimeRangePicker';
import AdminDatePicker from '@/components/admin/AdminDatePicker';
import LiveMobileFrame from '@/components/competitions/cards/LiveMobileFrame';
import { fetchClientFestivalData, clearClientFestivalCache } from '@/lib/client-festival-data';
import {
  Trophy,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Sliders,
  Sparkles,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Layers,
  HelpCircle,
  Award,
  ShieldCheck,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Info,
  Link2,
  QrCode,
  CreditCard,
  MessageCircle,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { buildUpiPaymentUri, extractNumericFee, isValidUpiId } from '@/lib/upiPayment';

interface Coordinator {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  display_order: number;
  is_public: number;
  is_active: number;
}

interface ScheduleItem {
  time: string;
  activity: string;
}

interface EvaluationCriterion {
  name: string;
  points: string | number;
}

interface EvaluationMatrix {
  totalPoints: string | number;
  criteria: EvaluationCriterion[];
}

interface FaqItem {
  question: string;
  answer: string;
}

interface CustomSectionItem {
  id: string;
  title: string;
  type: 'text' | 'bullets' | 'notice' | 'download';
  content?: string;
  items?: string[];
  fileUrl?: string;
  isVisible?: boolean;
}

export default function CompetitionEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Active Section ID (Organized by participant cards)
  const [activeSection, setActiveSection] = useState<string>('hero');

  // Mobile View Switcher (for small screens where split screen is hidden)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Competition Data State
  const [form, setForm] = useState({
    id: '',
    slug: '',
    name: '',
    category: '',
    district: '',
    districtIndex: 0,
    districtTagline: '',
    tag: '',
    shortDescription: '',
    fullDescription: '',
    about: '',
    venue: '',
    eligibility: '',
    teamSizeLimit: '',
    maxTeamMembers: 4,
    isIndividualOnly: false,
    isFixedSquad: false,
    theme: '',
    cardImage: '',
    bannerImage: '',
    iconName: '',
    displayOrder: 0,
    isPublished: 1,
    registrationOpen: 1,
    googleFormId: '',
    googleFormUrl: '',
    formResponseUrl: '',
    acknowledgmentEntryId: '',
    acknowledgmentLabel: '',
    formatNote: '',
    rulesPdfUrl: '',
    accentColor: '#3B82F6',
    accentSecondary: '#6366F1',
    accentBg: 'rgba(59, 130, 246, 0.1)',
    eventDate: '',
    venueDirections: '',
    registrationDeadline: '',
    registrationInstructions: '',
    minTeamMembers: 1,
    isPaid: false,
    registrationFee: 'Free',
    qrMode: 'generate' as 'upload' | 'generate',
    payeeName: 'TELE-ERA YUGANTAR 2026',
    qrCodeUrl: '',
    upiId: '',
    paymentUrl: '',
    paymentInstructions: '',
    requireUtr: false,
    requireScreenshot: false,
    isFeeFixed: true,
    showPaymentQr: true,
    whatsappLink: '',
    confirmationInstructions: '',
    passEnabled: true,
    certificateEnabled: true,
    allowedSemesters: [] as string[],
  });

  const [associatedSpreadsheet, setAssociatedSpreadsheet] = useState<{ id: string; display_name: string; spreadsheet_url: string } | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');
  const [previewParticipantFlow, setPreviewParticipantFlow] = useState(false);
  const [adminCopiedId, setAdminCopiedId] = useState(false);

  const [festivalDate, setFestivalDate] = useState('21 October 2026');

  const handleDownloadQrPng = () => {
    const dataUrl = form.qrMode === 'upload' ? form.qrCodeUrl : generatedQrDataUrl;
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `YUGANTAR-2026-QR-${slug.toUpperCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate dynamic QR preview whenever generate mode is active
  useEffect(() => {
    if (form.qrMode === 'generate' && form.upiId?.trim() && isValidUpiId(form.upiId.trim())) {
      const cleanFee = form.isFeeFixed !== false ? extractNumericFee(form.registrationFee) : undefined;
      const payee = form.payeeName?.trim() || 'TELE-ERA YUGANTAR 2026';
      const upiUri = buildUpiPaymentUri({
        upiId: form.upiId.trim(),
        payeeName: payee,
        amount: cleanFee,
        transactionNote: `${form.name || slug} Registration Fee`,
      });
      QRCode.toDataURL(upiUri, {
        width: 280,
        margin: 1,
        color: { dark: '#172B49', light: '#FFFFFF' },
      })
        .then(setGeneratedQrDataUrl)
        .catch(() => setGeneratedQrDataUrl(''));
    } else {
      setGeneratedQrDataUrl('');
    }
  }, [form.qrMode, form.upiId, form.payeeName, form.registrationFee, form.isFeeFixed, form.name, slug]);

  // Dynamic Lists State
  const [scheduleFlow, setScheduleFlow] = useState<ScheduleItem[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [expectations, setExpectations] = useState<string[]>([]);
  const [approvedDomains, setApprovedDomains] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [customSections, setCustomSections] = useState<CustomSectionItem[]>([]);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    registration: true,
    about: true,
    schedule: true,
    rubric: true,
    rules: true,
    expectations: true,
    faqs: true,
    dossier: true,
    coordinators: true,
    custom: true,
  });

  const [evaluationMatrix, setEvaluationMatrix] = useState<EvaluationMatrix>({
    totalPoints: '100',
    criteria: [],
  });

  // Coordinators State
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [registrationCount, setRegistrationCount] = useState(0);

  // New domain input buffer
  const [newDomainText, setNewDomainText] = useState('');

  const fetchCompetition = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/competitions/${slug}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to load competition');
      }

      const c = data.competition;
      setForm({
        id: c.id,
        slug: c.slug,
        name: c.name || '',
        category: c.category || '',
        district: c.district || '',
        districtIndex: c.district_index || 0,
        districtTagline: c.district_tagline || '',
        tag: c.tag || '',
        shortDescription: c.short_description || '',
        fullDescription: c.full_description || '',
        about: c.about || '',
        venue: c.venue || '',
        eligibility: c.eligibility || '',
        teamSizeLimit: c.team_size_limit || '',
        maxTeamMembers: c.max_team_members || 4,
        isIndividualOnly: Boolean(c.is_individual_only),
        isFixedSquad: Boolean(c.is_fixed_squad),
        theme: c.theme || '',
        cardImage: c.card_image || '',
        bannerImage: c.banner_image || '',
        iconName: c.icon_name || '',
        displayOrder: c.display_order || 0,
        isPublished: c.is_published,
        registrationOpen: c.registration_open,
        googleFormId: c.google_form_id || '',
        googleFormUrl: c.google_form_url || '',
        formResponseUrl: c.form_response_url || '',
        acknowledgmentEntryId: c.acknowledgment_entry_id || '',
        acknowledgmentLabel: c.acknowledgment_label || '',
        formatNote: c.format_note || '',
        rulesPdfUrl: c.rules_pdf_url || '',
        accentColor: c.accent_color || '#3B82F6',
        accentSecondary: c.accent_secondary || '#6366F1',
        accentBg: c.accent_bg || 'rgba(59, 130, 246, 0.1)',
        eventDate: c.event_date || '',
        venueDirections: c.venue_directions || '',
        registrationDeadline: c.registration_deadline || '',
        registrationInstructions: c.registration_instructions || '',
        minTeamMembers: c.min_team_members || 1,
        isPaid: Boolean(c.is_paid),
        registrationFee: c.registration_fee || 'Free',
        qrMode: c.qr_mode || (c.qr_code_url ? 'upload' : 'generate'),
        payeeName: c.payee_name || 'TELE-ERA YUGANTAR 2026',
        qrCodeUrl: c.qr_code_url || '',
        upiId: c.upi_id || '',
        paymentUrl: c.payment_url || '',
        paymentInstructions: c.payment_instructions || '',
        requireUtr: Boolean(c.require_utr),
        requireScreenshot: Boolean(c.require_screenshot),
        isFeeFixed: c.is_fee_fixed !== undefined && c.is_fee_fixed !== null ? Boolean(c.is_fee_fixed) : true,
        showPaymentQr: c.show_payment_qr !== undefined && c.show_payment_qr !== null ? Boolean(c.show_payment_qr) : true,
        whatsappLink: c.whatsapp_link || '',
        confirmationInstructions: c.confirmation_instructions || '',
        passEnabled: c.pass_enabled !== undefined && c.pass_enabled !== null ? Boolean(c.pass_enabled) : true,
        certificateEnabled: c.certificate_enabled !== undefined && c.certificate_enabled !== null ? Boolean(c.certificate_enabled) : true,
        allowedSemesters: Array.isArray(c.allowed_semesters)
          ? c.allowed_semesters
          : typeof c.allowed_semesters === 'string'
          ? JSON.parse(c.allowed_semesters || '[]')
          : [],
      });

      // Fetch linked spreadsheet from Spreadsheet Manager for this track
      fetch(`/api/admin/spreadsheets?competition=${c.slug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.spreadsheets && data.spreadsheets.length > 0) {
            setAssociatedSpreadsheet(data.spreadsheets[0]);
          }
        })
        .catch(() => {});

      // Load authoritative festival date for inheritance display
      fetchClientFestivalData()
        .then((d) => {
          if (d.festival?.date) setFestivalDate(d.festival.date);
        })
        .catch(() => {});

      const parseSafe = (val: unknown, fallback: unknown) => {
        if (!val) return fallback;
        if (typeof val === 'object') return val;
        try {
          return JSON.parse(val as string);
        } catch {
          return fallback;
        }
      };

      setScheduleFlow(parseSafe(c.schedule_flow, []));
      setRules(parseSafe(c.rules, []));
      setHighlights(parseSafe(c.highlights, []));
      setExpectations(parseSafe(c.expectations, []));
      setApprovedDomains(parseSafe(c.approved_domains, []));
      setFaqs(parseSafe(c.faqs, []));
      setCustomSections(parseSafe(c.custom_sections, []));
      setSectionVisibility(
        parseSafe(c.section_visibility, {
          hero: true,
          registration: true,
          about: true,
          schedule: true,
          rubric: true,
          rules: true,
          expectations: true,
          faqs: true,
          dossier: true,
          coordinators: true,
          custom: true,
        })
      );
      setEvaluationMatrix(parseSafe(c.evaluation_matrix, { totalPoints: '100', criteria: [] }));

      setCoordinators(data.coordinators || []);
      setRegistrationCount(data.registrationCount || 0);
      setIsDirty(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading track');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetition();
  }, [slug]);

  // Mark form dirty when fields change
  const updateFormField = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityId', slug);
      fd.append('role', 'payment_qr');
      fd.append('entityType', 'competition');
      fd.append('altText', `${slug} payment QR code`);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to upload QR image');
      }
      updateFormField('qrCodeUrl', data.asset.url);
    } catch (err: any) {
      alert(`QR upload failed: ${err.message}`);
    } finally {
      setUploadingQr(false);
      e.target.value = '';
    }
  };

  const toggleSectionVisibility = (secKey: string) => {
    setSectionVisibility((prev) => {
      const updated = { ...prev, [secKey]: prev[secKey] === false ? true : false };
      setIsDirty(true);
      return updated;
    });
  };

  const handleSave = async (publishState?: number) => {
    setSaving(true);
    setSavedMessage(null);
    setError(null);

    const isPublished = publishState !== undefined ? publishState : form.isPublished;

    // Guard: Prevent publishing paid track with incomplete configuration
    if (isPublished === 1 && form.isPaid) {
      const fee = form.registrationFee?.trim();
      if (!fee || fee.toLowerCase() === 'free') {
        setError('Cannot publish paid competition without specifying a registration fee.');
        setSaving(false);
        return;
      }
      if (form.qrMode === 'upload' && !form.qrCodeUrl?.trim()) {
        setError('Cannot publish paid competition in "Upload QR" mode without uploading a QR image.');
        setSaving(false);
        return;
      }
      if (form.qrMode === 'generate' && !form.upiId?.trim()) {
        setError('Cannot publish paid competition in "Generate QR" mode without configuring a valid UPI ID.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        ...form,
        isPublished,
        scheduleFlow,
        rules,
        highlights,
        expectations,
        evaluationMatrix,
        approvedDomains,
        faqs,
        customSections,
        sectionVisibility,
      };

      const res = await fetch(`/api/admin/competitions/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save competition');
      }

      clearClientFestivalCache();
      setForm((p) => ({ ...p, isPublished }));
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      setIsDirty(false);
      setSavedMessage(
        isPublished === 1
          ? `Published live to public website at ${timeStr}`
          : `Draft saved safely at ${timeStr}`
      );
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Participant-facing sections manifest
  const SECTIONS = [
    {
      id: 'hero',
      number: '01',
      title: 'Overview / Hero Card',
      subtitle: 'Official title, category, arena district, metadata pills, and 16:9 banner.',
      required: true,
      isComplete: Boolean(form.name && form.districtTagline && form.bannerImage),
    },
    {
      id: 'registration',
      number: '02',
      title: 'Registration Call to Action',
      subtitle: 'Registration status, active badge, call to action button, and Google Form links.',
      required: true,
      isComplete: form.registrationOpen !== undefined,
    },
    {
      id: 'about',
      number: '03',
      title: 'About the Competition',
      subtitle: 'Core description, format note, approved technical domains, and highlights.',
      required: true,
      isComplete: Boolean(form.about && form.formatNote),
    },
    {
      id: 'schedule',
      number: '04',
      title: 'Event Flow & Schedule',
      subtitle: 'Timed schedule items, activities, and reporting times on competition day.',
      required: false,
      isComplete: scheduleFlow.length > 0,
    },
    {
      id: 'rubric',
      number: '05',
      title: 'Official Evaluation Rubric',
      subtitle: 'Judging criteria points, weights, and total scoring matrix.',
      required: false,
      isComplete: evaluationMatrix?.criteria?.length > 0,
    },
    {
      id: 'rules',
      number: '06',
      title: 'Rules & Guidelines',
      subtitle: 'Numbered authoritative rules and downloadable official PDF document.',
      required: true,
      isComplete: rules.length > 0,
    },
    {
      id: 'expectations',
      number: '07',
      title: 'Participant Expectations & Conduct',
      subtitle: 'Numbered conduct requirements, hardware setup, and viva demonstration steps.',
      required: false,
      isComplete: expectations.length > 0,
    },
    {
      id: 'faqs',
      number: '08',
      title: 'Frequently Asked Questions',
      subtitle: 'Competition-specific questions and authoritative participant answers.',
      required: false,
      isComplete: faqs.length > 0,
    },
    {
      id: 'dossier',
      number: '09',
      title: 'Competition Dossier (Logistics)',
      subtitle: 'Quick logistics sidebar with venue, eligibility, team format, and event date.',
      required: true,
      isComplete: Boolean(form.venue && form.eligibility && form.teamSizeLimit),
    },
    {
      id: 'coordinators',
      number: '10',
      title: `Track Coordinators (${coordinators.length})`,
      subtitle: 'Assigned student & faculty coordinators with portraits, contact pills, and roles.',
      required: false,
      isComplete: coordinators.length > 0,
    },
    {
      id: 'custom',
      number: '11',
      title: `Custom Content Blocks (${customSections.length})`,
      subtitle: 'Extensible content cards: notices, submission checklists, and downloadable resources.',
      required: false,
      isComplete: customSections.length > 0,
    },
    {
      id: 'settings',
      number: '12',
      title: 'Governance & Document Switches',
      subtitle: 'Pass & Certificate Generation, Team Size Limits, Eligibility, and Section Visibility.',
      required: true,
      isComplete: true,
    },
  ];

  const currentSectionMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 admin-glass-panel rounded-xl" />
        <div className="h-96 admin-glass-panel rounded-2xl" />
      </div>
    );
  }

  // Prepared data for mobile preview
  const previewData = {
    ...form,
    eventDate: form.eventDate || festivalDate,
    registrationOpen: form.registrationOpen,
    scheduleFlow,
    rules,
    highlights,
    expectations,
    approvedDomains,
    faqs,
    customSections,
    evaluationMatrix,
    sectionVisibility,
  };

  return (
    <div className="space-y-6 pb-20">
      {/* =========================================================================
          TOP BAR: TITLE, STATUS & GLOBAL ACTIONS
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mb-1.5">
            <Link
              href="/admin/competitions"
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Competitions
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-800 dark:text-zinc-300 font-semibold">{form.slug}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-blue-500 shrink-0" />
              <span>{form.name || 'Edit Competition'}</span>
            </h1>

            {/* Publication Status Badge */}
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-bold ${
                form.isPublished === 1
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border-black/10 dark:border-white/10'
              }`}
            >
              {form.isPublished === 1 ? '● Live on Site' : '○ Draft Only'}
            </span>

            {/* Registration Status Badge */}
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-bold ${
                form.registrationOpen === 1
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}
            >
              {form.registrationOpen === 1 ? 'Reg Active' : 'Reg Closed'}
            </span>

            {/* Dirty Changes Badge */}
            {isDirty && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse font-bold">
                Unsaved changes
              </span>
            )}

            {lastSavedTime && !isDirty && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                Last saved {lastSavedTime}
              </span>
            )}
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live participant link */}
          <Link
            href={`/competitions/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl admin-glass-panel text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            <span>View Public Page</span>
          </Link>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={() => handleSave(0)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl admin-glass-panel text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors cursor-pointer disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {/* Publish Changes Button */}
          <button
            type="button"
            onClick={() => handleSave(1)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{savedMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible on < xl screens) */}
      <div className="xl:hidden flex rounded-xl bg-slate-200 dark:bg-white/10 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 rounded-lg text-center transition-all ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          Card Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'preview'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
          <span>Live Mobile Preview</span>
        </button>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE: SPLIT SCREEN (EDITOR ON LEFT, LIVE PREVIEW ON RIGHT)
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* =======================================================================
            LEFT COLUMN: PARTICIPANT CARD SELECTOR & CARD EDITOR
            ======================================================================= */}
        <div
          className={`xl:col-span-7 2xl:col-span-8 space-y-6 ${
            mobileTab === 'preview' ? 'hidden xl:block' : 'block'
          }`}
        >
          {/* Card Navigation Pills / Selector */}
          <div className="admin-glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Select Participant Card to Edit</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                12 Operational Sections
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                const isVisible = sectionVisibility[sec.id] !== false;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-1 ring-blue-500/20 dark:bg-blue-500/25 dark:text-blue-300 dark:border-blue-500/50'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`font-bold ${isActive ? 'text-white/90 dark:text-blue-200' : 'opacity-70'}`}>
                        {sec.number}
                      </span>
                      <div className="flex items-center gap-1">
                        {isVisible ? (
                          <span title="Visible on public page">
                            <Eye className={`w-3 h-3 ${isActive ? 'text-white dark:text-emerald-400' : 'text-emerald-500'}`} />
                          </span>
                        ) : (
                          <span title="Hidden on public page">
                            <EyeOff className={`w-3 h-3 ${isActive ? 'text-white/70 dark:text-slate-400' : 'text-slate-400'}`} />
                          </span>
                        )}
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sec.isComplete ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          title={sec.isComplete ? 'Section complete' : 'Needs content'}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-semibold truncate leading-tight block ${isActive ? 'text-white dark:text-blue-100' : ''}`}>
                      {sec.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Explainer Header */}
          <div className="admin-glass-panel rounded-2xl p-5 border-l-4 border-l-blue-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-500">
                  SECTION {currentSectionMeta.number}
                </span>
                <span className="text-slate-400">·</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentSectionMeta.title}
                </h2>
                {currentSectionMeta.required ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-slate-500 dark:text-zinc-400">
                    Optional
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                {currentSectionMeta.subtitle}
              </p>
            </div>

            {/* Section Visibility Switch */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/10">
              <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                Show on public website:
              </span>
              <button
                type="button"
                onClick={() => toggleSectionVisibility(activeSection)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sectionVisibility[activeSection] !== false
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-zinc-400 border border-black/10 dark:border-white/10'
                }`}
              >
                {sectionVisibility[activeSection] !== false ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hidden</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =======================================================================
              CARD SPECIFIC EDITORS
              ======================================================================= */}

          {/* 1. HERO CARD EDITOR */}
          {activeSection === 'hero' && (
            <div className="space-y-6">
              <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white pb-2 border-b border-black/5 dark:border-white/10">
                  Primary Competition Identity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Card Heading (Competition Name) *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      placeholder="e.g. Project Competition"
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Renders as the main title header on the public website.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Category Track *
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => updateFormField('category', e.target.value)}
                      placeholder="e.g. Hardware & Circuits"
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      District / Arena Name *
                    </label>
                    <input
                      type="text"
                      value={form.district}
                      onChange={(e) => updateFormField('district', e.target.value)}
                      placeholder="e.g. Innovation District"
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Arena Index (0 to 7)
                    </label>
                    <input
                      type="number"
                      value={form.districtIndex}
                      onChange={(e) => updateFormField('districtIndex', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Displays as ARENA 0{form.districtIndex + 1} badge.
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      District Quote / Short Subtitle *
                    </label>
                    <textarea
                      rows={2}
                      value={form.districtTagline}
                      onChange={(e) => updateFormField('districtTagline', e.target.value)}
                      placeholder="The epicenter of applied hardware, embedded architectures, and operational engineering prototypes."
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* 16:9 Banner and Thumbnail Studio */}
              <CompetitionArtworkStudio
                slug={slug}
                cardImage={form.cardImage}
                bannerImage={form.bannerImage}
                onChangeCardImage={(url) => updateFormField('cardImage', url)}
                onChangeBannerImage={(url) => updateFormField('bannerImage', url)}
              />
            </div>
          )}

          {/* 2. REGISTRATION CTA CARD EDITOR */}
          {activeSection === 'registration' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white pb-2 border-b border-black/5 dark:border-white/10">
                Registration Card &amp; Form Pipeline
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Registration Portal Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateFormField('registrationOpen', 1)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        form.registrationOpen === 1
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'admin-glass-panel text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      ● Registration Open (Accepting Submissions)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormField('registrationOpen', 0)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        form.registrationOpen === 0
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'admin-glass-panel text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      ○ Closed
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Custom Button Text
                    </label>
                    <input
                      type="text"
                      value={form.acknowledgmentLabel}
                      onChange={(e) => updateFormField('acknowledgmentLabel', e.target.value)}
                      placeholder="e.g. Proceed to Registration"
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Google Form Sync ID
                    </label>
                    <input
                      type="text"
                      value={form.googleFormId}
                      onChange={(e) => updateFormField('googleFormId', e.target.value)}
                      placeholder="e.g. 1FAIpQLSc..."
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Google Form URL
                    </label>
                    <input
                      type="text"
                      value={form.googleFormUrl}
                      onChange={(e) => updateFormField('googleFormUrl', e.target.value)}
                      placeholder="https://docs.google.com/forms/d/e/..."
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Live Form Response / Webhook URL
                    </label>
                    <input
                      type="text"
                      value={form.formResponseUrl}
                      onChange={(e) => updateFormField('formResponseUrl', e.target.value)}
                      placeholder="https://docs.google.com/forms/u/0/d/e/.../formResponse"
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Registration Submission Deadline
                    </label>
                    <input
                      type="text"
                      value={form.registrationDeadline}
                      onChange={(e) => updateFormField('registrationDeadline', e.target.value)}
                      placeholder="e.g. 2026-10-18 23:59:00"
                      className="w-full px-3 py-2.5 rounded-xl admin-glass-panel font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Submissions will be automatically rejected by the server after this deadline.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Registration Instructions (Delegates)
                    </label>
                    <textarea
                      rows={2}
                      value={form.registrationInstructions}
                      onChange={(e) => updateFormField('registrationInstructions', e.target.value)}
                      placeholder="e.g. Keep your project synopsis PDF and payment UTR ready before proceeding..."
                      className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Associated Response Spreadsheet */}
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-sky-900 dark:text-sky-200 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <FileSpreadsheet className="w-4 h-4 text-sky-500" />
                      <span>Associated Response Spreadsheet</span>
                    </span>
                    <Link
                      href="/admin/spreadsheets"
                      className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Manage All Links</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {associatedSpreadsheet ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate text-xs">
                          {associatedSpreadsheet.display_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 truncate block">
                          {associatedSpreadsheet.spreadsheet_url}
                        </span>
                      </div>
                      <a
                        href={associatedSpreadsheet.spreadsheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold shrink-0 transition"
                      >
                        <span>Open Sheet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      No response spreadsheet mapped yet for this competition track. You can add one in the Spreadsheet Manager.
                    </p>
                  )}
                </div>

                {/* Payment Configuration Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#E07A43]" />
                      <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-900 dark:text-white">
                        Payment &amp; Fees Configuration
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewParticipantFlow(!previewParticipantFlow)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{previewParticipantFlow ? 'Hide Participant Preview' : 'Live Participant Flow Preview'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormField('isPaid', !form.isPaid)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          form.isPaid
                            ? 'bg-[#E07A43] text-white shadow-2xs'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {form.isPaid ? '● Paid Competition' : '○ Free Competition'}
                      </button>
                    </div>
                  </div>

                  {/* Actionable Warning if Paid Mode is Active with Incomplete Configuration */}
                  {form.isPaid && (!form.registrationFee || form.registrationFee === 'Free' || (form.qrMode === 'upload' && !form.qrCodeUrl) || (form.qrMode === 'generate' && !form.upiId) || (form.qrMode === 'generate' && form.upiId && !isValidUpiId(form.upiId.trim()))) && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block uppercase tracking-wider text-[11px]">Action Required: Incomplete Payment Configuration</span>
                        <p className="text-[11px] leading-relaxed">
                          {!form.registrationFee || form.registrationFee === 'Free'
                            ? 'Please specify the registration fee amount.'
                            : form.qrMode === 'upload' && !form.qrCodeUrl
                            ? 'Option 1 (Upload QR) is active, but no QR image has been uploaded or specified.'
                            : !form.upiId
                            ? 'Option 2 (Generate QR) is active, but no UPI ID has been configured.'
                            : 'Option 2 (Generate QR) has an invalid UPI ID format. Expected standard handle like username@bank.'}
                          {' '}Publication to the live website will be blocked until complete.
                        </p>
                      </div>
                    </div>
                  )}

                  {form.isPaid ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs">
                            Registration Fee Display (INR) *
                          </label>
                          <input
                            type="text"
                            value={form.registrationFee}
                            onChange={(e) => updateFormField('registrationFee', e.target.value)}
                            placeholder="e.g. ₹300 per team, ₹100 per person"
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs">
                            Recipient / Official Payee Name *
                          </label>
                          <input
                            type="text"
                            value={form.payeeName}
                            onChange={(e) => updateFormField('payeeName', e.target.value)}
                            placeholder="e.g. TELE-ERA YUGANTAR 2026"
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs">
                            Payment Instructions for Delegates
                          </label>
                          <input
                            type="text"
                            value={form.paymentInstructions}
                            onChange={(e) => updateFormField('paymentInstructions', e.target.value)}
                            placeholder="e.g. Mention Team Name in payment notes / remark"
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs">
                            Direct Payment Portal / External URL (Optional)
                          </label>
                          <input
                            type="text"
                            value={form.paymentUrl}
                            onChange={(e) => updateFormField('paymentUrl', e.target.value)}
                            placeholder="https://... or upi://pay?pa=..."
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Payment QR Code: 2 Selectable Options */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                          <div>
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <QrCode className="w-4 h-4 text-blue-500" />
                              <span>Payment QR Delivery Method</span>
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Choose between uploading a custom bank QR code or generating an instant UPI QR code.
                            </span>
                          </div>

                          {/* Method Selector Tabs */}
                          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => updateFormField('qrMode', 'upload')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                                form.qrMode === 'upload'
                                  ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                              }`}
                            >
                              Option 1: Upload QR
                            </button>
                            <button
                              type="button"
                              onClick={() => updateFormField('qrMode', 'generate')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                                form.qrMode === 'generate'
                                  ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                              }`}
                            >
                              Option 2: Generate QR
                            </button>
                          </div>
                        </div>

                        {/* OPTION 1: Upload QR Image */}
                        {form.qrMode === 'upload' && (
                          <div className="space-y-3 animate-in fade-in duration-150">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              {form.qrCodeUrl ? (
                                <div className="space-y-2 shrink-0 text-center">
                                  <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white p-2 shadow-sm text-center">
                                    <img
                                      src={form.qrCodeUrl}
                                      alt="Payment QR Code preview"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleDownloadQrPng}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#10264A] text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 hover:bg-[#1A386B] transition shadow-2xs cursor-pointer"
                                  >
                                    <Download className="w-3 h-3 text-blue-400" />
                                    <span>Download QR (PNG)</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="w-36 h-36 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white dark:bg-neutral-900">
                                  <QrCode className="w-8 h-8 opacity-40 mb-1" />
                                  <span className="text-[10px] font-mono">No Image Uploaded</span>
                                </div>
                              )}

                              <div className="flex-1 space-y-2.5 w-full">
                                <div className="flex items-center gap-2">
                                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/10 hover:border-blue-500 cursor-pointer text-xs font-mono font-bold text-slate-700 dark:text-zinc-200 transition shadow-2xs">
                                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{uploadingQr ? 'Uploading QR...' : 'Upload QR Image'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleQrUpload}
                                      disabled={uploadingQr}
                                      className="hidden"
                                    />
                                  </label>
                                  {form.qrCodeUrl && (
                                    <button
                                      type="button"
                                      onClick={() => updateFormField('qrCodeUrl', '')}
                                      className="px-3 py-2 rounded-xl text-xs font-mono font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="url"
                                  value={form.qrCodeUrl}
                                  onChange={(e) => updateFormField('qrCodeUrl', e.target.value)}
                                  placeholder="Or paste QR Image URL..."
                                  className="w-full px-3 py-2 text-xs font-mono rounded-xl admin-glass-panel text-slate-900 dark:text-white"
                                />
                                <span className="text-[11px] text-slate-500 block">
                                  This exact uploaded image will be rendered on the participant payment step.
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* OPTION 2: Generate QR Code (Dynamic UPI) */}
                        {form.qrMode === 'generate' && (
                          <div className="space-y-4 animate-in fade-in duration-150">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              {generatedQrDataUrl ? (
                                <div className="space-y-2 shrink-0 text-center">
                                  <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white p-2 shadow-sm text-center">
                                    <img
                                      src={generatedQrDataUrl}
                                      alt="Dynamically Generated UPI QR Code"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 block">
                                      {form.isFeeFixed !== false ? `₹${extractNumericFee(form.registrationFee) || '0.00'}` : 'Custom Fee'} • {form.upiId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleDownloadQrPng}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#10264A] text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 hover:bg-[#1A386B] transition shadow-2xs cursor-pointer"
                                    >
                                      <Download className="w-3 h-3 text-blue-400" />
                                      <span>Download QR (PNG)</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-36 h-36 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/40 flex flex-col items-center justify-center text-amber-600 shrink-0 bg-white dark:bg-neutral-900 p-2 text-center">
                                  <QrCode className="w-8 h-8 opacity-40 mb-1" />
                                  <span className="text-[10px] font-mono leading-tight">
                                    {form.upiId && !isValidUpiId(form.upiId.trim())
                                      ? 'Invalid UPI format'
                                      : 'Enter UPI ID to generate'}
                                  </span>
                                </div>
                              )}

                              <div className="flex-1 space-y-3 w-full">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
                                    Official UPI ID / VPA *
                                  </label>
                                  <input
                                    type="text"
                                    value={form.upiId}
                                    onChange={(e) => updateFormField('upiId', e.target.value)}
                                    placeholder="e.g. poojakonge2727@oksbi or studentforum@icici"
                                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl admin-glass-panel text-slate-900 dark:text-white ${
                                      form.upiId && !isValidUpiId(form.upiId.trim())
                                        ? 'border-red-400 focus:border-red-500'
                                        : 'focus:border-blue-500'
                                    }`}
                                  />
                                  {form.upiId && !isValidUpiId(form.upiId.trim()) && (
                                    <p className="text-[11px] text-red-500 font-medium pt-0.5">
                                      ⚠️ Invalid UPI ID format. Expected standard handle like username@bank (e.g. poojakonge2727@oksbi).
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-1.5">
                                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs">
                                    Fee Amount Mode in UPI QR
                                  </label>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateFormField('isFeeFixed', true)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                                        form.isFeeFixed !== false
                                          ? 'bg-blue-600 text-white shadow-2xs'
                                          : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                                      }`}
                                    >
                                      Fixed Amount (₹{extractNumericFee(form.registrationFee) || '0.00'})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateFormField('isFeeFixed', false)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                                        form.isFeeFixed === false
                                          ? 'bg-blue-600 text-white shadow-2xs'
                                          : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                                      }`}
                                    >
                                      Editable (Payer enters amount)
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-slate-500 block">
                                    {form.isFeeFixed !== false
                                      ? 'Fixed mode locks the exact fee in UPI apps when scanned.'
                                      : 'Editable mode allows custom fee entry in UPI apps.'}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  Dynamic QR code is generated securely from recipient name (<code>{form.payeeName || 'TELE-ERA YUGANTAR 2026'}</code>), UPI ID, and amount. Delegates scanning with Google Pay, PhonePe, or Paytm will have the exact payee and fee prefilled.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Toggles: UTR, Screenshot, and QR Visibility */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/40 border border-black/5 dark:border-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.requireUtr}
                            onChange={(e) => updateFormField('requireUtr', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                            Require UTR / Transaction ID
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/40 border border-black/5 dark:border-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.requireScreenshot}
                            onChange={(e) => updateFormField('requireScreenshot', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                            Require Screenshot Upload
                          </span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/40 border border-black/5 dark:border-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.showPaymentQr !== false}
                            onChange={(e) => updateFormField('showPaymentQr', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                            Show Payment QR on Form
                          </span>
                        </label>
                      </div>

                      {/* Live Participant-Facing Payment Preview Drawer */}
                      {previewParticipantFlow && (
                        <div className="mt-4 p-4 sm:p-6 rounded-2xl bg-[#FFF8F2] dark:bg-neutral-900 border-2 border-[#FFE0CE] dark:border-amber-900/40 space-y-4 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between pb-3 border-b border-[#FFE0CE] dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#E07A43] text-white text-[10px] font-mono font-bold">
                                PARTICIPANT LIVE PREVIEW
                              </span>
                              <h4 className="text-xs font-mono font-bold text-[#172B49] dark:text-white uppercase tracking-wider">
                                Participant Payment Section Preview (5-Step Sequence)
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewParticipantFlow(false)}
                              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>

                          <div className="space-y-4 text-left">
                            {/* Step 1 Preview */}
                            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-[#DCE5F2] dark:border-neutral-700 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#172B49] dark:text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-[#E07A43] text-white flex items-center justify-center text-[10px]">1</span>
                                  Step 1: Payment Summary
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E07A43] text-white">
                                  {form.registrationFee || '₹300'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#60728A] dark:text-zinc-400">
                                {form.paymentInstructions || 'Scan official QR code or transfer via UPI ID. Enter UTR reference and screenshot.'}
                              </p>
                            </div>

                            {/* Step 2 Preview */}
                            {form.showPaymentQr !== false && (
                              <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-[#DCE5F2] dark:border-neutral-700 space-y-3">
                                <span className="text-xs font-bold text-[#172B49] dark:text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-[#10264A] text-white flex items-center justify-center text-[10px]">2</span>
                                  Step 2: Payment QR &amp; UPI
                                </span>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                  <div className="w-28 h-28 p-1 bg-white rounded-xl border border-[#DCE5F2] shrink-0 text-center">
                                    {(generatedQrDataUrl || form.qrCodeUrl) ? (
                                      <img
                                        src={form.qrMode === 'upload' && form.qrCodeUrl ? form.qrCodeUrl : generatedQrDataUrl}
                                        alt="Preview QR"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">QR Code</div>
                                    )}
                                  </div>
                                  <div className="space-y-1.5 flex-1 w-full text-xs">
                                    <div className="font-bold text-[#172B49] dark:text-white">{form.payeeName || 'Pooja Konge'}</div>
                                    <code className="text-[11px] font-mono text-[#3978F6] block">{form.upiId || 'poojakonge2727@oksbi'}</code>
                                    <div className="text-[10px] text-[#60728A] dark:text-zinc-400">
                                      Mode: {form.isFeeFixed !== false ? `Fixed (₹${extractNumericFee(form.registrationFee) || '0.00'})` : 'Editable Amount'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Step 3 Preview */}
                            {form.requireUtr && (
                              <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-[#DCE5F2] dark:border-neutral-700 space-y-1.5">
                                <span className="text-xs font-bold text-[#172B49] dark:text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-[#3978F6] text-white flex items-center justify-center text-[10px]">3</span>
                                  Step 3: UTR / Transaction Reference (12 Digits)
                                </span>
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-900 text-[11px] text-slate-500 font-mono">
                                  [Participant enters 12-digit UPI Transaction Ref ID]
                                </div>
                              </div>
                            )}

                            {/* Step 4 Preview */}
                            {form.requireScreenshot && (
                              <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-[#DCE5F2] dark:border-neutral-700 space-y-1.5">
                                <span className="text-xs font-bold text-[#172B49] dark:text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-[#9187DE] text-white flex items-center justify-center text-[10px]">4</span>
                                  Step 4: Payment Screenshot Upload Control
                                </span>
                                <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-neutral-700 text-center text-[11px] text-slate-500 font-mono">
                                  [Drag &amp; drop or tap to select screenshot image (Max 8MB)]
                                </div>
                              </div>
                            )}

                            {/* Step 5 Preview */}
                            <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-[#DCE5F2] dark:border-neutral-700 space-y-1.5">
                              <span className="text-xs font-bold text-[#172B49] dark:text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-md bg-[#10B981] text-white flex items-center justify-center text-[10px]">5</span>
                                Step 5: Review Dossier &amp; Submit Registration
                              </span>
                              <div className="text-[11px] text-slate-500 space-y-1">
                                <p>• Participant info cards, track specifics, and team roster summary.</p>
                                <p>• Audit status: <em>Awaiting coordinator banking audit before credential check-in.</em></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-300">
                      ✓ Free track configured. Payment step, QR code, UTR, and screenshot fields are completely omitted from the registration form and public delegate pass.
                    </div>
                  )}
                </div>

                {/* WhatsApp & Confirmation Experience Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/10">
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-900 dark:text-white">
                      WhatsApp Community &amp; Confirmation Experience
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                        Competition WhatsApp Group Link
                      </label>
                      <input
                        type="url"
                        value={form.whatsappLink}
                        onChange={(e) => updateFormField('whatsappLink', e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full px-3 py-2 rounded-xl admin-glass-panel font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[10px] text-slate-400">
                        Displayed as an action button on the registration pass and confirmation screen.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                        Post-Registration Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={form.confirmationInstructions}
                        onChange={(e) => updateFormField('confirmationInstructions', e.target.value)}
                        placeholder="e.g., Join the official WhatsApp group and download your official credential pass..."
                        className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. ABOUT THE COMPETITION CARD EDITOR */}
          {activeSection === 'about' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white pb-2 border-b border-black/5 dark:border-white/10">
                About Card Content
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Overview Paragraph (About) *
                  </label>
                  <textarea
                    rows={4}
                    value={form.about}
                    onChange={(e) => updateFormField('about', e.target.value)}
                    placeholder="Enter the comprehensive background, scope, and objectives of the competition..."
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Appears directly under the &ldquo;About the Competition&rdquo; card heading.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Competition Format Note *
                  </label>
                  <textarea
                    rows={2}
                    value={form.formatNote}
                    onChange={(e) => updateFormField('formatNote', e.target.value)}
                    placeholder="e.g. Single-round exhibition with live demonstration and 10-minute jury evaluation window."
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Approved Technical Domains */}
                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Approved Technical Domains (Tags)
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {approvedDomains.length} domains configured
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {approvedDomains.map((dom, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold flex items-center gap-1.5"
                      >
                        <span>{dom}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setApprovedDomains(approvedDomains.filter((_, idx) => idx !== i));
                            setIsDirty(true);
                          }}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newDomainText}
                      onChange={(e) => setNewDomainText(e.target.value)}
                      placeholder="Add domain tag (e.g. DSD, WSN, DSP, AI)..."
                      className="flex-1 px-3 py-1.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newDomainText.trim()) {
                            setApprovedDomains([...approvedDomains, newDomainText.trim()]);
                            setNewDomainText('');
                            setIsDirty(true);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newDomainText.trim()) {
                          setApprovedDomains([...approvedDomains, newDomainText.trim()]);
                          setNewDomainText('');
                          setIsDirty(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>

                {/* Mandatory Theme (if applicable) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Official Mandatory Theme (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.theme}
                    onChange={(e) => updateFormField('theme', e.target.value)}
                    placeholder="e.g. Electronic Waste & Sustainable Engineering (Leave empty if not applicable)"
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. EVENT FLOW & SCHEDULE EDITOR */}
          {activeSection === 'schedule' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                    Event Flow &amp; Schedule
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Configure the exact schedule items rendered in the participant schedule card.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleFlow([
                      ...scheduleFlow,
                      { time: '09:00 AM - 10:00 AM', activity: 'New scheduled session' },
                    ]);
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Schedule Item</span>
                </button>
              </div>

              {scheduleFlow.length === 0 ? (
                <div className="p-8 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-slate-500 dark:text-zinc-400">
                  <Clock className="w-8 h-8 text-blue-500/50 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-zinc-300">No schedule items added yet</p>
                  <p className="text-[11px] mt-1">Click &ldquo;Add Schedule Item&rdquo; above to create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduleFlow.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-500 text-[11px]">
                          ITEM #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Reorder Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const updated = [...scheduleFlow];
                              const temp = updated[idx - 1];
                              updated[idx - 1] = updated[idx];
                              updated[idx] = temp;
                              setScheduleFlow(updated);
                              setIsDirty(true);
                            }}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          {/* Reorder Down */}
                          <button
                            type="button"
                            disabled={idx === scheduleFlow.length - 1}
                            onClick={() => {
                              if (idx === scheduleFlow.length - 1) return;
                              const updated = [...scheduleFlow];
                              const temp = updated[idx + 1];
                              updated[idx + 1] = updated[idx];
                              updated[idx] = temp;
                              setScheduleFlow(updated);
                              setIsDirty(true);
                            }}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setScheduleFlow(scheduleFlow.filter((_, i) => i !== idx));
                              setIsDirty(true);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                            Time Window
                          </label>
                          <AdminTimeRangePicker
                            value={item.time}
                            onChange={(val) => {
                              const updated = [...scheduleFlow];
                              updated[idx].time = val;
                              setScheduleFlow(updated);
                              setIsDirty(true);
                            }}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                            Activity Description
                          </label>
                          <input
                            type="text"
                            value={item.activity}
                            onChange={(e) => {
                              const updated = [...scheduleFlow];
                              updated[idx].activity = e.target.value;
                              setScheduleFlow(updated);
                              setIsDirty(true);
                            }}
                            placeholder="e.g. Reporting & Setup: Teams arrive, verify registration..."
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. OFFICIAL EVALUATION RUBRIC EDITOR */}
          {activeSection === 'rubric' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                    Official Evaluation Rubric
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Define criteria names, points allocation, and total score.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentCriteria = evaluationMatrix?.criteria || [];
                    setEvaluationMatrix({
                      ...evaluationMatrix,
                      criteria: [...currentCriteria, { name: 'New Criterion', points: '20' }],
                    });
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Criterion</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 max-w-xs">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Total Maximum Points Label
                  </label>
                  <input
                    type="text"
                    value={evaluationMatrix?.totalPoints || ''}
                    onChange={(e) => {
                      setEvaluationMatrix({ ...evaluationMatrix, totalPoints: e.target.value });
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 100 Points"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Criteria Breakdown ({evaluationMatrix?.criteria?.length || 0})
                  </label>

                  {(!evaluationMatrix?.criteria || evaluationMatrix.criteria.length === 0) ? (
                    <div className="p-6 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-slate-500 dark:text-zinc-400">
                      No evaluation criteria configured yet.
                    </div>
                  ) : (
                    evaluationMatrix.criteria.map((crit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10"
                      >
                        <input
                          type="text"
                          value={crit.name}
                          onChange={(e) => {
                            const updated = [...evaluationMatrix.criteria];
                            updated[idx].name = e.target.value;
                            setEvaluationMatrix({ ...evaluationMatrix, criteria: updated });
                            setIsDirty(true);
                          }}
                          placeholder="Criterion name (e.g. Innovation & Hardware Rigor)"
                          className="flex-1 px-3 py-1.5 rounded-lg admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                        />
                        <input
                          type="text"
                          value={crit.points}
                          onChange={(e) => {
                            const updated = [...evaluationMatrix.criteria];
                            updated[idx].points = e.target.value;
                            setEvaluationMatrix({ ...evaluationMatrix, criteria: updated });
                            setIsDirty(true);
                          }}
                          placeholder="Points (e.g. 25)"
                          className="w-24 px-3 py-1.5 rounded-lg admin-glass-panel text-slate-900 dark:text-white font-mono text-center focus:outline-none focus:border-blue-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = evaluationMatrix.criteria.filter((_, i) => i !== idx);
                            setEvaluationMatrix({ ...evaluationMatrix, criteria: updated });
                            setIsDirty(true);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. RULES & REGULATIONS EDITOR */}
          {activeSection === 'rules' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                    Rules &amp; Regulations
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Authoritative rules list and official rules PDF link.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRules([...rules, '']);
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Official Rules PDF link */}
                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Downloadable Rules PDF URL (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={form.rulesPdfUrl}
                      onChange={(e) => updateFormField('rulesPdfUrl', e.target.value)}
                      placeholder="https://... or Google Drive / Filebase PDF link"
                      className="flex-1 px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    {form.rulesPdfUrl && (
                      <a
                        href={form.rulesPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/30 font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Individual Rules List */}
                <div className="space-y-2.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Rule Items ({rules.length})
                  </label>

                  {rules.length === 0 ? (
                    <div className="p-6 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-slate-500 dark:text-zinc-400">
                      No rules added yet. Click &ldquo;Add Rule&rdquo; above.
                    </div>
                  ) : (
                    rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10"
                      >
                        <span className="text-[11px] font-mono font-bold text-blue-500 mt-2 shrink-0">
                          {idx + 1}.
                        </span>
                        <textarea
                          rows={2}
                          value={rule}
                          onChange={(e) => {
                            const updated = [...rules];
                            updated[idx] = e.target.value;
                            setRules(updated);
                            setIsDirty(true);
                          }}
                          placeholder="Rule description..."
                          className="flex-1 px-3 py-1.5 rounded-lg admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRules(rules.filter((_, i) => i !== idx));
                            setIsDirty(true);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7. PARTICIPANT EXPECTATIONS & CONDUCT EDITOR */}
          {activeSection === 'expectations' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                    Participant Expectations &amp; Conduct
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Numbered guidelines rendered on the participant card.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExpectations([...expectations, '']);
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Expectation</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {expectations.length === 0 ? (
                  <div className="p-6 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-slate-500 dark:text-zinc-400">
                    No expectations added yet. Click &ldquo;Add Expectation&rdquo; above.
                  </div>
                ) : (
                  expectations.map((exp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10"
                    >
                      <span className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={exp}
                        onChange={(e) => {
                          const updated = [...expectations];
                          updated[idx] = e.target.value;
                          setExpectations(updated);
                          setIsDirty(true);
                        }}
                        placeholder="e.g. Bring and install a fully functional working hardware prototype on your display bench."
                        className="flex-1 px-3 py-2 rounded-lg admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setExpectations(expectations.filter((_, i) => i !== idx));
                          setIsDirty(true);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 8. FAQS EDITOR */}
          {activeSection === 'faqs' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                    Frequently Asked Questions
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Questions and answers specific to this competition track.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFaqs([...faqs, { question: '', answer: '' }]);
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ</span>
                </button>
              </div>

              <div className="space-y-3">
                {faqs.length === 0 ? (
                  <div className="p-6 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-slate-500 dark:text-zinc-400">
                    No FAQs added yet for this competition track.
                  </div>
                ) : (
                  faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-500 text-[11px]">
                          FAQ #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFaqs(faqs.filter((_, i) => i !== idx));
                            setIsDirty(true);
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[idx].question = e.target.value;
                            setFaqs(updated);
                            setIsDirty(true);
                          }}
                          placeholder="Question..."
                          className="w-full px-3 py-2 rounded-lg admin-glass-panel text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-blue-500 text-xs"
                        />
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[idx].answer = e.target.value;
                            setFaqs(updated);
                            setIsDirty(true);
                          }}
                          placeholder="Answer..."
                          className="w-full px-3 py-2 rounded-lg admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 9. COMPETITION DOSSIER (LOGISTICS) EDITOR */}
          {activeSection === 'dossier' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white pb-2 border-b border-black/5 dark:border-white/10">
                Competition Logistics &amp; Metadata
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Venue *
                  </label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => updateFormField('venue', e.target.value)}
                    placeholder="e.g. ETC Department Laboratories, PCE Campus"
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Room or laboratory location on campus.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Eligibility Criteria *
                  </label>
                  <input
                    type="text"
                    value={form.eligibility}
                    onChange={(e) => updateFormField('eligibility', e.target.value)}
                    placeholder="e.g. VII Semester Students Only"
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Team Size Limit Text *
                  </label>
                  <input
                    type="text"
                    value={form.teamSizeLimit}
                    onChange={(e) => updateFormField('teamSizeLimit', e.target.value)}
                    placeholder="e.g. Maximum 4 members per team"
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Max Team Members (Numeric Limit)
                  </label>
                  <input
                    type="number"
                    value={form.maxTeamMembers}
                    onChange={(e) => updateFormField('maxTeamMembers', Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Min Team Members
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.minTeamMembers}
                    onChange={(e) => updateFormField('minTeamMembers', Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Minimum required squad size for team entries.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                      Track Event Date
                    </label>
                    <span className="text-[10px] font-mono text-blue-500 font-bold">
                      {form.eventDate ? 'Explicit Override' : `Inherited (${festivalDate})`}
                    </span>
                  </div>
                  <AdminDatePicker
                    value={form.eventDate}
                    onChange={(display) => updateFormField('eventDate', display)}
                    festivalDate={festivalDate}
                    placeholder={`Inheriting from festival date: ${festivalDate}`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span>Leave blank to inherit official festival date automatically.</span>
                    {form.eventDate && (
                      <button
                        type="button"
                        onClick={() => updateFormField('eventDate', '')}
                        className="text-blue-500 hover:underline cursor-pointer font-semibold"
                      >
                        Clear (Inherit)
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Venue Directions &amp; Maps Link
                  </label>
                  <input
                    type="text"
                    value={form.venueDirections}
                    onChange={(e) => updateFormField('venueDirections', e.target.value)}
                    placeholder="e.g. https://maps.app.goo.gl/... or 2nd Floor, ETC Block"
                    className="w-full px-3 py-2.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Provides clickable directions link on the participant page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 10. TRACK COORDINATORS EDITOR */}
          {activeSection === 'coordinators' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-4">
              <div className="pb-2 border-b border-black/5 dark:border-white/10">
                <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                  Track Coordinators Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Student and faculty coordinators assigned to this track. Contacts are rendered publicly on participant cards.
                </p>
              </div>

              <CoordinatorManager
                slug={slug}
                coordinators={coordinators}
                onRefresh={fetchCompetition}
              />
            </div>
          )}

          {/* 11. CUSTOM CONTENT BLOCKS EDITOR */}
          {activeSection === 'custom' && (
            <div className="admin-glass-panel rounded-2xl p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm text-slate-900 dark:text-white">
                    Custom Content Blocks
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Add custom content sections: checklists, downloadable templates, and participant notices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newBlock: CustomSectionItem = {
                      id: `custom-${Date.now()}`,
                      title: 'Additional Guidelines',
                      type: 'text',
                      content: 'Enter detailed content here...',
                      isVisible: true,
                    };
                    setCustomSections([...customSections, newBlock]);
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              </div>

              {customSections.length === 0 ? (
                <div className="p-8 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-center text-slate-500 dark:text-zinc-400">
                  <p className="font-semibold text-slate-700 dark:text-zinc-300">No custom blocks added yet</p>
                  <p className="text-[11px] mt-1">
                    Standard sections (Hero, About, Schedule, Rules, etc.) cover all default needs. Add custom blocks if this competition requires unique instructions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-500 text-[11px]">
                          BLOCK #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...customSections];
                              updated[idx].isVisible = updated[idx].isVisible === false ? true : false;
                              setCustomSections(updated);
                              setIsDirty(true);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer ${
                              sec.isVisible !== false
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-black/5 dark:bg-white/10 text-slate-400'
                            }`}
                          >
                            {sec.isVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{sec.isVisible !== false ? 'Visible' : 'Hidden'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomSections(customSections.filter((_, i) => i !== idx));
                              setIsDirty(true);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                            Block Title
                          </label>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = [...customSections];
                              updated[idx].title = e.target.value;
                              setCustomSections(updated);
                              setIsDirty(true);
                            }}
                            placeholder="e.g. Deliverable Submission"
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                            Block Type
                          </label>
                          <select
                            value={sec.type}
                            onChange={(e) => {
                              const updated = [...customSections];
                              updated[idx].type = e.target.value as CustomSectionItem['type'];
                              setCustomSections(updated);
                              setIsDirty(true);
                            }}
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          >
                            <option value="text">Paragraph Text</option>
                            <option value="notice">Important Notice / Alert</option>
                            <option value="download">Downloadable Document / PDF</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                            Content Description
                          </label>
                          <textarea
                            rows={3}
                            value={sec.content || ''}
                            onChange={(e) => {
                              const updated = [...customSections];
                              updated[idx].content = e.target.value;
                              setCustomSections(updated);
                              setIsDirty(true);
                            }}
                            placeholder="Enter content details..."
                            className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                          />
                        </div>

                        {sec.type === 'download' && (
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                              Resource Download URL
                            </label>
                            <input
                              type="text"
                              value={sec.fileUrl || ''}
                              onChange={(e) => {
                                const updated = [...customSections];
                                updated[idx].fileUrl = e.target.value;
                                setCustomSections(updated);
                                setIsDirty(true);
                              }}
                              placeholder="https://... URL to document or asset"
                              className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================================
              SECTION 12: GOVERNANCE & DOCUMENT SWITCHES
              ======================================================================= */}
          {activeSection === 'settings' && (
            <div className="admin-glass-panel rounded-2xl p-5 sm:p-6 space-y-8 animate-in fade-in duration-200">
              {/* Section Header */}
              <div className="border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Sliders className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Document & Registration Governance</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold uppercase">
                        Master Controls
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Configure track-specific generation rules for passes and certificates, regulate registration constraints and team capacities, and manage public section displays.
                    </p>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------------
                  GROUP A: DOCUMENT GENERATION SWITCHES
                  ------------------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>Document Generation Switches</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Independent switches controlling real-time document rendering, PDF generation, and public participant downloads.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pass Generation Switch Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      form.passEnabled
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-rose-500/5 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Pass Generation
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              form.passEnabled
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {form.passEnabled ? 'ENABLED' : 'PAUSED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                          Controls whether digital delegate passes can be downloaded or generated for this track. When disabled, pass links and APIs reject generation requests while preserving all registrations, rosters, and payment statuses.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, passEnabled: !prev.passEnabled }));
                          setIsDirty(true);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          form.passEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                        }`}
                        role="switch"
                        aria-checked={form.passEnabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            form.passEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Certificate Generation Switch Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      form.certificateEnabled
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-rose-500/5 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Certificate Generation
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              form.certificateEnabled
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {form.certificateEnabled ? 'ENABLED' : 'PAUSED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                          Controls whether participation and merit certificates can be issued or downloaded for this track. Works completely independently from pass generation.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, certificateEnabled: !prev.certificateEnabled }));
                          setIsDirty(true);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          form.certificateEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                        }`}
                        role="switch"
                        aria-checked={form.certificateEnabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            form.certificateEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------------
                  GROUP B: TEAM PARTICIPATION CAPACITY & BOUNDARIES
                  ------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>Team Capacity & Participation Rules</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Regulates the number of delegates allowed per squad. Maximum team size directly controls the number of participant forms rendered during registration.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                      Min Team Members
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={form.minTeamMembers || 1}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(4, parseInt(e.target.value) || 1));
                        setForm((prev) => ({ ...prev, minTeamMembers: val }));
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                      Default: 1 (Leader)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                      Max Team Members
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={form.maxTeamMembers || 4}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(4, parseInt(e.target.value) || 4));
                        setForm((prev) => ({ ...prev, maxTeamMembers: val }));
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                      Restricts form inputs (1 to 4)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                      Team Capacity Headline
                    </label>
                    <input
                      type="text"
                      value={form.teamSizeLimit || ''}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, teamSizeLimit: e.target.value }));
                        setIsDirty(true);
                      }}
                      placeholder="e.g. 1 to 4 Members or Duo Only"
                      className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                      Public display badge text
                    </span>
                  </div>
                </div>

                {/* Team Form Behavior Callout */}
                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-700 dark:text-zinc-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                    <Info className="w-4 h-4" />
                    <span>How Team Limits Function:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                    Setting Max Team Members to <strong>{form.maxTeamMembers || 4}</strong> automatically configures the public registration form. If set to <strong>2</strong>, delegates can only register a Leader plus Member 2. Input sections for Members 3 and 4 are completely omitted from the registration view and rejected by the server.
                  </p>
                </div>
              </div>

              {/* -------------------------------------------------------------------
                  GROUP C: ACADEMIC ELIGIBILITY & SEMESTER RESTRICTIONS
                  ------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <span>Academic Eligibility & Semester Restrictions</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Enforce eligibility criteria and optionally restrict candidate enrollment to specific academic semesters.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                    Public Eligibility Description
                  </label>
                  <input
                    type="text"
                    value={form.eligibility || ''}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, eligibility: e.target.value }));
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Open to all engineering students or VII Semester students only"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                    Displayed on the public competition card overview
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                      Enforce Semester Eligibility
                    </label>
                    <span className="text-[10px] font-mono font-bold text-blue-500">
                      {form.allowedSemesters && form.allowedSemesters.length > 0
                        ? `Restricted to: ${form.allowedSemesters.join(', ')}`
                        : 'All Semesters Permitted (Default)'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Click semesters to toggle restriction. If none are selected, candidates from any semester may register. If specific semesters are selected (e.g. VII Semester), registration dropdowns and backend validation will strictly limit selection to only the permitted semesters.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((sem) => {
                      const isSelected = form.allowedSemesters?.includes(sem);
                      return (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => {
                            const current = form.allowedSemesters || [];
                            const updated = current.includes(sem)
                              ? current.filter((s) => s !== sem)
                              : [...current, sem];
                            setForm((prev) => ({ ...prev, allowedSemesters: updated }));
                            setIsDirty(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-500/20 dark:bg-blue-500/25 dark:text-blue-300 dark:border-blue-500/50'
                              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-slate-400 text-slate-700 dark:text-zinc-400'
                          }`}
                        >
                          Semester {sem}
                        </button>
                      );
                    })}

                    {form.allowedSemesters && form.allowedSemesters.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, allowedSemesters: [] }));
                          setIsDirty(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        Clear Restrictions
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------------
                  GROUP D: CONTENT SECTION VISIBILITY
                  ------------------------------------------------------------------- */}
              <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span>Public Section Visibility Switches</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Toggle individual participant cards on the public page without deleting any saved data.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'hero', name: 'Hero / Overview Banner' },
                    { id: 'registration', name: 'Registration Call to Action' },
                    { id: 'about', name: 'About & Challenge Brief' },
                    { id: 'schedule', name: 'Event Timeline & Schedule' },
                    { id: 'rubric', name: 'Evaluation Rubric & Matrix' },
                    { id: 'rules', name: 'Rules & Guidelines' },
                    { id: 'expectations', name: 'Participant Expectations' },
                    { id: 'faqs', name: 'Frequently Asked Questions' },
                    { id: 'dossier', name: 'Logistics Dossier' },
                    { id: 'coordinators', name: 'Track Coordinators' },
                    { id: 'custom', name: 'Custom Content Blocks' },
                  ].map((sec) => {
                    const isVisible = sectionVisibility[sec.id] !== false;
                    return (
                      <div
                        key={sec.id}
                        className="p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <span className="text-xs font-medium text-slate-900 dark:text-white truncate block">
                            {sec.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                            ID: {sec.id}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSectionVisibility((prev) => ({
                              ...prev,
                              [sec.id]: isVisible ? false : true,
                            }));
                            setIsDirty(true);
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isVisible ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                          }`}
                          role="switch"
                          aria-checked={isVisible}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isVisible ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =======================================================================
            RIGHT COLUMN: STICKY LIVE MOBILE CARD PREVIEW (ON WHITE #F8FAFD)
            ======================================================================= */}
        <div
          className={`xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-20 space-y-4 ${
            mobileTab === 'editor' ? 'hidden xl:block' : 'block'
          }`}
        >
          <LiveMobileFrame
            competition={previewData}
            coordinators={coordinators}
            activeSectionId={activeSection}
            activeSectionTitle={currentSectionMeta.title}
          />
        </div>
      </div>
    </div>
  );
}
