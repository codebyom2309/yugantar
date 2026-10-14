import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';
import TurboBitsObserver from '@/components/organizers/TurboBitsObserver';
import {
  getPublicOrganizers,
  getPublicOrganizerMembers,
  getFestivalSettings,
  DbOrganizerMember,
} from '@/lib/competitions';
import {
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ExternalLink,
  Code2,
  Cpu,
  Layers,
  HeartHandshake,
} from 'lucide-react';

// Clean SVG Social Icons
function GithubSocialIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinSocialIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  const [organizers, members, festival, showOrderRows] = await Promise.all([
    getPublicOrganizers(),
    getPublicOrganizerMembers(),
    getFestivalSettings(),
    db.query<{ setting_value: string }>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'show_organizer_order' LIMIT 1"
    ).catch(() => []),
  ]);
  const showOrganizerOrder = showOrderRows?.[0]?.setting_value === '1';

  const turboBitsTeam = members.filter((m) => m.category === 'turbo_bits');
  const facultyLeads = members.filter((m) => m.category === 'faculty');

  // Find HOD vs other faculty
  const hodMember = facultyLeads.find(
    (f) =>
      f.role.toLowerCase().includes('head') ||
      f.role.toLowerCase().includes('hod') ||
      f.name.toLowerCase().includes('head')
  ) || facultyLeads[0];

  const otherFaculty = facultyLeads.filter((f) => f.id !== hodMember?.id);

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header with compact navbar relationship & mobile background asset */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-10 sm:pb-14 bg-gradient-to-b from-[#EDF5FC] via-[#F4F8FD] to-[#F8FAFD] overflow-hidden border-b border-[#DCE5F2]">
        
        {/* Mobile-Specific Supplied Background Asset */}
        <div className="sm:hidden absolute inset-0 z-0 pointer-events-none opacity-70">
          <Image
            src="/images/nexus-city/about-hero-mobile.webp"
            alt="YUGANTAR 2026 NEXUS Architecture"
            fill
            priority
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EDF5FC]/40 via-[#F8FAFD]/70 to-[#F8FAFD]" />
        </div>

        {/* Desktop-Specific Supplied Architectural Panoramic Background Asset */}
        <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none opacity-75">
          <Image
            src="/images/nexus-city/hero-panoramic-city.webp"
            alt="YUGANTAR 2026 NEXUS Architecture Panoramic"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EDF5FC]/35 via-[#F8FAFD]/65 to-[#F8FAFD]" />
        </div>

        {/* Ambient atmospheric lighting on desktop (cool pale-blue and subtle electric-blue) */}
        <div className="hidden sm:block absolute -top-32 -right-32 w-96 h-96 bg-[#E9F2FF] rounded-full blur-3xl pointer-events-none opacity-70" />
        <div className="hidden sm:block absolute top-10 left-1/4 w-80 h-80 bg-[#3978F6]/10 rounded-full blur-3xl pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section 1: Compact Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-3 sm:mb-4">
            <Link href="/" className="hover:text-[#10264A] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3978F6] font-semibold">About YUGANTAR &amp; Organizers</span>
          </div>

          {/* Section 2: Page Introduction */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#FFE0CE] text-[11px] font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-3 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>INSTITUTIONAL HERITAGE &amp; LEADERSHIP</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#10264A] mb-3 text-balance leading-tight">
              About {festival.name} {festival.edition}. <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal text-3xl sm:text-5xl lg:text-6xl">
                Engineering. Discovery. Innovation.
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#536781] leading-relaxed mb-5 font-normal max-w-2xl">
              Organized by the {festival.department} and TELE-ERA at {festival.college}. {festival.name} unites future engineers, innovators, and creators across eight architectural districts of NEXUS CITY to build, compete, and lead.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#10264A]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-[#DCE5F2] shadow-2xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#3978F6]" />
                <span>{festival.date}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-[#DCE5F2] shadow-2xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#FF783E]" />
                <span>{festival.locationShort}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-[#DCE5F2] shadow-2xs text-[#536781]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autonomous PCE Campus</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="py-12 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
          
          {/* Section 3: Institutional & Faculty Leadership (Highest Prominence) */}
          {facultyLeads.length > 0 && (
            <section id="faculty-leadership" className="space-y-6 sm:space-y-8">
              <div className="max-w-2xl">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3978F6] bg-[#E9F2FF] border border-[#D2E4FF] px-3 py-1 rounded-full mb-2.5 inline-block">
                  INSTITUTIONAL PATRONAGE &amp; ACADEMIC MENTORSHIP
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                  Academic &amp; Institutional Leadership
                </h2>
                <p className="text-xs sm:text-sm text-[#536781] mt-1 leading-relaxed">
                  The faculty leaders providing academic stewardship, laboratory infrastructure, and institutional patronage for YUGANTAR 2026.
                </p>
              </div>

              {/* HOD Feature Spotlight Card */}
              {hodMember && (
                <div className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden group hover:border-[#3978F6]/40 transition-all">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#E9F2FF] via-[#F4F8FD] to-transparent rounded-bl-full pointer-events-none opacity-80" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
                    
                    {/* HOD Portrait / Monogram */}
                    <div className="lg:col-span-4 flex flex-col items-start sm:items-center lg:items-start">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-3 border-[#3978F6]/20 bg-[#E9F2FF] shadow-sm flex items-center justify-center shrink-0">
                        {hodMember.avatar_url ? (
                          <Image
                            src={hodMember.avatar_url}
                            alt={hodMember.name}
                            fill
                            className="object-cover"
                            unoptimized={hodMember.avatar_url.startsWith('/api/') || hodMember.avatar_url.includes('google')}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-2">
                            <GraduationCap className="w-10 h-10 text-[#3978F6] mb-1" />
                            <span className="text-xl font-bold font-display text-[#10264A]">
                              {(hodMember.name || 'HOD')
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-1 sm:text-center lg:text-left">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9F2FF] text-[#3978F6] border border-[#D2E4FF] text-[11px] font-mono font-bold uppercase">
                          Academic Patron &amp; Head
                        </span>
                        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#10264A] tracking-tight">
                          {hodMember.name}
                        </h3>
                        <p className="text-xs font-mono font-bold text-[#FF783E]">
                          {hodMember.role}
                        </p>
                        <p className="text-xs text-[#536781] leading-relaxed">
                          {hodMember.department || festival.department}
                        </p>
                      </div>
                    </div>

                    {/* HOD Statement & Scope */}
                    <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-4 pt-2 lg:pt-0">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E93AC] block mb-2">
                          PATRON&apos;S ADDRESS &amp; ACADEMIC VISION
                        </span>
                        <blockquote className="text-xs sm:text-sm lg:text-base text-[#10264A] font-medium leading-relaxed italic border-l-3 border-[#3978F6] pl-4 sm:pl-5 py-1 bg-[#F8FAFD] rounded-r-2xl">
                          &ldquo;{hodMember.bio || 'YUGANTAR 2026 stands as the premier confluence of applied circuit intelligence, creative robotics, and technological exploration. We welcome student delegates across Maharashtra to participate in our laboratory tracks.'}&rdquo;
                        </blockquote>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#7E93AC] block mb-1">
                            Institutional Authority
                          </span>
                          <p className="font-semibold text-[#10264A] text-xs">
                            {festival.college}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#7E93AC] block mb-1">
                            Academic Oversight
                          </span>
                          <p className="font-semibold text-[#10264A] text-xs">
                            Symposia, Laboratories &amp; Technical Juries
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Other Faculty Leadership Cards */}
              {otherFaculty.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                  {otherFaculty.map((fac, idx) => (
                    <div
                      key={fac.id || `fac-${idx}`}
                      className="p-5 sm:p-6 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs flex items-start gap-4 hover:border-[#3978F6]/30 transition-all"
                    >
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#DCE5F2] bg-[#E9F2FF] flex items-center justify-center shrink-0">
                        {fac.avatar_url ? (
                          <Image
                            src={fac.avatar_url}
                            alt={fac.name}
                            fill
                            className="object-cover"
                            unoptimized={fac.avatar_url.startsWith('/api/') || fac.avatar_url.includes('google')}
                          />
                        ) : (
                          <span className="text-base font-bold font-display text-[#3978F6]">
                            {(fac.name || 'FC')
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#E9F2FF] text-[#3978F6] text-[10px] font-mono font-bold">
                          Faculty Coordinator
                        </span>
                        <h4 className="text-sm sm:text-base font-display font-bold text-[#10264A] truncate">
                          {fac.name}
                        </h4>
                        <p className="text-xs font-mono text-[#FF783E] font-semibold truncate">
                          {fac.role}
                        </p>
                        {fac.department && (
                          <p className="text-[11px] text-[#7E93AC] truncate">{fac.department}</p>
                        )}
                        {fac.bio && (
                          <p className="text-xs text-[#536781] leading-relaxed pt-1 font-normal">
                            {fac.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Section 4: Organizing Bodies & Committees */}
          <section id="organizers" className="space-y-6 sm:space-y-8">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF783E] bg-[#FFEFE3] border border-[#FFD9C2] px-3 py-1 rounded-full mb-2.5 inline-block">
                ORGANIZATIONAL ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                Organizing Bodies &amp; Committees
              </h2>
              <p className="text-xs sm:text-sm text-[#536781] mt-1 leading-relaxed">
                The institutional forum, academic board, and innovation council responsible for coordinating the festival tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {organizers.map((org, index) => (
                <div
                  key={(org as any).id ? `${(org as any).id}-${index}` : `${org.name}-${index}`}
                  className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-[#FF783E]/40 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {org.logoUrl ? (
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#DCE5F2] bg-[#E9F2FF] flex items-center justify-center p-1">
                          <Image
                            src={org.logoUrl}
                            alt={org.name}
                            fill
                            className="object-contain p-1"
                            unoptimized={org.logoUrl.startsWith('/api/') || org.logoUrl.includes('google')}
                          />
                        </div>
                      ) : (
                        <span className="w-9 h-9 rounded-xl bg-[#E9F2FF] text-[#3978F6] font-mono text-sm font-bold flex items-center justify-center">
                          0{index + 1}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F8FAFD] text-[#3978F6] border border-[#DCE5F2]">
                        {org.badge}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-display font-extrabold text-[#10264A] mb-1.5 leading-snug">
                      {org.name}
                    </h3>

                    <span className="text-xs font-mono text-[#FF783E] font-semibold block mb-3">
                      {org.role}
                    </span>

                    <p className="text-xs sm:text-sm text-[#536781] leading-relaxed mb-5 font-normal">
                      {org.description}
                    </p>
                  </div>

                  {org.leadershipNote && (
                    <div className="pt-3.5 border-t border-[#DCE5F2] text-xs font-mono text-[#10264A] bg-[#F8FAFD] p-3 rounded-2xl">
                      <span className="text-[#7E93AC] block text-[10px] uppercase font-bold mb-1">
                        Operational Scope:
                      </span>
                      <p className="text-[11px] text-[#536781] leading-normal">{org.leadershipNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Student Organizing Team (TurboBits) - Mobile First Redesign */}
          {turboBitsTeam.length > 0 && (
            <section id="turbo-bits-team" className="space-y-6 sm:space-y-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2FF] border border-[#BFDBFE] text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider mb-2.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>STUDENT TECHNICAL &amp; OPERATIONS TEAM</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                  TurboBits Student Organizing Team
                </h2>
                <p className="text-xs sm:text-sm text-[#536781] mt-1.5 leading-relaxed">
                  Hosted by the Department of Electronics &amp; Telecommunication Engineering at Priyadarshini College of Engineering (PCE) in association with the TELE-ERA Student Forum. The TurboBits team is the dedicated student engineering, design, and operations unit building the digital systems, laboratory infrastructure, and live event coordination for YUGANTAR 2026.
                </p>
              </div>

              {/* Responsive Team Grid: Single-column on mobile (<640px) to prevent cramping/truncation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {turboBitsTeam.map((member: DbOrganizerMember, idx: number) => {
                  const hasGithub = member.github_url && member.github_url.trim().length > 0;
                  const hasLinkedin = member.linkedin_url && member.linkedin_url.trim().length > 0;
                  const roleLower = (member.role || '').toLowerCase();
                  const isLead = roleLower.includes('lead') || roleLower.includes('head');

                  // Optional crop style
                  let cropStyle: React.CSSProperties = { objectFit: 'cover' };
                  if (member.crop_data) {
                    try {
                      const c = typeof member.crop_data === 'string' ? JSON.parse(member.crop_data) : member.crop_data;
                      if (c.zoom || c.x !== undefined || c.y !== undefined) {
                        cropStyle = {
                          objectFit: 'cover',
                          transform: `scale(${c.zoom || 1}) translate(${c.x || 0}%, ${c.y || 0}%)`,
                          transformOrigin: 'center center',
                        };
                      }
                    } catch {}
                  }

                  return (
                    <div
                      key={member.id ? `${member.id}-${idx}` : `tb-${idx}`}
                      className="turbobits-card p-5 sm:p-6 rounded-3xl bg-white border border-[#DCE5F2] shadow-xs flex flex-col justify-between hover:border-[#3978F6] hover:shadow-[0_0_30px_-6px_rgba(57,120,246,0.35)] hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="space-y-3.5">
                        {/* Member Header with Avatar, Name, and Role */}
                        <div className="flex items-start gap-4">
                          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-[#DCE5F2] bg-[#E9F2FF] flex items-center justify-center shadow-2xs shrink-0 group-hover:border-[#3978F6]/70 transition-colors">
                            {member.avatar_url ? (
                              <Image
                                src={member.avatar_url}
                                alt={member.name}
                                fill
                                style={cropStyle}
                                className="transition-transform duration-300 group-hover:scale-105"
                                unoptimized={member.avatar_url.startsWith('/api/') || member.avatar_url.includes('google')}
                              />
                            ) : (
                              <span className="text-lg font-bold font-display text-[#3978F6]">
                                {(member.name || 'TB')
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            {isLead ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[#FFEFE3] text-[#FF783E] text-[10px] font-mono font-bold uppercase tracking-wider">
                                TurboBits Lead
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[#EBF2FF] text-[#2563EB] text-[10px] font-mono font-bold uppercase tracking-wider">
                                {member.role || 'TurboBits Member'}
                              </span>
                            )}

                            {member.forum_designation && (
                              <div className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-flex items-center gap-1">
                                <span>{member.forum_designation}</span>
                              </div>
                            )}

                            <h3 className="text-base sm:text-lg font-display font-extrabold text-[#10264A] leading-snug break-words">
                              {member.name}
                            </h3>
                            <p className="text-xs font-mono font-bold text-[#3978F6] leading-snug break-words">
                              {member.role}
                            </p>
                          </div>
                        </div>

                        {/* Department / Committee Badge */}
                        <div className="flex items-center gap-2 text-[11px] text-[#7E93AC] font-mono">
                          <Layers className="w-3.5 h-3.5 text-[#3978F6]" />
                          <span className="truncate">{member.department || 'ETC Department, PCE'}</span>
                        </div>

                        {/* Bio / Responsibility Scope */}
                        {member.bio && (
                          <div className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2]/80 text-xs text-[#536781] leading-relaxed">
                            <p className="font-normal text-[11px] sm:text-xs">
                              {member.bio}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer: Social Links (Only rendered when configured) */}
                      <div className="pt-4 mt-4 border-t border-[#DCE5F2] flex items-center justify-between">
                        {showOrganizerOrder ? (
                          <span className="text-[10px] font-mono text-[#7E93AC] font-semibold">
                            Order #{member.display_order + 1}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#7E93AC]/60">
                            PCE · ETC
                          </span>
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
                              <GithubSocialIcon className="w-3.5 h-3.5" />
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
                              <LinkedinSocialIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px]">LinkedIn</span>
                            </a>
                          )}
                          {!hasGithub && !hasLinkedin && (
                            <span className="text-[10px] font-mono text-[#7E93AC]">
                              Verified Student Coordinator
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile center-focus highlight observer */}
              <TurboBitsObserver />
            </section>
          )}

          {/* Section 6: Department Heritage & Campus Coordinates */}
          <section id="campus" className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-10 lg:p-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3978F6] bg-[#E9F2FF] px-3 py-1 rounded-full inline-block">
                  HOST DEPARTMENT &amp; INSTITUTION
                </span>

                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                  Department of Electronics &amp; Telecommunication Engineering
                </h2>

                <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
                  The Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur has been at the forefront of technical education, applied research, and student innovation.
                </p>

                <p className="text-xs sm:text-sm text-[#7E93AC] leading-relaxed font-normal">
                  YUGANTAR serves as the department&apos;s annual flagship technical conclave. By combining hardware prototype exhibitions, timed laboratory circuit challenges, technical paper conferences, and corporate recruitment simulations, the festival bridges academic theory with practical engineering application.
                </p>

                <div className="flex items-center gap-2.5 text-xs font-mono text-[#3978F6] font-semibold pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priyadarshini College of Engineering, Nagpur (Autonomous)</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#10264A]">
                  Venue &amp; Campus Coordinates
                </h3>

                <div className="space-y-3 text-xs text-[#536781]">
                  <div>
                    <span className="text-[#7E93AC] text-[10px] font-mono block mb-0.5 uppercase">Campus Address</span>
                    <p className="font-semibold text-[#10264A]">{festival.address}</p>
                  </div>
                  <div>
                    <span className="text-[#7E93AC] text-[10px] font-mono block mb-0.5 uppercase">Host Institution</span>
                    <p className="font-semibold text-[#10264A]">{festival.college}</p>
                  </div>
                  <div>
                    <span className="text-[#7E93AC] text-[10px] font-mono block mb-0.5 uppercase">Symposium Date</span>
                    <p className="font-mono font-bold text-[#3978F6]">{festival.date}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCE5F2]">
                  <Link
                    href="/competitions"
                    className="nexus-btn-primary w-full py-2.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 flex items-center justify-center"
                  >
                    <span>View All 8 Competitions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* Section 7: Closing Call to Action */}
          <section className="rounded-3xl bg-gradient-to-r from-[#E9F2FF] via-[#F4F8FD] to-[#FFEFE3] p-8 sm:p-12 border border-[#DCE5F2] text-center relative overflow-hidden">
            <div className="max-w-xl mx-auto relative z-10 space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF783E] bg-white px-3 py-1 rounded-full shadow-2xs inline-block">
                BE PART OF NEXUS CITY
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A]">
                Join Us at YUGANTAR 2026
              </h3>
              <p className="text-xs sm:text-sm text-[#536781] leading-relaxed max-w-lg mx-auto font-normal">
                Explore the eight competition tracks and prepare your team for a landmark day of engineering innovation at PCE Nagpur.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/competitions"
                  className="nexus-btn-primary px-6 py-2.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-xs"
                >
                  <span>Explore Competitions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/journey"
                  className="nexus-btn-secondary px-6 py-2.5 text-xs font-mono font-bold tracking-wider uppercase gap-2"
                >
                  <Compass className="w-4 h-4 text-[#3978F6]" />
                  <span>Delegate Journey</span>
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer festival={festival} />
    </div>
  );
}
