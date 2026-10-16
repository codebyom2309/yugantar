'use client';

import React from 'react';
import { Cpu, Users, Building, ArrowRight, Sparkles, Award, ShieldCheck, Zap } from 'lucide-react';

export default function AboutSection({ date }: { date?: string } = {}) {
  return (
    <section id="about" className="py-24 sm:py-32 bg-gradient-to-b from-[#FFF4E5] via-[#F7EEE2] to-[#FFF4E5] relative overflow-hidden border-b border-[#E8D4B8]/60">
      
      {/* Ambient background light orbs for rich glassmorphic refraction */}
      <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#82C9F4]/20 via-[#FF681F]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 rounded-full bg-gradient-to-tr from-[#FF681F]/15 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Narrative & Values (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E8D4B8] text-xs font-mono font-bold text-[#082750] uppercase tracking-wider mb-5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FF681F]" />
              <span>THE VISION BEHIND YUGANTAR</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#082750] tracking-tight leading-[1.14] mb-6">
              A Confluence of Engineering, Vision, and Hands-on Craft.
            </h2>

            <p className="text-base sm:text-lg text-[#163665] font-medium leading-relaxed mb-6">
              Organized by the Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur, <strong className="text-[#082750]">YUGANTAR</strong> is an annual technical festival created to bridge academic fundamentals with practical innovation.
            </p>

            <p className="text-sm sm:text-base text-[#243B64] leading-relaxed mb-10">
              The festival provides an open, rigorous platform where students assemble real circuits, articulate research papers, pitch solutions to pressing problems, and demonstrate software-hardware integrations before experienced evaluators.
            </p>

            {/* Core Values Stack with Luminous Frosted Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              
              <div className="glass-card-luminous p-5 group">
                <div className="w-11 h-11 rounded-xl luminous-icon-pod text-[#FF681F] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[#082750] uppercase tracking-wide mb-1.5">
                  Practical Rigor
                </h3>
                <p className="text-xs text-[#243B64] leading-relaxed font-medium">
                  Hardware circuits, breadboard debugging, and running operational prototypes.
                </p>
              </div>

              <div className="glass-card-luminous p-5 group">
                <div className="w-11 h-11 rounded-xl luminous-icon-pod text-[#FF681F] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[#082750] uppercase tracking-wide mb-1.5">
                  Intercollegiate
                </h3>
                <p className="text-xs text-[#243B64] leading-relaxed font-medium">
                  Welcoming student engineers across institutions to collaborate and compete.
                </p>
              </div>

              <div className="glass-card-luminous p-5 group">
                <div className="w-11 h-11 rounded-xl luminous-icon-pod text-[#FF681F] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-mono font-bold text-[#082750] uppercase tracking-wide mb-1.5">
                  Industry Focus
                </h3>
                <p className="text-xs text-[#243B64] leading-relaxed font-medium">
                  Mock placement rounds and feedback aligned with corporate standards.
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Institutional Architectural Dossier (col-span-5) */}
          <div className="lg:col-span-5">
            <div className="glass-cockpit rounded-3xl p-7 sm:p-9 relative overflow-hidden border-2 border-white">
              
              <div className="flex items-center justify-between pb-5 border-b border-[#E8D4B8] mb-6">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF681F] block">
                    HOST DEPARTMENT & CAMPUS
                  </span>
                  <h3 className="text-xl font-display font-bold text-[#082750]">
                    Department of ETC
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#082750] text-[#FFF4E5] shadow-xs">
                  ESTD. 1990
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#163665] leading-relaxed mb-6 font-medium">
                Priyadarshini College of Engineering, Nagpur has been a cornerstone of engineering education in central India for over three decades. The Department of Electronics & Telecommunication Engineering leads with advanced laboratories and active student chapters including TELE-ERA and IETE.
              </p>

              {/* Verified Institutional Details List */}
              <div className="space-y-3 pt-2 text-xs font-mono">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/90 border border-[#E8D4B8] shadow-2xs">
                  <span className="text-[#163665] font-semibold">EVENT DATE</span>
                  <span className="font-bold text-[#082750]">{(date || '21 October 2026').toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/90 border border-[#E8D4B8] shadow-2xs">
                  <span className="text-[#163665] font-semibold">CAMPUS VENUE</span>
                  <span className="font-bold text-[#082750]">PCE CAMPUS, NAGPUR</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/90 border border-[#E8D4B8] shadow-2xs">
                  <span className="text-[#163665] font-semibold">ORGANIZING BODIES</span>
                  <span className="font-bold text-[#FF681F]">TELE-ERA • IETE • III CELL</span>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-[#E8D4B8] flex items-center justify-between">
                <a
                  href="#competitions"
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#FF681F] hover:text-[#082750] transition-colors"
                >
                  <span>Explore Confirmed Competitions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
