'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FESTIVAL_JOURNEY, FESTIVAL_INFO } from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import {
  Compass,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  CheckSquare,
  FileCheck,
  Flag,
  Award,
  Layers,
  Building2,
  Users,
} from 'lucide-react';
import type { FestivalSettings } from '@/lib/competitions';

const TIMELINE_METADATA = [
  {
    icon: Flag,
    venue: 'Central Concourse · Department of ETC, PCE',
    badge: 'STAGE 01 · ORIENTATION',
    timing: '08:30 AM Onwards',
    highlights: ['Credential packet verification', 'Physical delegate badge issuance', 'District floor map handoff'],
    accent: '#3978F6',
  },
  {
    icon: Compass,
    venue: 'Department Laboratories & Innovation Arenas',
    badge: 'STAGE 02 · STAGING',
    timing: '09:30 AM - 10:00 AM',
    highlights: ['Hardware bench setup & electrical testing', 'Workstation allocation & system checks', 'Jury panel alignment'],
    accent: '#8957E5',
  },
  {
    icon: Layers,
    venue: '8 Specialized Competition Arenas Across Campus',
    badge: 'STAGE 03 · COMPETITION',
    timing: '10:00 AM - 02:00 PM',
    highlights: ['Timed circuit wiring & prototype defense', 'Live Q&A viva with faculty & industry juries', 'Scoring matrix compilation'],
    accent: '#FF783E',
  },
  {
    icon: Award,
    venue: 'Central Auditorium · PCE Campus',
    badge: 'STAGE 04 · VALEDICTORY',
    timing: '02:30 PM - 04:30 PM',
    highlights: ['Distinguished keynote address', 'Announcement of champion podiums & cash prizes', 'Certificate conferral ceremony'],
    accent: '#10B981',
  },
];

