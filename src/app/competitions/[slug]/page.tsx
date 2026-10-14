import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DetailHeroBannerImage from '@/components/competitions/DetailHeroBannerImage';

import {
  COMPETITIONS,
  getAllCompetitionSlugs,
  getCompetitionGlow,
  FESTIVAL_INFO,
} from '@/data/events';
import {
  getPublicCompetitionBySlug,
  getFestivalSettings,
  DbCompetition,
} from '@/lib/competitions';
import {
  Cpu,
  Presentation,
  Zap,
  Lightbulb,
  Briefcase,
  Image as ImageIcon,
  Gamepad2,
  Mic2,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  FileText,
  Users,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  CheckCircle2,
  Award,
  Phone,
  Mail,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Cpu,
  Presentation,
  Zap,
  Lightbulb,
  Briefcase,
  Image: ImageIcon,
  Gamepad2,
  Mic2,
};

export async function generateStaticParams() {
  const slugs = getAllCompetitionSlugs();
  return [...slugs.map((slug) => ({ slug })), { slug: 'mock-placement' }];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function CompetitionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col animate-pulse">
      <Navbar />
      <div className="pt-24 sm:pt-32 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="h-4 w-48 bg-[#E2E8F0] rounded mb-6" />
        <div className="h-6 w-36 bg-[#E2E8F0] rounded-full mb-4" />
        <div className="h-12 w-3/4 max-w-xl bg-[#E2E8F0] rounded-xl mb-4" />
        <div className="h-64 bg-white border border-[#DCE5F2] rounded-3xl mb-8" />
      </div>
      <Footer />
    </div>
  );
}

export default function CompetitionDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<CompetitionDetailSkeleton />}>
      <CompetitionDetailContent params={params} />
    </Suspense>
  );
}

