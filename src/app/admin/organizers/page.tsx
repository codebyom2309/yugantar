'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  Award,
  Upload,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  GraduationCap,
  RotateCw,
  Smartphone,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { formatDriveUrl, isDriveUrl } from '@/lib/drive';
import PublicOrganizersPreview, {
  PublicOrgBody,
  PublicMember,
} from '@/components/organizers/PublicOrganizersPreview';
import {
  parseCropData,
  getCropImageStyle,
  getCropMaskClass,
  OrganizerCropData,
} from '@/lib/cropUtils';

export default function OrganizersPage() {
  const [activeTab, setActiveTab] = useState<'bodies' | 'turbo_bits' | 'faculty'>('bodies');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Organizing Bodies State
  const [organizers, setOrganizers] = useState<PublicOrgBody[]>([]);
  // Members State (Turbo Bits + Faculty)
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Organization
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<PublicOrgBody | null>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    role: '',
    department: '',
    description: '',
    badge: '',
    leadershipNote: '',
    logoUrl: '',
    displayOrder: 0,
    isPublished: 1,
  });

  // Modal State for Member (Turbo Bits / Faculty)
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<PublicMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: '',
    category: 'turbo_bits' as 'turbo_bits' | 'faculty' | 'core_committee',
    department: 'Department of Electronics & Telecommunication Engineering',
    bio: '',
    avatarUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    forumDesignation: '',
    cropData: '',
    displayOrder: 0,
    isPublished: 1,
    isLead: false,
  });

  // Public Order display toggle state
  const [showOrganizerOrder, setShowOrganizerOrder] = useState(false);
  const [togglingOrder, setTogglingOrder] = useState(false);

  // Crop Editor Modal State
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropShape, setCropShape] = useState<'circle' | 'square' | 'rounded'>('circle');
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, startX: 0, startY: 0 });

  // Upload & Drive State
  const [activePhotoTab, setActivePhotoTab] = useState<'upload' | 'drive'>('upload');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [driveInput, setDriveInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const fetchData = async () => {
    try {
      const [orgRes, memRes] = await Promise.all([
        fetch('/api/admin/organizers'),
        fetch('/api/admin/organizers/members'),
      ]);

      const orgData = await orgRes.json();
      const memData = await memRes.json();

      setOrganizers(orgData.organizers || []);
      setMembers(memData.members || []);
      if (orgData.showOrganizerOrder !== undefined) {
        setShowOrganizerOrder(Boolean(orgData.showOrganizerOrder));
      }
    } catch (err) {
      console.error('Failed to fetch organizers or members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowOrder = async (newValue: boolean) => {
    setTogglingOrder(true);
    setShowOrganizerOrder(newValue);
    try {
      await fetch('/api/admin/organizers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOrganizerOrder: newValue }),
      });
    } catch (err) {
      console.error('Failed to update showOrganizerOrder:', err);
    } finally {
      setTogglingOrder(false);
    }
  };

  const openCropModal = () => {
    if (!memberForm.avatarUrl) return;
    const c = parseCropData(memberForm.cropData);
    setCropZoom(c.zoom);
    setCropX(c.x);
    setCropY(c.y);
    setCropShape(c.shape);
    setShowCropModal(true);
  };

  const handleApplyCrop = () => {
    const data: OrganizerCropData = {
      zoom: Number(cropZoom.toFixed(2)),
      x: Math.round(cropX),
      y: Math.round(cropY),
      shape: cropShape,
    };
    setMemberForm((prev) => ({
      ...prev,
      cropData: JSON.stringify(data),
    }));
    setShowCropModal(false);
  };

  const handleResetCrop = () => {
    setCropZoom(1.0);
    setCropX(0);
    setCropY(0);
    setCropShape('circle');
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Organization Handlers ---
  const openCreateOrg = () => {
    setEditingOrg(null);
    setOrgForm({
      name: '',
      role: '',
      department: 'Department of Electronics & Telecommunication Engineering',
      description: '',
      badge: '',
      leadershipNote: '',
      logoUrl: '',
      displayOrder: organizers.length,
      isPublished: 1,
    });
    setDriveInput('');
    setErrorMsg(null);
    setShowOrgModal(true);
  };

  const openEditOrg = (org: PublicOrgBody) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      role: org.role,
      department: org.department,
      description: org.description,
      badge: org.badge,
      leadershipNote: org.leadership_note || org.leadershipNote || '',
      logoUrl: org.logo_url || org.logoUrl || '',
      displayOrder: (org as any).display_order || 0,
      isPublished: org.is_published !== undefined ? (Number(org.is_published) ? 1 : 0) : 1,
    });
    setDriveInput(org.logo_url || org.logoUrl || '');
    setErrorMsg(null);
    setShowOrgModal(true);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      if (editingOrg && editingOrg.id) {
        await fetch('/api/admin/organizers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingOrg.id, ...orgForm }),
        });
      } else {
        await fetch('/api/admin/organizers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orgForm),
        });
      }
      setShowOrgModal(false);
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!confirm('Are you sure you want to remove this organizing body?')) return;
    try {
      await fetch('/api/admin/organizers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };

  // --- Member Handlers ---
  const openCreateMember = (defaultCategory: 'turbo_bits' | 'faculty') => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      role: defaultCategory === 'turbo_bits' ? 'Student Lead' : 'Faculty Advisor',
      category: defaultCategory,
      department: 'Department of Electronics & Telecommunication Engineering',
      bio: '',
      avatarUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      forumDesignation: '',
      cropData: '',
      displayOrder: members.filter((m) => m.category === defaultCategory).length,
      isPublished: 1,
      isLead: false,
    });
    setDriveInput('');
    setErrorMsg(null);
    setShowMemberModal(true);
  };

  const openEditMember = (member: PublicMember) => {
    setEditingMember(member);
    const roleLower = (member.role || '').toLowerCase();
    const isLeadVal = Boolean((member as any).is_lead || roleLower.includes('lead') || roleLower.includes('head'));
    setMemberForm({
      name: member.name,
      role: member.role,
      category: member.category,
      department: member.department || 'Department of Electronics & Telecommunication Engineering',
      bio: member.bio || '',
      avatarUrl: member.avatar_url || '',
      githubUrl: member.github_url || member.githubUrl || '',
      linkedinUrl: member.linkedin_url || member.linkedinUrl || '',
      forumDesignation: (member as any).forum_designation || (member as any).forumDesignation || '',
      cropData: (member as any).crop_data || (member as any).cropData || '',
      displayOrder: member.display_order,
      isPublished: Number(member.is_published) ? 1 : 0,
      isLead: isLeadVal,
    });
    setDriveInput(member.avatar_url || '');
    setErrorMsg(null);
    setShowMemberModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      if (editingMember) {
        await fetch('/api/admin/organizers/members', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingMember.id, ...memberForm, isLead: memberForm.isLead ? 1 : 0 }),
        });
      } else {
        await fetch('/api/admin/organizers/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...memberForm, isLead: memberForm.isLead ? 1 : 0 }),
        });
      }
      setShowMemberModal(false);
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member profile?')) return;
    try {
      await fetch('/api/admin/organizers/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  };

  // Upload local media file
  const handleUploadPhoto = async (file: File, isLogo: boolean) => {
    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('entityId', 'organizers');
      fd.append('role', isLogo ? 'organizer_logo' : 'member_portrait');
      fd.append('entityType', 'organizer');
      fd.append('altText', isLogo ? `${orgForm.name || 'Organizer'} logo` : `${memberForm.name || 'Member'} portrait`);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upload failed');
      }

      if (isLogo) {
        setOrgForm((prev) => ({ ...prev, logoUrl: data.asset.url }));
      } else {
        setMemberForm((prev) => ({ ...prev, avatarUrl: data.asset.url }));
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDriveUrlSubmit = (isLogo: boolean) => {
    if (!driveInput.trim()) return;
    const directUrl = formatDriveUrl(driveInput);
    if (isLogo) {
      setOrgForm((prev) => ({ ...prev, logoUrl: directUrl }));
    } else {
      setMemberForm((prev) => ({ ...prev, avatarUrl: directUrl }));
    }
  };

  const turboBitsList = members.filter((m) => m.category === 'turbo_bits');
  const facultyList = members.filter((m) => m.category === 'faculty');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 admin-glass-panel rounded-xl" />
        <div className="h-96 admin-glass-panel rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-blue-500 shrink-0" />
            <span>Organizers &amp; Committees Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Manage institutional organizing bodies, faculty heads, and the Turbo Bits student team shown on the public About page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl admin-glass-panel text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-blue-500/40 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            <span>View Public About Page</span>
          </Link>
        </div>
      </div>

      {/* View Switcher: 3 Categories */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex p-1 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('bodies')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bodies'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Organizing Bodies ({organizers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('turbo_bits')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'turbo_bits'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Turbo Bits Student Team ({turboBitsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faculty')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'faculty'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Faculty Leadership ({facultyList.length})</span>
          </button>
        </div>

        {/* Public Order Display Setting Toggle */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl admin-glass-panel border border-black/10 dark:border-white/10 text-xs">
          <span className="text-slate-600 dark:text-zinc-300 font-medium">Public Order Labels (Order #):</span>
          <button
            type="button"
            disabled={togglingOrder}
            onClick={() => handleToggleShowOrder(!showOrganizerOrder)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showOrganizerOrder ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                showOrganizerOrder ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-zinc-300">
            {showOrganizerOrder ? 'Shown on About' : 'Hidden from About'}
          </span>
        </div>

        {/* Action Button */}
        {activeTab === 'bodies' && (
          <button
            type="button"
            onClick={openCreateOrg}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Organizing Body</span>
          </button>
        )}

        {activeTab === 'turbo_bits' && (
          <button
            type="button"
            onClick={() => openCreateMember('turbo_bits')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student Member</span>
          </button>
        )}

        {activeTab === 'faculty' && (
          <button
            type="button"
            onClick={() => openCreateMember('faculty')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Faculty Lead</span>
          </button>
        )}
      </div>

      {/* Mobile Tab Switcher (< xl screens) */}
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
          Editor Management
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

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Side: Editor List */}
        <div
          className={`xl:col-span-7 2xl:col-span-8 space-y-6 ${
            mobileTab === 'preview' ? 'hidden xl:block' : 'block'
          }`}
        >
          {/* TAB 1: ORGANIZING BODIES */}
          {activeTab === 'bodies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizers.map((org, idx) => {
                const logo = org.logo_url || org.logoUrl;
                const leadershipNote = org.leadership_note || org.leadershipNote;

                return (
                  <div
                    key={org.id ? `${org.id}-${idx}` : `${org.name}-${idx}`}
                    className="p-5 rounded-2xl admin-glass-panel border border-black/10 dark:border-white/10 space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {logo ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center p-1 shrink-0">
                            <Image
                              src={logo}
                              alt={org.name}
                              fill
                              className="object-contain p-1"
                              unoptimized={logo.startsWith('/api/') || logo.includes('google')}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                            0{idx + 1}
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {org.badge || 'Forum'}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                            {org.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-mono">
                            {org.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditOrg(org)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                          title="Edit organizing body"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {org.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOrg(org.id!)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete organizing body"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {org.description}
                    </p>

                    {leadershipNote && (
                      <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[11px] text-slate-600 dark:text-zinc-400">
                        <span className="font-bold text-slate-800 dark:text-zinc-300 block mb-0.5 text-[10px] uppercase font-mono">
                          Leadership Scope:
                        </span>
                        <p>{leadershipNote}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: TURBO BITS STUDENT TEAM (THE SIX MEMBERS) */}
          {activeTab === 'turbo_bits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-800 dark:text-zinc-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Turbo Bits Student Organizing Team ({turboBitsList.length} Members)
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Renders on the public About page in an adaptable responsive grid with circular portraits. Edit student leads, upload circular portraits, reorder, or toggle public visibility.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {turboBitsList.map((member, idx) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl admin-glass-panel border border-black/10 dark:border-white/10 flex flex-col items-center text-center space-y-3 relative group"
                  >
                    {/* Status Pill */}
                    <div className="absolute top-3 left-3 text-[10px] font-mono">
                      {Number(member.is_published) ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-bold">
                          <Eye className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditMember(member)}
                        className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-blue-500 cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Portrait Avatar */}
                    {(() => {
                      const crop = parseCropData((member as any).crop_data);
                      const isLeadMember = Boolean((member as any).is_lead || (member.role || '').toLowerCase().includes('lead') || (member.role || '').toLowerCase().includes('head'));
                      return (
                        <div className={`relative w-16 h-16 ${getCropMaskClass(crop.shape)} overflow-hidden border-2 ${isLeadMember ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-slate-300 dark:border-white/20'} bg-black/5 dark:bg-white/5 flex items-center justify-center mt-2 shadow-xs shrink-0`}>
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              style={getCropImageStyle(crop)}
                              className="pointer-events-none select-none"
                            />
                          ) : (
                            <span className="text-base font-bold font-display text-blue-500">
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <div className="w-full space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {member.name}
                      </h4>
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold block truncate">
                        {member.role}
                      </span>
                      {(member as any).forum_designation && (
                        <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block truncate max-w-full">
                          {(member as any).forum_designation}
                        </span>
                      )}
                      {member.department && (
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                          {member.department}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 w-full border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                      <span>Order #{member.display_order}</span>
                      <button
                        type="button"
                        onClick={() => openEditMember(member)}
                        className="text-blue-500 font-bold hover:underline cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FACULTY LEADERSHIP */}
          {activeTab === 'faculty' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-800 dark:text-zinc-200 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Faculty Leadership &amp; Department Advisors ({facultyList.length} Leads)
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    HOD and designated faculty coordinators overseeing student bodies and festival academic integrity.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facultyList.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-5 rounded-2xl admin-glass-panel border border-black/10 dark:border-white/10 flex items-start gap-4 relative group"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                      {fac.avatar_url ? (
                        <Image
                          src={fac.avatar_url}
                          alt={fac.name}
                          fill
                          className="object-cover"
                          unoptimized={fac.avatar_url.startsWith('/api/') || fac.avatar_url.includes('google')}
                        />
                      ) : (
                        <span className="text-base font-bold font-display text-emerald-500">
                          {fac.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {fac.name}
                          </h4>
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
                            {fac.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditMember(fac)}
                            className="p-1 text-slate-600 dark:text-zinc-400 hover:text-blue-500 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(fac.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {fac.department && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {fac.department}
                        </p>
                      )}

                      {fac.bio && (
                        <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 pt-1 leading-relaxed">
                          {fac.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Mobile Preview of the About Page */}
        <div
          className={`xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-20 space-y-3 ${
            mobileTab === 'editor' ? 'hidden xl:block' : 'block'
          }`}
        >
          <div className="w-full flex items-center justify-between px-1">
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              <span>LIVE ABOUT PAGE PREVIEW</span>
            </span>
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              title="Refresh preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simulated Mobile Device Frame (Optimized Slim Bezel) */}
          <div className="relative w-full max-w-[420px] mx-auto rounded-[32px] p-1.5 bg-gradient-to-b from-slate-800 via-slate-900 to-black shadow-xl border-2 border-slate-700/80 ring-1 ring-black/40">
            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-3 bg-black rounded-full z-30 flex items-center justify-end px-1.5">
              <div className="w-2 h-2 rounded-full bg-[#17253B] border border-slate-700" />
            </div>

            {/* Viewport Screen Canvas (Isolated Public Light Theme Scope) */}
            <div
              key={previewKey}
              data-theme="public-light"
              className="relative w-full rounded-[26px] overflow-hidden bg-[#F8FAFD] text-[#172B49] border border-slate-200 shadow-inner flex flex-col max-h-[660px]"
            >
              {/* Status bar */}
              <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[10px] font-mono font-bold text-[#172B49] shrink-0 bg-[#F8FAFD] select-none z-20">
                <span>09:41</span>
                <span className="text-[9px] text-[#8CA0BA]">YUGANTAR</span>
              </div>

              {/* Scrollable preview */}
              <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
                <PublicOrganizersPreview organizers={organizers} members={members} />
              </div>

              {/* Home bar */}
              <div className="py-2 flex items-center justify-center bg-[#F8FAFD] shrink-0 z-20">
                <div className="w-32 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-500 dark:text-zinc-400">
            Accurate participant view on mobile screens. Uses exact typography and circular portraits.
          </p>
        </div>
      </div>

      {/* =========================================================================
          MODAL: EDIT ORGANIZING BODY
          ========================================================================= */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>{editingOrg ? 'Edit Organizing Body' : 'Add Organizing Body'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOrgModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Official Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="e.g. TELE-ERA Department Student Forum"
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Role Subtitle *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgForm.role}
                    onChange={(e) => setOrgForm({ ...orgForm, role: e.target.value })}
                    placeholder="e.g. Departmental Student Body"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Badge Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgForm.badge}
                    onChange={(e) => setOrgForm({ ...orgForm, badge: e.target.value })}
                    placeholder="e.g. Host Department Forum"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={orgForm.description}
                  onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                  placeholder="Detailed forum overview..."
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Leadership Scope / Note
                </label>
                <input
                  type="text"
                  value={orgForm.leadershipNote}
                  onChange={(e) => setOrgForm({ ...orgForm, leadershipNote: e.target.value })}
                  placeholder="e.g. Coordinates registrations, jury liaison, and technical tracks."
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Logo Upload / Drive Link */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Organization Logo
                </label>

                {orgForm.logoUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-zinc-900 shrink-0">
                      <Image
                        src={orgForm.logoUrl}
                        alt="Logo"
                        fill
                        className="object-contain p-1"
                        unoptimized={orgForm.logoUrl.startsWith('/api/') || orgForm.logoUrl.includes('google')}
                      />
                    </div>
                    <span className="text-[11px] font-mono truncate flex-1 text-slate-600 dark:text-zinc-300">
                      {orgForm.logoUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOrgForm({ ...orgForm, logoUrl: '' })}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Local File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPhoto(file, true);
                      }}
                    />
                  </label>
                  <span className="text-slate-400 text-xs">or</span>
                  <input
                    type="text"
                    placeholder="Paste Google Drive / image link"
                    value={driveInput}
                    onChange={(e) => setDriveInput(e.target.value)}
                    onBlur={() => handleDriveUrlSubmit(true)}
                    className="flex-1 px-3 py-1.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-rose-500 text-xs font-semibold">{errorMsg}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 rounded-xl admin-glass-panel text-slate-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT PERSON / MEMBER (TURBO BITS OR FACULTY)
          ========================================================================= */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>
                  {editingMember
                    ? `Edit ${memberForm.category === 'turbo_bits' ? 'Turbo Bits Member' : 'Faculty Lead'}`
                    : `Add ${memberForm.category === 'turbo_bits' ? 'Turbo Bits Member' : 'Faculty Lead'}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. Om Satange"
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Role / Designation in YUGANTAR *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    placeholder="e.g. Technical Lead & Architecture"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Team Category *
                  </label>
                  <select
                    value={memberForm.category}
                    onChange={(e) => setMemberForm({ ...memberForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="turbo_bits">Turbo Bits Student Team</option>
                    <option value="faculty">Faculty Leadership & Advisors</option>
                  </select>
                </div>
              </div>

              {/* TurboBits Lead Designation Toggle */}
              {memberForm.category === 'turbo_bits' && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                      Designate as TurboBits Lead
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                      Highlights this student coordinator with a prominent leadership badge and ~20% elevated presence.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(memberForm.isLead)}
                    onChange={(e) => setMemberForm({ ...memberForm, isLead: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0 ml-3"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Department / Institution
                </label>
                <input
                  type="text"
                  value={memberForm.department}
                  onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                  placeholder="e.g. Department of Electronics & Telecommunication Engineering"
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  TELE-ERA Student Forum Designation (Optional)
                </label>
                <input
                  type="text"
                  value={memberForm.forumDesignation}
                  onChange={(e) => setMemberForm({ ...memberForm, forumDesignation: e.target.value })}
                  placeholder="e.g. TELE-ERA Student Forum Secretary / Tech Head"
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Short Bio / Responsibility Scope (Optional)
                </label>
                <textarea
                  rows={2}
                  value={memberForm.bio}
                  onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                  placeholder="Core student lead overseeing platform engineering and technical tracks..."
                  className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Social Profiles: GitHub & LinkedIn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>GitHub Profile URL (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={memberForm.githubUrl}
                    onChange={(e) => setMemberForm({ ...memberForm, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block text-xs flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>LinkedIn Profile URL (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={memberForm.linkedinUrl}
                    onChange={(e) => setMemberForm({ ...memberForm, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Portrait Image Upload */}
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
                <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                  Profile Portrait (Circular Avatar)
                </label>

                <div className="flex items-center gap-3">
                  {(() => {
                    const crop = parseCropData(memberForm.cropData);
                    return (
                      <div className={`relative w-14 h-14 ${getCropMaskClass(crop.shape)} overflow-hidden border-2 border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0`}>
                        {memberForm.avatarUrl ? (
                          <img
                            src={memberForm.avatarUrl}
                            alt="Avatar"
                            style={getCropImageStyle(crop)}
                            className="pointer-events-none select-none"
                          />
                        ) : (
                          <span className="text-sm font-bold font-display text-blue-500">
                            {(memberForm.name || 'TB')
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPhoto(file, false);
                          }}
                        />
                      </label>
                      {memberForm.avatarUrl && (
                        <>
                          <button
                            type="button"
                            onClick={openCropModal}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Crop / Framing</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberForm({ ...memberForm, avatarUrl: '', cropData: '' })}
                            className="text-rose-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste Google Drive direct link"
                      value={driveInput}
                      onChange={(e) => setDriveInput(e.target.value)}
                      onBlur={() => handleDriveUrlSubmit(false)}
                      className="w-full px-3 py-1.5 rounded-xl admin-glass-panel text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={memberForm.displayOrder}
                    onChange={(e) => setMemberForm({ ...memberForm, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl admin-glass-panel text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200 block">
                    Public Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setMemberForm({ ...memberForm, isPublished: memberForm.isPublished ? 0 : 1 })}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      memberForm.isPublished
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-black/5 dark:bg-white/10 text-slate-400 border border-black/10 dark:border-white/10'
                    }`}
                  >
                    {memberForm.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{memberForm.isPublished ? 'Visible on Website' : 'Hidden from Website'}</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-rose-500 text-xs font-semibold">{errorMsg}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 rounded-xl admin-glass-panel text-slate-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INTERACTIVE PHOTO CROP & FRAMING EDITOR
          ========================================================================= */}
      {showCropModal && memberForm.avatarUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="admin-glass-panel bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  <span>Photo Crop &amp; Framing Editor</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Drag to pan, adjust zoom, and choose mask framing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mask Shape Selector */}
            <div className="flex items-center justify-center gap-2">
              {[
                { id: 'circle', label: 'Circle Mask' },
                { id: 'rounded', label: 'Rounded Rect' },
                { id: 'square', label: 'Square' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCropShape(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    cropShape === s.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-black/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Interactive Viewport Canvas */}
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <div
                className={`relative w-56 h-56 bg-slate-950 overflow-hidden border-4 border-blue-500/80 shadow-2xl cursor-grab active:cursor-grabbing select-none ${getCropMaskClass(
                  cropShape,
                  'editor'
                )}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingCrop(true);
                  setDragStart({ clientX: e.clientX, clientY: e.clientY, startX: cropX, startY: cropY });
                }}
                onMouseMove={(e) => {
                  if (!isDraggingCrop) return;
                  const dx = e.clientX - dragStart.clientX;
                  const dy = e.clientY - dragStart.clientY;
                  const nextX = Math.max(-80, Math.min(80, Math.round(dragStart.startX + (dx / 224) * 100)));
                  const nextY = Math.max(-80, Math.min(80, Math.round(dragStart.startY + (dy / 224) * 100)));
                  setCropX(nextX);
                  setCropY(nextY);
                }}
                onMouseUp={() => setIsDraggingCrop(false)}
                onMouseLeave={() => setIsDraggingCrop(false)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  setIsDraggingCrop(true);
                  setDragStart({ clientX: touch.clientX, clientY: touch.clientY, startX: cropX, startY: cropY });
                }}
                onTouchMove={(e) => {
                  if (!isDraggingCrop) return;
                  const touch = e.touches[0];
                  const dx = touch.clientX - dragStart.clientX;
                  const dy = touch.clientY - dragStart.clientY;
                  const nextX = Math.max(-80, Math.min(80, Math.round(dragStart.startX + (dx / 224) * 100)));
                  const nextY = Math.max(-80, Math.min(80, Math.round(dragStart.startY + (dy / 224) * 100)));
                  setCropX(nextX);
                  setCropY(nextY);
                }}
                onTouchEnd={() => setIsDraggingCrop(false)}
              >
                <img
                  src={memberForm.avatarUrl}
                  alt="Portrait crop"
                  draggable={false}
                  className="pointer-events-none select-none transition-none"
                  style={getCropImageStyle({ zoom: cropZoom, x: cropX, y: cropY, shape: cropShape })}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-mono text-center">
                Drag photo to frame · {cropShape.toUpperCase()} mask preview
              </p>
            </div>

            {/* Control Sliders */}
            <div className="space-y-3 bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                  <span>Zoom Scale</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{cropZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                    <span>Pan Horizontal</span>
                    <span className="font-mono text-slate-600 dark:text-zinc-400 font-bold">{cropX > 0 ? `+${cropX}%` : `${cropX}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="1"
                    value={cropX}
                    onChange={(e) => setCropX(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-semibold mb-1">
                    <span>Pan Vertical</span>
                    <span className="font-mono text-slate-600 dark:text-zinc-400 font-bold">{cropY > 0 ? `+${cropY}%` : `${cropY}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="1"
                    value={cropY}
                    onChange={(e) => setCropY(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={handleResetCrop}
                className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-600 dark:text-zinc-400 text-xs font-semibold cursor-pointer"
              >
                Reset Framing
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply Framing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
