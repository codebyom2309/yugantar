'use client';

import React from 'react';
import Link from 'next/link';
import { FESTIVAL_JOURNEY } from '@/data/events';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Ticket,
  Zap,
  Trophy,
  ArrowRight,
} from 'lucide-react';

const STAGE_ICONS = [Ticket, Compass, Zap, Trophy];

export default function FestivalJourney() {
  return (
    <section id="journey" className="py-24 sm:py-32 bg-gradient-to-b from-[#F8FAFD] via-[#FFF4EA]/30 to-[#F8FAFD] relative overflow-hidden border-b border-[#DCE5F2]">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[#4B91E8]/10 via-[#9187DE]/8 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#DCE5F2] text-xs font-mono font-bold text-[#4B91E8] uppercase tracking-wider mb-4 shadow-2xs">
              <Compass className="w-3.5 h-3.5 text-[#4B91E8]" />
              <span>NEXUS EXPEDITION · VISITOR JOURNEY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#172B49] tracking-tight mb-4">
              How the Experience Unfolds.
            </h2>
            <p className="text-sm sm:text-base text-[#60728A] leading-relaxed">
              From morning arrival at Priyadarshini College of Engineering to the valedictory celebrations, YUGANTAR 2026 is structured as a clear, purposeful engineering journey.
            </p>
          </div>

          <Link
            href="/journey"
            className="nexus-btn-primary px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm inline-flex shrink-0"
          >
            <span>Explore Full Roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Connected Horizontal Route (Desktop) & Stack (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Connecting route line on desktop */}
          <div className="hidden lg:block absolute top-14 left-16 right-16 h-0.5 bg-gradient-to-r from-[#4B91E8] via-[#8578D8] to-[#E0874E] z-0 opacity-30" />

          {FESTIVAL_JOURNEY.map((item, idx) => {
            const Icon = STAGE_ICONS[idx] || Sparkles;
            const colors = [
              { bg: 'bg-[#EDF5FC]', text: 'text-[#4B91E8]', border: 'border-[#DCE5F2]', hoverBorder: 'group-hover:border-[#4B91E8]' },
              { bg: 'bg-[#F2EFFD]', text: 'text-[#8578D8]', border: 'border-[#E0DAF8]', hoverBorder: 'group-hover:border-[#8578D8]' },
              { bg: 'bg-[#FFF4EA]', text: 'text-[#E0874E]', border: 'border-[#F0E5D8]', hoverBorder: 'group-hover:border-[#E0874E]' },
              { bg: 'bg-[#EDF5FC]', text: 'text-[#4B91E8]', border: 'border-[#DCE5F2]', hoverBorder: 'group-hover:border-[#4B91E8]' },
            ][idx % 4];

            return (
              <div
                key={item.step}
                className="nexus-card p-7 flex flex-col justify-between relative z-10 group"
              >
                <div>
                  {/* Step Milestone Node */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} ${colors.text} ${colors.border} border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-2xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <span className={`text-xs font-mono font-bold ${colors.text} px-2.5 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                      PHASE {item.step}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-[#8CA0BA] font-semibold block mb-1">
                    {item.subtitle}
                  </span>

                  <h3 className="text-xl font-display font-bold text-[#172B49] mb-3 group-hover:text-[#4B91E8] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed font-normal mb-5">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex items-center gap-1.5 text-xs font-mono font-semibold text-[#172B49]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4B91E8]" />
                  <span>22 October 2026</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Narrative Banner */}
        <div className="mt-14 max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-[#DCE5F2] text-center shadow-xs">
          <p className="text-base sm:text-lg font-display font-semibold text-[#172B49] leading-relaxed italic">
            &ldquo;You arrive with ideas, compete across specialized engineering arenas, learn alongside peers from across institutions, and leave ready for the next era.&rdquo;
          </p>
          <span className="text-xs font-mono text-[#4B91E8] tracking-wider uppercase block mt-3 font-bold">
            — YUGANTAR 2026 Organizing Committee · Department of ETC, PCE Nagpur
          </span>
        </div>

      </div>
    </section>
  );
}