export default function JourneyPage() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [festival, setFestival] = useState<FestivalSettings | undefined>(undefined);

  useEffect(() => {
    fetchClientFestivalData()
      .then((d) => {
        if (d.festival) {
          setFestival(d.festival);
        }
      })
      .catch((err) => console.warn('Failed to load festival settings:', err));
  }, []);

  const eventName = festival?.name || FESTIVAL_INFO.name;
  const eventEdition = festival?.edition || FESTIVAL_INFO.edition;
  const eventDate = festival?.date || FESTIVAL_INFO.date;
  const eventLocation = festival?.locationShort || FESTIVAL_INFO.locationShort;
  const eventVenue = festival?.venue || FESTIVAL_INFO.venue;

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header with supplied background asset for both mobile and desktop view */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-10 sm:pb-14 bg-gradient-to-b from-[#EDF5FC] via-[#F4F8FD] to-[#F8FAFD] overflow-hidden border-b border-[#DCE5F2]">
        
        {/* Supplied Background Asset for both Mobile and Desktop */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-75 sm:opacity-85">
          <Image
            src="/images/nexus-city/journey-hero-bg.webp"
            alt="YUGANTAR 2026 Delegate Journey Roadmap"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EDF5FC]/40 via-[#F8FAFD]/70 to-[#F8FAFD]" />
        </div>

        {/* Ambient atmospheric glows (cool pale-blue and subtle electric-blue) */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#E9F2FF] rounded-full blur-3xl pointer-events-none opacity-70" />
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-[#3978F6]/10 rounded-full blur-3xl pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb - Compact spacing beneath navbar */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-3 sm:mb-4">
            <Link href="/" className="hover:text-[#10264A] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3978F6] font-semibold">Festival Journey Roadmap</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#FFE0CE] text-[11px] font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-3 shadow-2xs">
              <Navigation className="w-3.5 h-3.5" />
              <span>THE DELEGATE EXPERIENCE ROADMAP</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#10264A] mb-3 text-balance leading-tight">
              The Journey Through <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal text-3xl sm:text-5xl lg:text-6xl">
                {eventName} {eventEdition}.
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#536781] leading-relaxed mb-5 font-normal max-w-2xl">
              A structured roadmap explaining how delegates participate in the festival—from initial track selection and campus concourse check-in to technical jury defense and the central valedictory assembly.
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-[#10264A]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-[#DCE5F2] shadow-2xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#3978F6]" />
                <span>{eventDate}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-[#DCE5F2] shadow-2xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#FF783E]" />
                <span>{eventLocation}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-xs border border-[#DCE5F2] shadow-2xs text-[#536781]">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full-Day Symposium Flow</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Roadmap Timeline */}
      <main className="py-12 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Quick Stage Navigation Selector */}
          <div className="p-3 sm:p-4 rounded-3xl bg-white border border-[#DCE5F2] shadow-2xs">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {FESTIVAL_JOURNEY.map((item, index) => {
                const isSelected = activeStep === index;
                const meta = TIMELINE_METADATA[index] || TIMELINE_METADATA[0];
                return (
                  <button
                    key={item.step}
                    onClick={() => setActiveStep(index)}
                    type="button"
                    className={`flex-1 min-w-[200px] sm:min-w-0 p-3 sm:p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#E9F2FF] border-[#3978F6] text-[#10264A] shadow-xs'
                        : 'bg-[#F8FAFD] border-transparent hover:border-[#DCE5F2] text-[#536781]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isSelected ? 'text-[#3978F6]' : 'text-[#7E93AC]'}`}>
                        Stage 0{index + 1}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#3978F6] animate-pulse" />}
                    </div>
                    <p className="text-xs sm:text-sm font-display font-extrabold truncate text-[#10264A]">
                      {item.title}
                    </p>
                    <span className="text-[11px] font-mono text-[#7E93AC] truncate block mt-0.5">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Vertical Timeline */}
          <div className="relative">
            
            {/* Continuous Vertical Connecting Line */}
            <div className="absolute top-8 bottom-8 left-6 sm:left-8 md:left-10 w-0.5 bg-gradient-to-b from-[#3978F6] via-[#FF783E] to-emerald-500 hidden sm:block" />

            <div className="space-y-10 sm:space-y-12">
              {FESTIVAL_JOURNEY.map((item, index) => {
                const meta = TIMELINE_METADATA[index] || TIMELINE_METADATA[0];
                const IconComponent = meta.icon;
                const isCurrentActive = activeStep === index;

                return (
                  <div
                    key={item.step}
                    className={`relative transition-all duration-300 ${isCurrentActive ? 'scale-[1.005]' : 'opacity-95'}`}
                  >
                    <div className="sm:pl-20 md:pl-24">
                      
                      {/* Timeline Node Marker on Line (Desktop & Tablet) */}
                      <div className="hidden sm:flex absolute left-4 md:left-6 top-6 w-9 h-9 rounded-2xl bg-white border-2 border-[#DCE5F2] items-center justify-center text-[#10264A] shadow-xs z-10 -translate-x-1/2 group-hover:border-[#3978F6]">
                        <span className="text-xs font-mono font-extrabold text-[#3978F6]">
                          0{index + 1}
                        </span>
                      </div>

                      {/* Main Timeline Card */}
                      <div className={`rounded-3xl bg-white border p-6 sm:p-8 lg:p-9 shadow-xs transition-all ${
                        isCurrentActive
                          ? 'border-[#3978F6]/60 ring-2 ring-[#3978F6]/10 shadow-sm'
                          : 'border-[#DCE5F2] hover:border-[#3978F6]/30'
                      }`}>
                        
                        {/* Mobile Step Header with Marker */}
                        <div className="flex sm:hidden items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#DCE5F2]">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9F2FF] text-[#3978F6] font-mono text-[11px] font-bold">
                            <span>Stage 0{index + 1}</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#FF783E]">
                            {meta.badge}
                          </span>
                        </div>

                        {/* Card Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div>
                            <span className="hidden sm:inline-block text-[11px] font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-1">
                              {meta.badge}
                            </span>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                              {item.title}
                            </h2>
                            <span className="text-xs sm:text-sm font-mono font-bold text-[#3978F6] block mt-0.5">
                              {item.subtitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2] text-xs font-mono font-semibold text-[#536781]">
                              <Clock className="w-3.5 h-3.5 text-[#3978F6]" />
                              <span>{meta.timing}</span>
                            </span>
                          </div>
                        </div>

                        {/* Stage Summary Description */}
                        <p className="text-xs sm:text-sm lg:text-base text-[#536781] leading-relaxed mb-5 font-normal max-w-3xl">
                          {item.description}
                        </p>

                        {/* Operational Details & Highlights Box */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2]">
                          
                          <div className="lg:col-span-7 space-y-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7E93AC] block">
                              OPERATIONAL INSTRUCTIONS &amp; PROCEDURE
                            </span>
                            <p className="text-xs sm:text-sm text-[#10264A] leading-relaxed font-normal">
                              {item.details}
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-xs text-[#536781] font-mono">
                              <MapPin className="w-3.5 h-3.5 text-[#FF783E] shrink-0" />
                              <span className="truncate">{meta.venue}</span>
                            </div>
                          </div>

                          <div className="lg:col-span-5 lg:border-l lg:border-[#DCE5F2] lg:pl-5 space-y-2 pt-2 lg:pt-0">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7E93AC] block">
                              KEY CHECKPOINTS
                            </span>
                            <ul className="space-y-1.5 text-xs text-[#536781]">
                              {meta.highlights.map((point, hIdx) => (
                                <li key={hIdx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                        </div>

                        {/* Bottom Card Action */}
                        <div className="mt-5 pt-4 border-t border-[#DCE5F2] flex flex-wrap items-center justify-between gap-3 text-xs">
                          <span className="text-[11px] font-mono text-[#7E93AC]">
                            Verified delegate progression workflow
                          </span>

                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <Link
                                href="/competitions"
                                className="nexus-btn-primary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider gap-1.5"
                              >
                                <span>Register for Arenas</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            {index === 1 && (
                              <Link
                                href="/districts"
                                className="nexus-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider gap-1.5"
                              >
                                <Compass className="w-3.5 h-3.5 text-[#3978F6]" />
                                <span>Open Districts Map</span>
                              </Link>
                            )}
                            {index === 2 && (
                              <Link
                                href="/competitions"
                                className="nexus-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider gap-1.5"
                              >
                                <span>Browse Challenge Rubrics</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            {index === 3 && (
                              <Link
                                href="/about#campus"
                                className="nexus-btn-secondary px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider gap-1.5"
                              >
                                <span>Auditorium Coordinates</span>
                                <MapPin className="w-3.5 h-3.5 text-[#FF783E]" />
                              </Link>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delegate Readiness Checklist Banner */}
          <div className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-10 lg:p-12 shadow-xs">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9F2FF] border border-[#D2E4FF] text-[11px] font-mono font-bold text-[#3978F6] uppercase">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>PRE-EVENT DELEGATE READINESS CHECKLIST</span>
              </div>

              <h2 className="text-xl sm:text-3xl font-display font-extrabold text-[#10264A] tracking-tight">
                Mandatory Checkpoints Before Arrival
              </h2>

              <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
                To guarantee swift access through the registration concourse on {eventDate}, ensure that every member of your team fulfills the following requirements:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#10264A]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Valid Student Identity Card</span>
                  </div>
                  <p className="text-[11px] text-[#536781] leading-relaxed">
                    Issued by your college or university. Required for campus security and accreditation passes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#10264A]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Digital Pass / Confirmation</span>
                  </div>
                  <p className="text-[11px] text-[#536781] leading-relaxed">
                    Have your registration confirmation email or digital pass token ready on your mobile device.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#10264A]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Hardware Kits &amp; Extension Cords</span>
                  </div>
                  <p className="text-[11px] text-[#536781] leading-relaxed">
                    For hardware arenas (Project Competition &amp; Breadboard), bring tested circuits, multimeters, and components.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#10264A]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Technical Synopsis / Poster</span>
                  </div>
                  <p className="text-[11px] text-[#536781] leading-relaxed">
                    For symposium tracks (PPT Presentation &amp; Ideathon), bring your presentation slides on a USB drive.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2 text-xs font-mono text-[#7E93AC]">
                <ShieldCheck className="w-4 h-4 text-[#3978F6] shrink-0" />
                <span>Supervised by Department of ETC &amp; TELE-ERA Student Forum · Priyadarshini College of Engineering, Nagpur</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer festival={festival} />
    </div>
  );
}