async function CompetitionDetailContent({ params }: PageProps) {
  const { slug } = await params;
  const [competition, festivalSettings] = await Promise.all([
    getPublicCompetitionBySlug(slug),
    getFestivalSettings(),
  ]);

  if (!competition) {
    notFound();
  }

  const Icon = ICON_MAP[competition.iconName] || Cpu;

  // Authoritative date and registration gating
  const isRegistrationOpen = Boolean(competition.registrationOpen !== false && festivalSettings.registrationGlobalOpen !== false);
  const eventDateDisplay = competition.eventDate || festivalSettings.date || '19 October 2026';
  const compGlow = getCompetitionGlow(competition.accentColor, (competition as any).themeVibe);

  // Inter-competition navigation
  const currentIndex = COMPETITIONS.findIndex((c) => c.slug === competition.slug);
  const prevCompetition =
    COMPETITIONS[(currentIndex - 1 + COMPETITIONS.length) % COMPETITIONS.length];
  const nextCompetition =
    COMPETITIONS[(currentIndex + 1) % COMPETITIONS.length];

  const vis = competition.sectionVisibility || {
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
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col selection:bg-[#E07A43]/20 selection:text-[#172B49]">
      <Navbar />

      {/* =========================================================================
          HERO SECTION — ATMOSPHERIC CAMPUS HEADER WITH 16:9 BANNER
          ========================================================================= */}
      <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 overflow-hidden border-b border-[#DCE5F2] bg-gradient-to-b from-[#EDF5FC] via-[#F4F8FD] to-[#F8FAFD]">
        {/* Ambient atmospheric color glow */}
        <div
          className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: competition.accentColor }}
        />
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#FFF4EA] rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono text-[#60728A] mb-5 sm:mb-6">
            <Link href="/" className="hover:text-[#172B49] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
            <Link href="/competitions" className="hover:text-[#172B49] transition-colors">
              Competitions
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
            <span style={{ color: competition.accentColor }} className="font-bold">
              {competition.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {/* Arena Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  style={{
                    backgroundColor: competition.accentBg,
                    color: competition.accentColor,
                    borderColor: competition.accentColor + '40',
                  }}
                  className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-2xs"
                >
                  ARENA 0{competition.districtIndex + 1} · {competition.district}
                </span>

                <span className="text-xs font-mono text-[#60728A] px-3 py-1 rounded-full bg-white border border-[#DCE5F2]">
                  {competition.category}
                </span>

                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isRegistrationOpen
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {isRegistrationOpen ? '● Registration Active' : '○ Registration Closed'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#172B49] leading-tight">
                {competition.name}
              </h1>

              {/* District Quote / Subtitle */}
              <p className="text-xs sm:text-sm lg:text-base text-[#60728A] leading-relaxed max-w-2xl font-normal">
                {competition.districtTagline}
              </p>

              {/* Key Highlights / Requirement Badges */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#172B49] pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-[#4B91E8]" />
                  <span>{eventDateDisplay}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-[#8578D8]" />
                  <span>{competition.venue}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-[#E07A43]" />
                  <span>{competition.eligibility}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-[#2F855A]" />
                  <span>{competition.teamSizeLimit}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {isRegistrationOpen ? (
                  <Link
                    id="hero-register-btn"
                    href={`/competitions/${competition.slug}/register`}
                    className="px-6 py-3.5 rounded-xl text-white text-xs sm:text-sm font-mono font-bold tracking-wider uppercase inline-flex items-center gap-2 shadow-sm transition-all hover:opacity-95"
                    style={{
                      background: `linear-gradient(135deg, ${competition.accentColor} 0%, ${competition.accentSecondary} 100%)`,
                    }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Register for {competition.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase inline-flex items-center gap-2 cursor-not-allowed">
                    <ShieldCheck className="w-4 h-4 opacity-50" />
                    <span>Registration Closed</span>
                  </div>
                )}

                <a
                  href="#overview-dossier"
                  className="px-4 py-3.5 rounded-xl text-xs font-mono font-bold text-[#172B49] bg-white border border-[#DCE5F2] hover:bg-[#F8FAFD] transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  <span>Read Event Dossier ↓</span>
                </a>
              </div>
            </div>

            {/* Dedicated 16:9 Banner Preview in Hero */}
            <div className="lg:col-span-4 w-full">
              <DetailHeroBannerImage
                src={competition.bannerImage}
                alt={`${competition.name} official artwork`}
                fallbackSrc={`/images/competitions/${competition.slug}.webp`}
                district={competition.district}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN DOSSIER CONTENT
          ========================================================================= */}
      <main id="overview-dossier" className="py-10 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
            {/* LEFT COLUMN: Deep Information Dossier */}
            <div className="lg:col-span-8 space-y-8 sm:space-y-10">
              {/* 1. Prominent Register Card */}
              {vis.registration !== false && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} p-6 sm:p-7 rounded-3xl border-2 shadow-xs relative overflow-hidden transition-all`}
                  style={{
                    backgroundColor: competition.accentBg,
                    borderColor: competition.accentColor + '40',
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: competition.accentColor + '20', color: competition.accentColor }}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: competition.accentColor }}>
                          OFFICIAL REGISTRATION
                        </span>
                        <h3 className="text-lg font-display font-bold text-[#172B49]">
                          Register for {competition.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        isRegistrationOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isRegistrationOpen ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-5 font-normal">
                    {isRegistrationOpen
                      ? 'Submit your registration through our direct portal. Responses are saved in TiDB Cloud and forwarded to the live Google Form & Google Sheet with verifiable confirmation.'
                      : festivalSettings.registrationStatusMessage ||
                        'Official registrations for this arena are currently closed by administration.'}
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {isRegistrationOpen ? (
                      <Link
                        id="main-register-btn"
                        href={`/competitions/${competition.slug}/register`}
                        className="px-6 py-3.5 rounded-xl text-white text-xs sm:text-sm font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md transition-all hover:opacity-95"
                        style={{
                          background: `linear-gradient(135deg, ${competition.accentColor} 0%, ${competition.accentSecondary} 100%)`,
                        }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Proceed to Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <div className="px-6 py-3.5 rounded-xl bg-white/70 text-slate-500 border border-[#DCE5F2] text-xs sm:text-sm font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-not-allowed">
                        <ShieldCheck className="w-4 h-4 opacity-50" />
                        <span>Registrations Closed</span>
                      </div>
                    )}

                    <span className="text-xs font-mono text-[#60728A] flex items-center justify-center sm:justify-start gap-1">
                      ✓ Dual Cloudinary Upload & Google Forms Verified
                    </span>
                  </div>
                </div>
              )}

              {/* 2. About & Event Description */}
              {vis.about !== false && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#4B91E8]" />
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                      About the Competition
                    </h2>
                  </div>

                <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed">
                  {competition.about}
                </p>

                <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-1">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#172B49] tracking-wider block">
                    Competition Format
                  </span>
                  <p className="text-xs text-[#60728A] leading-relaxed">
                    {competition.formatNote}
                  </p>
                </div>

                {/* Approved Domains (if applicable, e.g., Project Competition) */}
                {competition.approvedDomains && competition.approvedDomains.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-[#E07A43] tracking-wider block">
                      Approved Technical Domains (Strict Adherence Required)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {competition.approvedDomains.map((domain) => (
                        <span
                          key={domain}
                          className="px-3 py-1 rounded-xl bg-white border border-[#FFE0CE] text-xs font-mono font-bold text-[#172B49]"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Theme (if applicable, e.g., Poster Competition) */}
                {competition.theme && (
                  <div className="p-4 rounded-2xl bg-[#EDF5FC] border border-[#B8D5F8] space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-[#4B91E8] tracking-wider block">
                      Official Mandatory Theme
                    </span>
                    <p className="text-sm font-display font-extrabold text-[#172B49]">
                      &ldquo;{competition.theme}&rdquo; (Electronic Waste &amp; Sustainable Engineering)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Event Schedule & Timeline */}
              {vis.schedule !== false && competition.scheduleFlow && competition.scheduleFlow.length > 0 && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#8578D8]" />
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                      Event Flow &amp; Schedule
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {competition.scheduleFlow.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE5F2] font-mono text-[11px] font-bold text-[#172B49] shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-[#60728A] leading-relaxed sm:text-right flex-1 sm:pl-4">
                          {item.activity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Evaluation Matrix (if applicable) */}
              {vis.rubric !== false && competition.evaluationMatrix && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#E07A43]" />
                      <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                        Official Evaluation Rubric
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FFF4EA] text-[#E07A43] border border-[#FFE0CE]">
                      {competition.evaluationMatrix.totalPoints}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {competition.evaluationMatrix.criteria.map((crit, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-[#172B49]">{crit.name}</span>
                        <span className="text-xs font-mono font-extrabold text-[#4B91E8] bg-white px-2.5 py-1 rounded-lg border border-[#DCE5F2]">
                          {crit.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Authoritative Rules & Regulations */}
              {vis.rules !== false && competition.rules && competition.rules.length > 0 && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#4B91E8]" />
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                      Rules &amp; Regulations
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {competition.rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#172B49] leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#4B91E8] shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Expectations from Participants */}
              {vis.expectations !== false && competition.expectations && competition.expectations.length > 0 && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#2F855A]" />
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                      Participant Expectations &amp; Conduct
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    {competition.expectations.map((exp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#60728A]"
                      >
                        <span
                          style={{ backgroundColor: competition.accentColor }}
                          className="w-5 h-5 rounded-md text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                        >
                          0{idx + 1}
                        </span>
                        <span>{exp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. FAQs */}
              {vis.faqs !== false && competition.faqs && competition.faqs.length > 0 && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#8578D8]" />
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                      Frequently Asked Questions
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {competition.faqs.map((faq, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-[#172B49]">
                          {faq.question}
                        </h4>
                        <p className="text-xs text-[#60728A] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Custom Extensible Content Sections */}
              {vis.custom !== false && competition.customSections && competition.customSections.length > 0 && (
                <div className="space-y-8">
                  {competition.customSections
                    .filter((s) => s.isVisible !== false)
                    .map((sec) => (
                      <div
                        key={sec.id}
                        className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#4B91E8]" />
                          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#172B49]">
                            {sec.title}
                          </h2>
                        </div>
                        {sec.type === 'text' && sec.content && (
                          <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed">
                            {sec.content}
                          </p>
                        )}
                        {sec.type === 'bullets' && sec.items && (
                          <div className="space-y-2.5">
                            {sec.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#172B49]"
                              >
                                <CheckCircle2 className="w-4 h-4 text-[#4B91E8] shrink-0 mt-0.5" />
                                <span>{it}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {sec.type === 'notice' && sec.content && (
                          <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] text-xs text-[#172B49] flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-[#E07A43] shrink-0 mt-0.5" />
                            <span>{sec.content}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Quick Logistics Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Dossier Card */}
              {/* Sidebar Quick Action Card */}
              {vis.dossier !== false && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-6 shadow-xs space-y-5 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49] pb-3 border-b border-[#E2E8F0]">
                    Competition Dossier
                  </h3>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[11px]">VENUE</span>
                      <span className="font-bold text-[#172B49] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8578D8]" />
                        {competition.venue}
                      </span>
                      {competition.venueDirections && (
                        <a
                          href={competition.venueDirections.startsWith('http') ? competition.venueDirections : `https://maps.google.com/?q=${encodeURIComponent(competition.venueDirections)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                        >
                          <span>Open in Maps</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      )}
                    </div>

                    <div>
                      <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[11px]">ELIGIBILITY</span>
                      <span className="font-bold text-[#172B49] flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#4B91E8]" />
                        {competition.eligibility}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[11px]">TEAM SIZE</span>
                      <span className="font-bold text-[#172B49] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#E07A43]" />
                        {competition.teamSizeLimit}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[11px]">EVENT DATE</span>
                      <span className="font-bold text-[#172B49] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#2F855A]" />
                        {eventDateDisplay}
                      </span>
                    </div>
                  </div>

                  {isRegistrationOpen ? (
                    <Link
                      href={`/competitions/${competition.slug}/register`}
                      className="w-full py-3 rounded-xl text-white text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center justify-center gap-2 shadow-xs transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: competition.accentColor,
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Register Now</span>
                    </Link>
                  ) : (
                    <div className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center justify-center gap-2 cursor-not-allowed">
                      <ShieldCheck className="w-4 h-4 opacity-50" />
                      <span>Registration Closed</span>
                    </div>
                  )}
                </div>
              )}

              {/* Coordinators Section */}
              {vis.coordinators !== false && competition.coordinators && competition.coordinators.length > 0 && (
                <div
                  suppressHydrationWarning
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] p-5 shadow-xs space-y-3 transition-all`}
                  style={{
                    '--card-edge-color': competition.accentColor,
                    '--card-edge-hover-border': competition.accentColor,
                  } as React.CSSProperties}
                >
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49] pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#8578D8]" />
                      <span>Track Coordinators</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#8CA0BA]">
                      {competition.coordinators.length} Assigned
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {competition.coordinators.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-2 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {/* Coordinator Avatar Photo or Initials */}
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center shrink-0">
                            {c.avatar_url ? (
                              <Image
                                src={c.avatar_url}
                                alt={c.name}
                                fill
                                className="object-cover"
                                unoptimized={c.avatar_url.startsWith('/api/') || c.avatar_url.includes('google')}
                              />
                            ) : (
                              <span className="text-xs font-bold font-display text-[#4B91E8]">
                                {c.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#172B49] truncate">{c.name}</div>
                            <div className="text-[11px] text-[#60728A] truncate font-medium">{c.role}</div>
                          </div>
                        </div>

                        {/* Contact Action Pills */}
                        {(c.phone || c.email) && (
                          <div className="pt-2 border-t border-[#E2E8F0]/70 flex flex-wrap gap-2 text-[10px] font-mono">
                            {c.phone && (
                              <a
                                href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#DCE5F2] text-[#172B49] hover:text-[#4B91E8] transition-colors"
                              >
                                <Phone className="w-2.5 h-2.5 text-[#4B91E8]" />
                                <span>{c.phone}</span>
                              </a>
                            )}
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#DCE5F2] text-[#60728A] hover:text-[#172B49] transition-colors truncate max-w-full"
                              >
                                <Mail className="w-2.5 h-2.5 text-[#8578D8]" />
                                <span className="truncate">{c.email}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inter-Competition Navigation */}
              <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 shadow-xs space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8CA0BA] block">
                  Other Technical Arenas
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`/competitions/${prevCompetition.slug}`}
                    className="p-3 rounded-2xl bg-[#F8FAFD] hover:bg-[#EDF5FC] border border-[#E2E8F0] transition-colors"
                  >
                    <span className="text-[10px] font-mono text-[#8CA0BA] block">← Previous</span>
                    <span className="font-bold text-[#172B49] truncate block">
                      {prevCompetition.name}
                    </span>
                  </Link>

                  <Link
                    href={`/competitions/${nextCompetition.slug}`}
                    className="p-3 rounded-2xl bg-[#F8FAFD] hover:bg-[#EDF5FC] border border-[#E2E8F0] transition-colors text-right"
                  >
                    <span className="text-[10px] font-mono text-[#8CA0BA] block">Next →</span>
                    <span className="font-bold text-[#172B49] truncate block">
                      {nextCompetition.name}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
