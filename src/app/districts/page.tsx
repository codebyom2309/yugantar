'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { COMPETITIONS as FALLBACK_COMPETITIONS, Competition, FESTIVAL_ASSETS } from '@/data/events';
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

const ETC_CENTRAL_SPIRE = {
  id: 'etc-department',
  name: 'Department of ETC & Tele-Era Forum',
  district: 'Central Spire (ETC Dept)',
  districtIndex: -1,
  category: 'Host Department & Directorate',
  districtTagline: 'The institutional beacon and administrative nexus connecting all eight technological arenas.',
  shortDescription:
    'Department of Electronics and Telecommunication Engineering, Priyadarshini College of Engineering, Nagpur. The central architectural spire and administrative nexus connecting all 8 technological arenas of YUGANTAR 2026.',
  highlights: [
    'Department of Electronics & Telecommunication Engineering',
    'Tele-Era Department Student Forum',
    'Campus Venue: CRPF Gate No. 3, Hingna Road, Nagpur',
  ],
  mapCoords: { x: 50, y: 28 },
  accentColor: '#3978F6',
  accentBg: 'rgba(57, 120, 246, 0.1)',
  slug: '',
};

export default function DistrictsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>(FALLBACK_COMPETITIONS);
  const [mapArtwork, setMapArtwork] = useState<string>(FESTIVAL_ASSETS.districtsMap);
  const [activeNodeId, setActiveNodeId] = useState<string>(FALLBACK_COMPETITIONS[0].id);

  useEffect(() => {
    fetch('/api/competitions')
      .then((r) => r.json())
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
        if (data.festival?.districts_map) {
          setMapArtwork(data.festival.districts_map);
        }
      })
      .catch((err) => console.warn('Failed to load DB competitions for districts page, using fallback:', err));
  }, []);

  const isCenterSelected = activeNodeId === ETC_CENTRAL_SPIRE.id;
  const activeCompetition =
    competitions.find((c) => c.id === activeNodeId) || competitions[0] || FALLBACK_COMPETITIONS[0];

  const Icon = isCenterSelected ? Landmark : (ICON_MAP[activeCompetition.iconName] || Cpu);

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header in Pale Sky Blue Atmosphere */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-16 bg-gradient-to-b from-[#EDF5FC] to-[#F8FAFD] overflow-hidden border-b border-[#DCE5F2]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFF4EA] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-5">
            <Link href="/" className="hover:text-[#15294A] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3B82F6] font-semibold">NEXUS Districts Map</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#FFE0CE] text-xs font-mono font-bold text-[#FF874D] uppercase tracking-wider mb-4 shadow-2xs">
              <Compass className="w-3.5 h-3.5" />
              <span>SPATIAL EXPLORATION · NEXUS CITY</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#15294A] mb-4 sm:mb-5 text-balance">
              The Eight Districts of <br className="hidden sm:inline" />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                NEXUS CITY.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed mb-6 font-normal">
              In the YUGANTAR 2026 creative concept, each competition is an architectural district of the futuristic NEXUS CITY connected to the central Department of ETC spire. Discover the connections between tracks, locate your arena, and enter the competition dossier.
            </p>
          </div>
        </div>
      </section>

      {/* Main Interactive Map & Details Area */}
      <main className="py-10 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 cols: Interactive Map Canvas */}
            <div className="lg:col-span-8 rounded-3xl bg-white p-4 sm:p-6 border border-[#DCE5F2] shadow-xs">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-mono font-bold uppercase text-[#15294A] tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF874D]" />
                  Interactive City Layout
                </span>
                <span className="text-xs font-mono text-[#7E93AC]">
                  Click center spire or any arena pin
                </span>
              </div>

              {/* Map Canvas with Floating Islands on Light Sky Backdrop */}
              <div className="relative w-full aspect-[1536/1024] rounded-2xl overflow-hidden bg-gradient-to-b from-[#EDF5FC] via-[#F4F9FD] to-[#EDF5FC] border border-[#DCE5F2]">
                <Image
                  src={mapArtwork}
                  alt="NEXUS CITY Eight Competition Districts and Central ETC Spire Map"
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
                    isCenterSelected ? 'scale-125 z-35 ring-4 ring-[#3978F6]/30' : 'hover:scale-110'
                  }`}
                  aria-label="Select Central Spire: Department of ETC"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3978F6] flex items-center justify-center text-white shadow-lg border-2 border-white transition-all">
                    <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" />
                  </div>
                </button>

                {/* 2. Hotspots for the 8 Competition Programs */}
                {competitions.slice(0, 8).map((comp) => {
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
                        isActive ? 'scale-120 z-30 ring-4 ring-[#FF783E]/30' : 'hover:scale-108'
                      }`}
                      aria-label={`Select ${comp.district}: ${comp.name}`}
                    >
                      <div
                        style={{ backgroundColor: isActive ? '#FF783E' : '#10264A' }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile & Desktop Quick Switcher Chips */}
              <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                <span className="text-xs font-mono font-bold uppercase text-[#536781] block mb-3">
                  Quick District Selector:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {/* Center Spire Chip */}
                  <button
                    type="button"
                    onClick={() => setActiveNodeId(ETC_CENTRAL_SPIRE.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-mono transition-all flex items-center gap-2 border ${
                      isCenterSelected
                        ? 'bg-[#1D63B8] text-white border-[#1D63B8] shadow-2xs'
                        : 'bg-[#F8FAFD] text-[#15294A] border-[#DCE5F2] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCenterSelected ? 'bg-white text-[#1D63B8]' : 'bg-[#3978F6] text-white'
                      }`}
                    >
                      HQ
                    </span>
                    <span className="truncate font-semibold">ETC Spire</span>
                  </button>

                  {/* 8 Competitions Chips */}
                  {competitions.slice(0, 8).map((comp, idx) => {
                    const isActive = comp.id === activeNodeId && !isCenterSelected;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => setActiveNodeId(comp.id)}
                        type="button"
                        className={`p-2.5 rounded-xl text-left text-xs font-mono transition-all flex items-center gap-2 border ${
                          isActive
                            ? 'bg-[#15294A] text-white border-[#15294A] shadow-2xs'
                            : 'bg-[#F8FAFD] text-[#15294A] border-[#DCE5F2] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive ? 'bg-[#FF874D] text-white' : 'bg-[#E2E8F0] text-[#15294A]'
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
            <div className="lg:col-span-4 rounded-3xl bg-white p-6 sm:p-8 border border-[#DCE5F2] shadow-xs lg:sticky lg:top-28">
              {isCenterSelected ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#EBF4FE] text-[#3978F6] border border-[#D0E6FC]">
                      CAMPUS CITADEL
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#60728A]">
                      Host Directorate
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border border-black/5 bg-[#EBF4FE] text-[#3978F6]">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold uppercase text-[#3978F6] block">
                        {ETC_CENTRAL_SPIRE.district}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#172B49]">
                        {ETC_CENTRAL_SPIRE.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-6 font-normal">
                    {ETC_CENTRAL_SPIRE.shortDescription}
                  </p>

                  <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] mb-6 text-xs text-[#172B49] italic">
                    &ldquo;{ETC_CENTRAL_SPIRE.districtTagline}&rdquo;
                  </div>

                  <div className="space-y-2 mb-7">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#8CA0BA] block">
                      Secretariat Details
                    </span>
                    {ETC_CENTRAL_SPIRE.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#60728A]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3978F6] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/competitions"
                    className="nexus-btn-sapphire w-full py-3.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm justify-center"
                  >
                    <span>Explore 8 Competitions</span>
                    <ArrowRight className="w-4 h-4 text-[#FF783E]" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#FFF4EA] text-[#E07A43] border border-[#F0E5D8]">
                      ARENA 0{activeCompetition.districtIndex + 1}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#60728A]">
                      {activeCompetition.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div
                      style={{
                        backgroundColor: activeCompetition.accentBg,
                        color: activeCompetition.accentColor,
                      }}
                      className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border border-black/5"
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold uppercase text-[#E07A43] block">
                        {activeCompetition.district}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#172B49]">
                        {activeCompetition.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-6 font-normal">
                    {activeCompetition.shortDescription}
                  </p>

                  <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] mb-6 text-xs text-[#172B49] italic">
                    &ldquo;{activeCompetition.districtTagline}&rdquo;
                  </div>

                  <div className="space-y-2 mb-7">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#8CA0BA] block">
                      Track Highlights
                    </span>
                    {activeCompetition.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#60728A]">
                        <span
                          style={{ backgroundColor: activeCompetition.accentColor }}
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                        />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/competitions/${activeCompetition.slug}`}
                    className="nexus-btn-ink w-full py-3.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm justify-center"
                  >
                    <span>Enter {activeCompetition.name}</span>
                    <ArrowRight className="w-4 h-4 text-[#F5A16F]" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
