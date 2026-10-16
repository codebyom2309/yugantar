import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getPublicOrganizerMembers,
  getFestivalSettings,
  DbOrganizerMember,
} from '@/lib/competitions';
import {
  parseCropData,
  getCropImageStyle,
  getCropMaskClass,
} from '@/lib/cropUtils';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import {
  Code2,
  Cpu,
  Sparkles,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Mail,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Terminal,
  Heart,
  MessageSquare,
} from 'lucide-react';

function GithubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: 'Meet TurboBits — Student Tech & Development Team | YUGANTAR 2026',
  description:
    'Hey, we’re TurboBits! The student development team behind the YUGANTAR 2026 digital experience at Priyadarshini College of Engineering, Nagpur.',
  alternates: {
    canonical: '/turbobits',
  },
  openGraph: {
    title: 'Meet TurboBits — Student Tech & Development Team | YUGANTAR 2026',
    description:
      'Hey, we’re TurboBits! The student engineering team behind YUGANTAR 2026 at PCE Nagpur.',
    url: '/turbobits',
    images: [
      {
        url: '/images/turbobits/turbobits-bg.png',
        width: 941,
        height: 1672,
        alt: 'TurboBits Student Team Background',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hey, we’re TurboBits! — YUGANTAR 2026',
    description:
      'The student team behind the YUGANTAR 2026 digital experience at Priyadarshini College of Engineering, Nagpur.',
    images: ['/images/turbobits/turbobits-bg.png'],
  },
};

export default function TurboBitsPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Meet TurboBits', path: '/turbobits' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
        <TurboBitsContent />
      </Suspense>
    </>
  );
}

