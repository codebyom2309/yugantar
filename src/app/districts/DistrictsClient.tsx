'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { COMPETITIONS as FALLBACK_COMPETITIONS, Competition, FESTIVAL_ASSETS, FESTIVAL_INFO } from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import {
  Compass,
  MapPin,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Layers,
  Cpu,
  Presentation,
  Zap,
  Lightbulb,
  Briefcase,
  Image as ImageIcon,
  Gamepad2,
  Mic2,
  Landmark,
  CheckCircle2,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { FestivalSettings } from '@/lib/competitions';

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

const ETC_CENTRAL_SPIRE = {
  id: 'etc-department',
  name: 'Department of ETC & TELE-ERA Forum',
  district: 'Central Spire (ETC Dept)',
  districtIndex: -1,
  category: 'Host Department & Directorate',
  districtTagline: 'The institutional beacon and administrative nexus connecting all nine technological arenas.',
  shortDescription:
    'Department of Electronics and Telecommunication Engineering, Priyadarshini College of Engineering, Nagpur. The central architectural spire and administrative nexus connecting all 9 technological arenas of YUGANTAR 2026.',
  highlights: [
    'Department of Electronics & Telecommunication Engineering',
    'TELE-ERA Department Student Forum (Host Forum)',
    'Campus Venue: CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur',
  ],
  mapCoords: { x: 50, y: 28 },
  accentColor: '#3978F6',
  accentBg: 'rgba(57, 120, 246, 0.1)',
  slug: '',
};

