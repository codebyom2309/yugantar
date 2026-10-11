'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Cpu, Lightbulb, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function CityIntroduction() {
  return (
    <section id="about" className="py-24 sm:py-32 bg-gradient-to-b from-[#FFF8F2] via-[#FFF1E5] to-[#F8FAFD] relative overflow-hidden border-b border-[#F2DECD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Editorial Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Narrative & Pillars (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#FFE0CE] text-xs font-mono font-bold text-[#FF874D] uppercase tracking-wider mb-5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FF874D]" />
              <span>NEXUS CITY · THE CREATIVE CONCEPT</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#15294A] tracking-tight leading-[1.12] mb-6">
              One city. Eight arenas. <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                Infinite possibilities.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#172B49]/90 leading-relaxed mb-6 font-normal">
              Organized by the Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur, <strong className="text-[#172B49] font-bold">YUGANTAR 2026</strong> transforms the festival experience into an interconnected innovation metropolis.
            </p>

            <p className="text-sm sm:text-base text-[#60728A] leading-relaxed mb-10 font-normal">
              The festival provides an open, rigorous platform where students assemble real circuits, articulate research papers, pitch solutions to pressing problems, and demonstrate software-hardware integrations before experienced evaluators.
            </p>

            {/* Three Editorial Engineering Pillars with Individual Character */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              
              <div className="p-5 rounded-2xl bg-white border border-[#F2DECD] shadow-2xs hover:border-[#E07A43] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#FFF4EA] text-[#E07A43] flex items-center justify-center mb-3.5 border border-[#F0E5D8]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[#172B49] uppercase tracking-wide mb-1.5">
                  Hardware Rigor
                </h3>
                <p className="text-xs text-[#60728A] leading-relaxed">
                  Working circuit prototypes, breadboard speed debugging, and embedded hardware.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#DCE5F2] shadow-2xs hover:border-[#4B91E8] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EDF5FC] text-[#4B91E8] flex items-center justify-center mb-3.5 border border-[#DCE5F2]">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[#172B49] uppercase tracking-wide mb-1.5">
                  Research & Ideas
                </h3>
                <p className="text-xs text-[#60728A] leading-relaxed">
                  Structured technical paper presentations, ideathon sprints, and visual synthesis.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E8E1F8] shadow-2xs hover:border-[#9187DE] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#F5F2FC] text-[#9187DE] flex items-center justify-center mb-3.5 border border-[#E8E1F8]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[#172B49] uppercase tracking-wide mb-1.5">
                  Career Readiness
                </h3>
                <p className="text-xs text-[#60728A] leading-relaxed">
                  Corporate mock placement rounds with aptitude, technical, and HR screening.
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Architectural Visual & Legacy Dossier (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Cropped Architectural Skybridge Visual */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#F2DECD] shadow-sm">
              <Image
                src="/images/nexus-city/architectural-skybridge.webp"
                alt="NEXUS CITY Architectural Skybridge Connection"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 450px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172B49]/70 via-transparent to-transparent flex items-end p-5">
                <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                  INTERCONNECTED INNOVATION CORRIDORS
                </span>
              </div>
            </div>

            {/* Institutional Dossier Panel */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#F2DECD] shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0E5D8] mb-5">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E07A43] block">
                    HOST DEPARTMENT
                  </span>
                  <h4 className="text-base font-display font-bold text-[#172B49]">
                    Department of ETC
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FFF4EA] text-[#E07A43] border border-[#F0E5D8]">
                  ESTD. 1990
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F2] border border-[#F2DECD]">
                  <span className="text-[#60728A]">EVENT DATE</span>
                  <span className="font-bold text-[#172B49]">22 OCTOBER 2026</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F2] border border-[#F2DECD]">
                  <span className="text-[#60728A]">CAMPUS VENUE</span>
                  <span className="font-bold text-[#172B49]">PCE CAMPUS, NAGPUR</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F2] border border-[#F2DECD]">
                  <span className="text-[#60728A]">ORGANIZING BODIES</span>
                  <span className="font-bold text-[#172B49]">TELE-ERA · IETE · III CELL</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F0E5D8]">
                <Link
                  href="/competitions"
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#172B49] hover:text-[#E07A43] transition-colors"
                >
                  <span>Explore the Eight Discovery Districts</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E07A43]" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
