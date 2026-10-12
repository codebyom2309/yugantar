'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CompetitionArtworkStudio from '@/components/admin/CompetitionArtworkStudio';
import CoordinatorManager from '@/components/admin/CoordinatorManager';
import AdminTimeRangePicker from '@/components/admin/AdminTimeRangePicker';
import AdminDatePicker from '@/components/admin/AdminDatePicker';
import LiveMobileFrame from '@/components/competitions/cards/LiveMobileFrame';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import {
  Trophy,
  ArrowLeft,
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
} from 'lucide-react';

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
  });

  const [festivalDate, setFestivalDate] = useState('19 October 2026');

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
      });

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
                11 Public Sections
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