async function TurboBitsContent() {
  const [members, festival] = await Promise.all([
    getPublicOrganizerMembers('turbo_bits'),
    getFestivalSettings(),
  ]);

  const showOrganizerOrder = Boolean(festival.showOrganizerOrder);

  // Sort: Lead first, then by display order
  const sortedMembers = [...members].sort((a, b) => {
    const aLead = Boolean(
      (a as any).is_lead ||
        (a.role || '').toLowerCase().includes('lead') ||
        (a.role || '').toLowerCase().includes('head')
    );
    const bLead = Boolean(
      (b as any).is_lead ||
        (b.role || '').toLowerCase().includes('lead') ||
        (b.role || '').toLowerCase().includes('head')
    );
    if (aLead && !bLead) return -1;
    if (!aLead && bLead) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  return (
    <div className="relative min-h-screen bg-[#F8FAFD] flex flex-col text-[#10264A] selection:bg-[#3978F6]/20 selection:text-[#10264A]">
      {/* =========================================================================
          FULL-PAGE SUBTLE TECHNICAL GRID & DOT PATTERN BACKGROUND
          Covers the entire page from top navigation/hero down through final sections & footer.
          Fixed positioning ensures zero scrolling jitter, seamless continuity, and no layout shift.
          ========================================================================= */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden" 
        aria-hidden="true"
      >
        {/* Subtle technical line grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(57, 120, 246, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(57, 120, 246, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
          }}
        />
        {/* Technical dot pattern matching the original TurboBits aesthetic */}
        <div
          className="absolute inset-0 opacity-[0.38]"
          style={{
            backgroundImage: 'radial-gradient(#3978F6 0.8px, transparent 0.8px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Soft atmospheric gradient wash ensuring perfect contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#EDF5FC]/30 via-transparent to-[#F8FAFD]/50" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* Hero Section with technical background asset */}
        <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-20 border-b border-[#DCE5F2] overflow-hidden bg-gradient-to-b from-[#EDF5FC]/80 via-[#F4F8FD]/70 to-[#F8FAFD]/60">
          
          {/* Supplied Technical Circuit Background Asset */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 sm:opacity-25 mix-blend-multiply overflow-hidden">
            <Image
              src="/images/turbobits/turbobits-bg.png"
              alt="TurboBits Circuit Network Background"
              fill
              priority
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#EDF5FC]/85 via-[#F8FAFD]/90 to-[#F8FAFD]" />
          </div>

        {/* Ambient atmospheric glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#3978F6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF783E]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs font-mono text-[#536781]">
              <li>
                <Link href="/" className="hover:text-[#3978F6] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
              </li>
              <li className="font-semibold text-[#10264A] truncate">Meet TurboBits</li>
            </ol>
          </nav>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#DCE5F2] shadow-2xs text-xs font-mono font-bold text-[#3978F6] uppercase tracking-wider backdrop-blur-xs">
              <Terminal className="w-3.5 h-3.5 text-[#3978F6]" />
              <span>STUDENT TECH &amp; PLATFORM TEAM</span>
              <span className="inline-block animate-pulse text-[#FF783E] text-xs">♥</span>
            </div>

            {/* Rewritten student-friendly hero heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#10264A] leading-[1.1]">
              Hey, we&apos;re TurboBits!
            </h1>

            {/* Rewritten supporting text */}
            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed font-normal">
              Thanks for visiting YUGANTAR 2026! We&apos;re the student team behind this website. We built it to make exploring competitions and registering for events easier. Have a question, spotted a problem, or need help with registration? We&apos;d be happy to help.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 text-xs font-mono text-[#10264A]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#DCE5F2] shadow-2xs font-semibold">
                <Laptop className="w-3.5 h-3.5 text-[#3978F6]" />
                <span>Student-Led Technology</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#DCE5F2] shadow-2xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-[#FF783E]" />
                <span>Dept. of ETC · PCE Nagpur</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#DCE5F2] shadow-2xs text-[#536781]">
                <Heart className="w-3.5 h-3.5 text-[#FF783E] fill-[#FF783E]" />
                <span>Built for Delegates</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">

          {/* About Section: A little about us */}
          <section className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-10 lg:p-12 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F2FF] text-xs font-mono font-bold text-[#3978F6] uppercase tracking-wider">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>WHO WE ARE</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                  A little about us
                </h2>

                <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
                  We&apos;re a team of students who enjoy building things with technology. We worked together on the YUGANTAR website, from the competition pages and registration experience to the tools that help manage the event. We&apos;re still learning, improving, and figuring things out together—and that&apos;s part of the fun.
                </p>

                <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
                  Every feature here—whether it&apos;s verifying payment UTR numbers, generating pass tokens, syncing with official faculty sheets, or making sure the festival schedule stays accurate—was built to give our fellow students a seamless experience on campus.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#3978F6] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#10264A]">Student Craft</h4>
                      <p className="text-[11px] text-[#536781] mt-0.5 leading-normal">
                        Next.js App Router, TypeScript, dynamic forms, and resilient APIs.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#FF783E] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#10264A]">Campus Teamwork</h4>
                      <p className="text-[11px] text-[#536781] mt-0.5 leading-normal">
                        Developed in partnership with TELE-ERA student coordinators and department faculty mentors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Stack Snapshot Card */}
              <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE5F2]">
                  <span className="text-xs font-mono font-bold text-[#10264A] uppercase tracking-wider">
                    TURBOBITS · TECH SNAPSHOT
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    STUDENT BUILT
                  </span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCE5F2]">
                    <span className="text-[#536781]">TEAM NAME</span>
                    <span className="font-bold text-[#10264A]">Team TurboBits</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCE5F2]">
                    <span className="text-[#536781]">DEPARTMENT</span>
                    <span className="font-bold text-[#10264A]">Dept of ETC, PCE Nagpur</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCE5F2]">
                    <span className="text-[#536781]">FESTIVAL EDITION</span>
                    <span className="font-bold text-[#3978F6]">YUGANTAR 2026</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCE5F2]">
                    <span className="text-[#536781]">CORE MISSION</span>
                    <span className="font-bold text-[#FF783E]">Smooth Participant Experience</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section: Meet the people behind the screen */}
          <section id="team" className="space-y-6 sm:space-y-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>STUDENT TEAM</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                Meet the people behind the screen.
              </h2>
              <p className="text-xs sm:text-sm text-[#536781] mt-1.5 leading-relaxed font-normal">
                The students who wrote the code, tuned the layouts, tested the flows, and helped bring YUGANTAR 2026 online.
              </p>
            </div>

            {sortedMembers.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-dashed border-[#DCE5F2] text-center space-y-2">
                <Code2 className="w-8 h-8 text-[#8CA0BA] mx-auto" />
                <p className="text-sm font-semibold text-[#10264A]">Team profiles updating</p>
                <p className="text-xs text-[#536781]">The student technology roster will display as soon as published by administrators.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {sortedMembers.map((member: DbOrganizerMember, idx: number) => {
                  const hasGithub = member.github_url && member.github_url.trim().length > 0;
                  const hasLinkedin = member.linkedin_url && member.linkedin_url.trim().length > 0;
                  const roleLower = (member.role || '').toLowerCase();
                  const isLead = Boolean(
                    (member as any).is_lead ||
                      roleLower.includes('lead') ||
                      roleLower.includes('head')
                  );
                  const crop = parseCropData(member.crop_data);

                  return (
                    <div
                      key={member.id ? `${member.id}-${idx}` : `tb-${idx}`}
                      suppressHydrationWarning
                      className={`turbobits-card ${isLead ? 'glow-cyan' : 'glow-blue'} rounded-3xl flex flex-col justify-between transition-all duration-300 group ${
                        isLead
                          ? 'col-span-1 sm:col-span-2 lg:col-span-3 p-6 sm:p-8 bg-gradient-to-br from-white via-white to-[#F0F6FF] border-2 border-[#3978F6]/60 shadow-[0_0_24px_rgba(57,120,246,0.18)]'
                          : 'p-5 sm:p-6 bg-white border border-[#DCE5F2] shadow-xs'
                      }`}
                    >
                      <div className={isLead ? 'space-y-4' : 'space-y-3.5'}>
                        {/* Member Header with Avatar, Name, and Role */}
                        <div
                          className={`flex ${
                            isLead
                              ? 'items-center sm:items-start gap-5 sm:gap-6'
                              : 'items-start gap-4'
                          }`}
                        >
                          <div
                            className={`relative ${getCropMaskClass(
                              crop.shape
                            )} overflow-hidden shrink-0 flex items-center justify-center transition-all ${
                              isLead
                                ? 'w-22 h-22 sm:w-28 sm:h-28 border-3 border-[#3978F6] shadow-lg ring-4 ring-[#3978F6]/20 bg-[#E9F2FF]'
                                : 'w-16 h-16 sm:w-18 sm:h-18 border-2 border-[#DCE5F2] bg-[#E9F2FF] shadow-2xs group-hover:border-[#3978F6]/70'
                            }`}
                          >
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name}
                                style={getCropImageStyle(crop)}
                                className="pointer-events-none select-none transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <span
                                className={`font-display text-[#3978F6] font-bold ${
                                  isLead ? 'text-2xl sm:text-3xl' : 'text-lg'
                                }`}
                              >
                                {(member.name || 'TB')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              {isLead ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3978F6] text-white text-xs font-mono font-extrabold uppercase tracking-wider shadow-xs">
                                  <span>⚡ TurboBits Lead</span>
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#EBF2FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#2563EB]/20">
                                  {member.role || 'Contributor'}
                                </span>
                              )}

                              {member.forum_designation && (
                                <div className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-1">
                                  <span>{member.forum_designation}</span>
                                </div>
                              )}
                            </div>

                            <h3
                              className={`font-display font-black text-[#10264A] leading-snug break-words ${
                                isLead ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
                              }`}
                            >
                              {member.name}
                            </h3>
                            <p
                              className={`font-mono font-bold text-[#3978F6] leading-snug break-words ${
                                isLead ? 'text-sm sm:text-base text-[#10264A]' : 'text-xs'
                              }`}
                            >
                              {member.role}
                            </p>
                          </div>
                        </div>

                        {/* Department Scope */}
                        <div className="flex items-center gap-2 text-[11px] text-[#7E93AC] font-mono">
                          <Layers className="w-3.5 h-3.5 text-[#3978F6]" />
                          <span className="truncate">{member.department || 'ETC Department, PCE'}</span>
                        </div>

                        {/* Bio / Responsibility Scope */}
                        {member.bio && (
                          <div
                            className={`p-3 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2]/80 leading-relaxed text-[#536781] ${
                              isLead ? 'text-xs sm:text-sm' : 'text-xs'
                            }`}
                          >
                            <p className="font-normal text-[11px] sm:text-xs">{member.bio}</p>
                          </div>
                        )}
                      </div>

                      {/* Footer: Social Links */}
                      <div className="pt-4 mt-4 border-t border-[#DCE5F2] flex items-center justify-between">
                        {showOrganizerOrder ? (
                          <span className="text-[10px] font-mono text-[#7E93AC] font-semibold">
                            Order #{member.display_order + 1}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#7E93AC]/60">PCE · ETC</span>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {hasGithub && (
                            <a
                              href={member.github_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F8FAFD] hover:bg-[#E9F2FF] border border-[#DCE5F2] hover:border-[#3978F6]/40 text-[#536781] hover:text-[#10264A] text-xs font-mono font-semibold transition-all shadow-2xs"
                              aria-label={`${member.name}'s GitHub Profile`}
                              title="GitHub Profile"
                            >
                              <GithubIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px]">GitHub</span>
                            </a>
                          )}
                          {hasLinkedin && (
                            <a
                              href={member.linkedin_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F8FAFD] hover:bg-[#E9F2FF] border border-[#DCE5F2] hover:border-[#3978F6]/40 text-[#536781] hover:text-[#3978F6] text-xs font-mono font-semibold transition-all shadow-2xs"
                              aria-label={`${member.name}'s LinkedIn Profile`}
                              title="LinkedIn Profile"
                            >
                              <LinkedinIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px]">LinkedIn</span>
                            </a>
                          )}
                          {!hasGithub && !hasLinkedin && (
                            <span className="text-[10px] font-mono text-[#7E93AC]">
                              Student Contributor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Closing Section: Need a hand? */}
          <section className="rounded-3xl bg-gradient-to-r from-[#E9F2FF] via-[#F4F8FD] to-[#FFEFE3] p-8 sm:p-12 border border-[#DCE5F2] text-center relative overflow-hidden">
            <div className="max-w-xl mx-auto relative z-10 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF783E] bg-white px-3 py-1 rounded-full shadow-2xs inline-block">
                GET IN TOUCH
              </span>

              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A]">
                Need a hand?
              </h3>

              <p className="text-xs sm:text-sm text-[#536781] leading-relaxed max-w-lg mx-auto font-normal">
                If something isn&apos;t working, you have a question about registration, or you&apos;ve got an idea to make the website better, reach out to us. We&apos;re happy to hear from you!
              </p>

              <p className="text-xs sm:text-sm font-semibold text-[#10264A] pt-1">
                Thanks for being part of YUGANTAR 2026. See you at the event!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/competitions"
                  className="nexus-btn-primary px-6 py-2.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-xs"
                >
                  <span>Explore Competitions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {festival.footerEmail && (
                  <a
                    href={`mailto:${festival.footerEmail}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFD] border border-[#DCE5F2] text-xs font-mono font-bold text-[#10264A] transition-colors shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#FF783E]" />
                    <span>Send Us a Note</span>
                  </a>
                )}

                <Link
                  href="/about"
                  className="nexus-btn-secondary px-6 py-2.5 text-xs font-mono font-bold tracking-wider uppercase gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#3978F6]" />
                  <span>About YUGANTAR</span>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

        <Footer festival={festival} className="bg-transparent" />
      </div>
    </div>
  );
}
