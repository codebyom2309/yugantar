'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { COMPETITIONS as FALLBACK_COMPETITIONS, Competition, FESTIVAL_ASSETS } from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import { MapPin, Compass, ArrowRight, CheckCircle2, Landmark, Sparkles } from 'lucide-react';

const ETC_CENTRAL_SPIRE = {
  id: 'etc-department',
  name: 'Department of ETC & Tele-Era Forum',
  district: 'Central Spire (ETC Dept)',
  districtIndex: -1,
  category: 'Host Department & Directorate',
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

export default function InteractiveCityMap() {
  const shouldReduceMotion = useReducedMotion();
  const [competitions, setCompetitions] = useState<Competition[]>(FALLBACK_COMPETITIONS);
  const [mapArtwork, setMapArtwork] = useState<string>(FESTIVAL_ASSETS.districtsMap);
  const [activeNodeId, setActiveNodeId] = useState<string>(FALLBACK_COMPETITIONS[0].id);

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
      })
      .catch((err) => console.warn('Failed to load DB competitions for map, using fallback:', err));
  }, []);

  const isCenterSelected = activeNodeId === ETC_CENTRAL_SPIRE.id;
  const activeCompetition =
    competitions.find((c) => c.id === activeNodeId) || competitions[0] || FALLBACK_COMPETITIONS[0];

  const fadeIn = (delay = 0) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.45,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <section
      id="city-map"
      className="py-24 sm:py-32 bg-[#EDF5FC]/60 relative overflow-hidden border-b border-[#DCE5F2]"
    >
      {/* Soft atmospheric ambient light */}
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#FFF4EA] to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            {...fadeIn(0)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE5F2] text-xs font-mono font-bold text-[#3978F6] uppercase tracking-wider mb-4 shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-[#3978F6]" />
            <span>NEXUS CITY MAP · DISTRICT PREVIEW</span>
          </motion.div>
          <motion.h2
            {...fadeIn(0.08)}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#10264A] tracking-tight mb-4"
          >
            Navigate the Eight Districts.
          </motion.h2>
          <motion.p
            {...fadeIn(0.14)}
            className="text-sm sm:text-base text-[#536781] leading-relaxed font-normal"
          >
            The Department of ETC commands the central spire, interconnected with 8 floating districts representing each competition arena. Select any location pin to inspect its assigned domain.
          </motion.p>
        </div>

        {/* Split Grid: Interactive Visual (Left) & District Profile (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Isometric Map Canvas (col-span-8) */}
          <motion.div
            {...fadeIn(0.1)}
            className="lg:col-span-8 relative rounded-3xl bg-white p-4 sm:p-6 border border-[#DCE5F2] shadow-xs"
          >
            <div className="relative w-full aspect-[1536/1024] rounded-2xl overflow-hidden bg-gradient-to-b from-[#EDF5FC] via-[#F4F9FD] to-[#EDF5FC] border border-[#DCE5F2]">
              <Image
                src={mapArtwork}
                alt="Eight Festival Competition Arenas and Central ETC Spire Map"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 850px"
              />

              {/* 1. CENTRAL SPIRE PIN: Department of ETC (Host Department) */}
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
                aria-label="View Central Spire - Department of ETC"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3978F6] flex items-center justify-center text-white shadow-lg border-2 border-white transition-all">
                  <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" />
                </div>
              </button>

              {/* 2. THE 8 PERIMETER PINS: 8 Competition Programs */}
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
                    aria-label={`View ${comp.district} - ${comp.name}`}
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
          </motion.div>

          {/* Right Column: Active District Profile (col-span-4) */}
          <motion.div {...fadeIn(0.18)} className="lg:col-span-4 flex flex-col gap-4">
            <div className="nexus-skeuo-card p-6 sm:p-7 text-left">
              {isCenterSelected ? (
                /* Center Spire View */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#EBF4FE] text-[#3978F6]">
                      CENTRAL CITADEL
                    </span>
                    <span className="text-xs font-mono text-[#8CA0BA] font-semibold">
                      Host Directorate
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-[#10264A] mb-2 leading-snug">
                    {ETC_CENTRAL_SPIRE.district}
                  </h3>

                  <p className="text-xs sm:text-sm font-semibold text-[#3978F6] mb-3">
                    {ETC_CENTRAL_SPIRE.name}
                  </p>

                  <p className="text-xs text-[#536781] leading-relaxed mb-6 font-normal">
                    {ETC_CENTRAL_SPIRE.shortDescription}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-[#E2E8F0] mb-6">
                    {ETC_CENTRAL_SPIRE.highlights.map((hl: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#536781]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3978F6] shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/competitions"
                    className="w-full nexus-btn-sapphire justify-center py-2.5 text-xs font-bold gap-2"
                  >
                    <span>Explore 8 Competitions</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF783E]" />
                  </Link>
                </>
              ) : (
                /* Competition Arena View */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      style={{
                        backgroundColor: activeCompetition.accentBg,
                        color: activeCompetition.accentColor,
                      }}
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
                    >
                      ARENA 0{activeCompetition.districtIndex + 1}
                    </span>
                    <span className="text-xs font-mono text-[#8CA0BA] font-semibold">
                      {activeCompetition.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-[#10264A] mb-2 leading-snug">
                    {activeCompetition.district}
                  </h3>

                  <p className="text-xs sm:text-sm font-semibold text-[#FF783E] mb-3">
                    {activeCompetition.name}
                  </p>

                  <p className="text-xs text-[#536781] leading-relaxed mb-6 font-normal">
                    {activeCompetition.shortDescription}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-[#E2E8F0] mb-6">
                    {activeCompetition.highlights.map((hl: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#536781]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3978F6] shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/competitions/${activeCompetition.slug}`}
                    className="w-full nexus-btn-sapphire justify-center py-2.5 text-xs font-bold gap-2"
                  >
                    <span>Enter District Arena</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF783E]" />
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