export default function DistrictsClient() {
  const [competitions, setCompetitions] = useState<Competition[]>(FALLBACK_COMPETITIONS);
  const [mapArtwork, setMapArtwork] = useState<string>(FESTIVAL_ASSETS.districtsMap);
  const [activeNodeId, setActiveNodeId] = useState<string>(FALLBACK_COMPETITIONS[0].id);
  const [festival, setFestival] = useState<FestivalSettings | undefined>(undefined);

  useEffect(() => {
    fetchClientFestivalData()
      .then((data) => {
        if (data.competitions && data.competitions.length > 0) {
          const dbComps = data.competitions.map((c: any, idx: number) => {
            const fallback =
              FALLBACK_COMPETITIONS.find((fc) => fc.slug === c.slug) ||
              FALLBACK_COMPETITIONS[idx] ||
              FALLBACK_COMPETITIONS[0];
            return {
              ...fallback,
              id: c.slug,
              name: c.name || fallback.name,
              category: c.category || fallback.category,
              shortDescription:
                c.short_description || c.shortDescription || fallback.shortDescription,
              district: c.district || fallback.district,
              districtIndex: c.district_index ?? fallback.districtIndex,
              highlights:
                (typeof c.highlights === 'string'
                  ? JSON.parse(c.highlights)
                  : c.highlights) || fallback.highlights,
              mapCoords:
                (typeof c.map_coords === 'string'
                  ? JSON.parse(c.map_coords)
                  : c.map_coords) || fallback.mapCoords,
            };
          });
          setCompetitions(dbComps);
        }
        if (data.festival?.districts_map || data.festival?.districtsMap) {
          setMapArtwork(String(data.festival.districts_map || data.festival.districtsMap));
        }
        if (data.festival) {
          setFestival(data.festival);
        }
      })
      .catch((err) => console.warn('Failed to load DB competitions for districts page, using fallback:', err));
  }, []);

  const isCenterSelected = activeNodeId === ETC_CENTRAL_SPIRE.id;
  const activeCompetition =
    competitions.find((c) => c.id === activeNodeId) || competitions[0] || FALLBACK_COMPETITIONS[0];

  const Icon = isCenterSelected ? Landmark : (ICON_MAP[activeCompetition.iconName] || Cpu);

  const eventName = festival?.name || FESTIVAL_INFO.name;
  const eventEdition = festival?.edition || FESTIVAL_INFO.edition;
  const eventDate = festival?.date || FESTIVAL_INFO.date;
  const eventLocation = festival?.locationShort || FESTIVAL_INFO.locationShort;

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header with supplied background asset for both mobile and desktop view */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-10 sm:pb-14 bg-gradient-to-b from-[#EDF5FC] via-[#F4F8FD] to-[#F8FAFD] overflow-hidden border-b border-[#DCE5F2]">
        
        {/* Supplied Background Asset for both Mobile and Desktop */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-75 sm:opacity-85">
          <Image
            src="/images/nexus-city/districts-hero-bg.webp"
            alt="NEXUS CITY Districts Map"
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
            <Link href="/" className="hover:text-[#10264A] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3978F6] font-semibold">NEXUS Districts Map</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#FFE0CE] text-[11px] font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-3 shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
              <span>SPATIAL EXPLORATION · NEXUS CITY</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#10264A] mb-3 text-balance leading-tight">
              The Nine Districts of <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal text-3xl sm:text-5xl lg:text-6xl">
                NEXUS CITY.
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#536781] leading-relaxed mb-5 font-normal max-w-2xl">
              In the {eventName} {eventEdition} creative concept, each competition is an architectural district of the futuristic NEXUS CITY connected to the central Department of ETC spire. Discover the connections between tracks, locate your arena, and enter the competition dossier.
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
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>{competitions.length} Arenas + 1 Central Citadel</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Map & Details Area */}
      <main className="py-10 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 cols: Interactive Map Canvas */}
            <div
              suppressHydrationWarning
              className="yugantar-card-interactive glow-cyan lg:col-span-8 rounded-3xl bg-white p-4 sm:p-6 border border-[#DCE5F2] shadow-xs transition-all"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-mono font-bold uppercase text-[#10264A] tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF783E] animate-pulse" />
                  Interactive City Layout
                </span>
                <span className="text-[11px] font-mono text-[#7E93AC]">
                  Click center spire or any arena pin
                </span>
              </div>

              {/* Map Canvas with Controlled Aspect Ratio and Scaling */}
              <div className="relative w-full aspect-[1536/1024] rounded-2xl overflow-hidden bg-gradient-to-b from-[#EDF5FC] via-[#F4F9FD] to-[#EDF5FC] border border-[#DCE5F2] shadow-inner">
                <Image
                  src={mapArtwork}
                  alt="NEXUS CITY Nine Competition Districts and Central ETC Spire Map"
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 850px"
                />

                {/* 1. Central Spire Pin: Department of ETC */}
                <button
                  type="button"
                  onClick={() => setActiveNodeId(ETC_CENTRAL_SPIRE.id)}
                  style={{
                    left: `${ETC_CENTRAL_SPIRE.mapCoords.x}%`,
                    top: `${ETC_CENTRAL_SPIRE.mapCoords.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-25 group focus:outline-none transition-all duration-200 cursor-pointer ${
                    isCenterSelected ? 'scale-125 z-35 ring-4 ring-[#3978F6]/40' : 'hover:scale-115'
                  }`}
                  aria-label="Select Central Spire: Department of ETC"
                  title="Central Spire: Department of ETC & TELE-ERA"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3978F6] flex items-center justify-center text-white shadow-lg border-2 border-white transition-all">
                    <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  {isCenterSelected && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#10264A] text-white text-[10px] font-mono font-bold shadow-xs">
                      ETC Citadel
                    </span>
                  )}
                </button>

                {/* 2. Hotspots for the 9 Competition Programs */}
                {competitions.map((comp, idx) => {
                  const isActive = comp.id === activeNodeId && !isCenterSelected;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setActiveNodeId(comp.id)}
                      type="button"
                      style={{
                        left: `${comp.mapCoords.x}%`,
                        top: `${comp.mapCoords.y}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none transition-all duration-200 cursor-pointer ${
                        isActive ? 'scale-125 z-30 ring-4 ring-[#FF783E]/40' : 'hover:scale-110'
                      }`}
                      aria-label={`Select ${comp.district}: ${comp.name}`}
                      title={`${comp.district}: ${comp.name}`}
                    >
                      <div
                        style={{ backgroundColor: isActive ? '#FF783E' : '#10264A' }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-colors"
                      >
                        <span className="text-[10px] sm:text-xs font-mono font-bold">
                          {idx + 1}
                        </span>
                      </div>
                      {isActive && (
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-[#10264A] text-white text-[10px] font-mono font-bold shadow-xs">
                          {comp.name.split(' ')[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mobile & Desktop Quick Switcher Chips */}
              <div className="mt-5 pt-4 border-t border-[#DCE5F2]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold uppercase text-[#536781] block">
                    Quick District Selector:
                  </span>
                  <span className="text-[11px] font-mono text-[#7E93AC]">
                    Tap any to inspect
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {/* Center Spire Chip */}
                  <button
                    type="button"
                    onClick={() => setActiveNodeId(ETC_CENTRAL_SPIRE.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-mono transition-all flex items-center gap-2 border cursor-pointer ${
                      isCenterSelected
                        ? 'bg-[#3978F6] text-white border-[#3978F6] shadow-xs'
                        : 'bg-[#F8FAFD] text-[#10264A] border-[#DCE5F2] hover:bg-[#E9F2FF]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCenterSelected ? 'bg-white text-[#3978F6]' : 'bg-[#3978F6] text-white'
                      }`}
                    >
                      HQ
                    </span>
                    <span className="truncate font-semibold">ETC Citadel</span>
                  </button>

                  {/* 9 Competitions Chips */}
                  {competitions.map((comp, idx) => {
                    const isActive = comp.id === activeNodeId && !isCenterSelected;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => setActiveNodeId(comp.id)}
                        type="button"
                        className={`p-2.5 rounded-xl text-left text-xs font-mono transition-all flex items-center gap-2 border cursor-pointer ${
                          isActive
                            ? 'bg-[#10264A] text-white border-[#10264A] shadow-xs'
                            : 'bg-[#F8FAFD] text-[#10264A] border-[#DCE5F2] hover:bg-[#FFEFE3]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isActive ? 'bg-[#FF783E] text-white' : 'bg-[#DCE5F2] text-[#10264A]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate font-semibold">
                          {comp.district.replace(' District', '').replace(' Concourse', '').replace(' Arena', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 cols: Active District Profile & Route to Detail */}
            <div
              suppressHydrationWarning
              className="yugantar-card-interactive glow-cyan lg:col-span-4 rounded-3xl bg-white p-6 sm:p-8 border border-[#DCE5F2] shadow-xs lg:sticky lg:top-24 transition-all"
            >
              {isCenterSelected ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#E9F2FF] text-[#3978F6] border border-[#D2E4FF]">
                      CAMPUS CITADEL
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#536781]">
                      Host Directorate
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border border-[#DCE5F2] bg-[#E9F2FF] text-[#3978F6]">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase text-[#3978F6] block">
                        {ETC_CENTRAL_SPIRE.district}
                      </span>
                      <h3 className="text-lg sm:text-xl font-display font-extrabold text-[#10264A] leading-tight">
                        {ETC_CENTRAL_SPIRE.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
                    {ETC_CENTRAL_SPIRE.shortDescription}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] text-xs text-[#10264A] italic">
                    &ldquo;{ETC_CENTRAL_SPIRE.districtTagline}&rdquo;
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#7E93AC] block">
                      Secretariat Coordinates
                    </span>
                    {ETC_CENTRAL_SPIRE.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#536781]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3978F6] shrink-0 mt-0.5" />
                        <span className="leading-tight">{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/competitions"
                      className="nexus-btn-primary w-full py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-xs justify-center flex items-center"
                    >
                      <span>Explore All Competitions</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#FFEFE3] text-[#FF783E] border border-[#FFD9C2]">
                      ARENA 0{activeCompetition.districtIndex + 1}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#536781]">
                      {activeCompetition.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div
                      style={{
                        backgroundColor: activeCompetition.accentBg,
                        color: activeCompetition.accentColor,
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border border-black/5"
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase text-[#FF783E] block">
                        {activeCompetition.district}
                      </span>
                      <h3 className="text-lg sm:text-xl font-display font-extrabold text-[#10264A] leading-tight">
                        {activeCompetition.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
                    {activeCompetition.shortDescription}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] text-xs text-[#10264A] italic">
                    &ldquo;{activeCompetition.districtTagline}&rdquo;
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#7E93AC] block">
                      Track Details &amp; Venue
                    </span>
                    <div className="flex items-start gap-2 text-xs text-[#536781]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF783E] shrink-0 mt-0.5" />
                      <span>{activeCompetition.venue || 'ETC Department Complex, PCE'}</span>
                    </div>
                    {activeCompetition.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#536781]">
                        <span
                          style={{ backgroundColor: activeCompetition.accentColor }}
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                        />
                        <span className="leading-tight">{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/competitions/${activeCompetition.slug}`}
                      className="nexus-btn-primary w-full py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-xs justify-center flex items-center"
                    >
                      <span>Enter {activeCompetition.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer festival={festival} />
    </div>
  );
}
