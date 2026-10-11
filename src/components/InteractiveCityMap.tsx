'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { COMPETITIONS, Competition, FESTIVAL_ASSETS } from '@/data/events';
import { MapPin, Compass, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

export default function InteractiveCityMap() {
  const [activeCompId, setActiveCompId] = useState<string>(COMPETITIONS[0].id);

  const activeCompetition =
    COMPETITIONS.find((c) => c.id === activeCompId) || COMPETITIONS[0];

  return (
    <section id="city-map" className="py-24 sm:py-32 bg-[#EDF5FC]/60 relative overflow-hidden border-b border-[#DCE5F2]">
      
      {/* Soft atmospheric ambient light */}
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#FFF4EA] to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE5F2] text-xs font-mono font-bold text-[#4B91E8] uppercase tracking-wider mb-4 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-[#4B91E8]" />
            <span>NEXUS CITY MAP · DISTRICT PREVIEW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#172B49] tracking-tight mb-4">
            Navigate the Eight Districts.
          </h2>
          <p className="text-sm sm:text-base text-[#60728A] leading-relaxed font-normal">
            Every competition track is situated within an architectural district of NEXUS CITY connected by skybridges to the central campus spire. Select any district pin to inspect its assigned arena.
          </p>
        </div>

        {/* Split Grid: Interactive Visual (Left) & District Profile (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Isometric Map Canvas (col-span-8) */}
          <div className="lg:col-span-8 relative rounded-3xl bg-white p-4 sm:p-6 border border-[#DCE5F2] shadow-xs">
            
            {/* The transparent map is placed against a pale sky gradient where floating islands shine naturally */}
            <div className="relative w-full aspect-[1536/1024] rounded-2xl overflow-hidden bg-gradient-to-b from-[#EDF5FC] via-[#F4F9FD] to-[#EDF5FC] border border-[#DCE5F2]">
              <Image
                src={FESTIVAL_ASSETS.districtsMap}
                alt="Eight Festival Competition Arenas Map"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 850px"
              />

              {/* Hotspots mapped to each of the 8 competitions */}
              {COMPETITIONS.map((comp, idx) => {
                const isActive = comp.id === activeCompId;
                return (
                  <button
                    key={comp.id}
                    onClick={() => setActiveCompId(comp.id)}
                    type="button"
                    style={{
                      left: `${comp.mapCoords.x}%`,
                      top: `${comp.mapCoords.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none transition-all duration-200 ${
                      isActive ? 'scale-115 z-30' : 'hover:scale-105'
                    }`}
                    aria-label={`Select ${comp.district}: ${comp.name}`}
                  >
                    {/* Refined halo ring */}
                    <span
                      className={`absolute -inset-1.5 rounded-full transition-opacity ${
                        isActive
                          ? 'bg-[#E07A43]/25 opacity-100 ring-2 ring-[#E07A43]/40'
                          : 'opacity-0 group-hover:opacity-100 bg-[#172B49]/10'
                      }`}
                    />

                    {/* Numeric Pin Badge */}
                    <span
                      className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 text-[10px] sm:text-xs font-mono font-bold shadow-xs transition-colors ${
                        isActive
                          ? 'bg-[#172B49] text-white border-white ring-2 ring-[#E07A43]'
                          : 'bg-white text-[#172B49] border-[#DCE5F2] hover:border-[#E07A43]'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Tooltip */}
                    <span className="hidden sm:group-hover:flex absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-xl bg-[#172B49] text-white text-[11px] font-mono font-semibold whitespace-nowrap shadow-md items-center gap-1.5 pointer-events-none z-40 border border-white/20">
                      <MapPin className="w-3 h-3 text-[#F5A16F]" />
                      <span>{comp.district}: {comp.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick District Selector Buttons */}
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap gap-2 items-center justify-center">
              <span className="text-[11px] font-mono text-[#60728A] uppercase font-bold mr-1">
                DISTRICT SELECTOR:
              </span>
              {COMPETITIONS.map((comp, idx) => (
                <button
                  key={comp.id}
                  onClick={() => setActiveCompId(comp.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    comp.id === activeCompId
                      ? 'bg-[#172B49] text-white shadow-2xs'
                      : 'bg-white text-[#172B49] hover:bg-[#FAF6F0] border border-[#DCE5F2]'
                  }`}
                >
                  0{idx + 1} {comp.district.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: District Profile Card (col-span-4) */}
          <div className="lg:col-span-4">
            <div className="nexus-card p-6 sm:p-8 flex flex-col justify-between border border-[#DCE5F2] shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#FFF4EA] text-[#E07A43] border border-[#F0E5D8]">
                    {activeCompetition.district.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#60728A]">
                    ARENA 0{activeCompetition.districtIndex + 1}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#172B49] mb-1">
                  {activeCompetition.name}
                </h3>
                
                <span className="text-xs font-mono text-[#E07A43] block mb-4 font-semibold">
                  Category: {activeCompetition.category}
                </span>

                <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-6 font-normal">
                  {activeCompetition.shortDescription}
                </p>

                {/* Highlights Stack */}
                <div className="space-y-2 mb-6 p-4 rounded-2xl bg-[#FFF8F2] border border-[#F2DECD]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#172B49] block font-bold mb-1">
                    KEY HIGHLIGHTS
                  </span>
                  {activeCompetition.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#60728A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E07A43] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/competitions/${activeCompetition.slug}`}
                  className="nexus-btn-ink text-center py-3.5 text-xs font-mono font-bold shadow-xs gap-2"
                >
                  <span>Open Track Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F5A16F]" />
                </Link>

                <Link
                  href="/districts"
                  className="nexus-btn-secondary text-center py-2.5 text-xs font-mono font-bold"
                >
                  Explore Full Districts Map
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
