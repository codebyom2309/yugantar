'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  COMPETITIONS,
  Competition,
} from '@/data/events';
import {
  Cpu,
  Presentation,
  Zap,
  Lightbulb,
  Briefcase,
  Image as ImageIcon,
  Gamepad2,
  Mic2,
  ArrowRight,
  Layers,
  Sparkles,
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

export default function CompetitionsGrid() {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const categories = [
    'All',
    'Hardware & Circuits',
    'Research & Ideas',
    'Career & Strategy',
    'Esports & Creative',
  ];

  const filteredCompetitions =
    activeFilter === 'All'
      ? COMPETITIONS
      : COMPETITIONS.filter((c) => c.category === activeFilter);

  return (
    <section id="competitions" className="py-24 sm:py-32 bg-white relative overflow-hidden border-b border-[#DCE5F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDF5FC] border border-[#DCE5F2] text-xs font-mono font-bold text-[#4B91E8] uppercase tracking-wider mb-4 shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span>THE EIGHT ARENAS · NEXUS CITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#172B49] tracking-tight mb-4">
              Eight Competitions. Eight Districts.
            </h2>
            <p className="text-sm sm:text-base text-[#60728A] leading-relaxed">
              Explore the eight confirmed competition tracks organized by the Department of Electronics & Telecommunication Engineering. Each event is anchored in a dedicated discovery district with its own dedicated detail page.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F8FAFD] p-1.5 rounded-2xl border border-[#DCE5F2] shadow-2xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                type="button"
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  activeFilter === cat
                    ? 'bg-[#172B49] text-white shadow-xs'
                    : 'text-[#60728A] hover:text-[#172B49] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Varied Competitions Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {filteredCompetitions.map((comp) => {
            const Icon = ICON_MAP[comp.iconName] || Cpu;

            return (
              <div
                key={comp.id}
                className="nexus-card p-6 sm:p-7 flex flex-col justify-between group relative hover:border-[#172B49]/40 transition-all"
              >
                <div>
                  {/* Top Badge: District Identifier & Arena Number */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      style={{ backgroundColor: comp.accentBg, color: comp.accentColor }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-250 group-hover:scale-105 shadow-2xs border border-black/5"
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F8FAFD] text-[#172B49] border border-[#DCE5F2]">
                      ARENA 0{comp.districtIndex + 1}
                    </span>
                  </div>

                  <span
                    style={{ color: comp.accentColor }}
                    className="text-[11px] font-mono uppercase tracking-wider font-extrabold block mb-1"
                  >
                    {comp.district}
                  </span>

                  <h3 className="text-lg font-display font-bold text-[#172B49] mb-2.5 group-hover:text-[#E07A43] transition-colors leading-snug">
                    {comp.name}
                  </h3>

                  <p className="text-xs text-[#60728A] leading-relaxed mb-5 font-normal">
                    {comp.shortDescription}
                  </p>

                  {/* Highlights preview */}
                  <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] mb-5">
                    {comp.highlights.slice(0, 2).map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#60728A]">
                        <span
                          style={{ backgroundColor: comp.accentColor }}
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                        />
                        <span className="line-clamp-1">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action: Navigate to Dedicated Detail Route */}
                <Link
                  href={`/competitions/${comp.slug}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F8FAFD] group-hover:bg-[#172B49] text-[#172B49] group-hover:text-white border border-[#DCE5F2] group-hover:border-[#172B49] text-xs font-mono font-bold transition-all duration-200"
                >
                  <span>Explore Track Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E07A43] transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Call-to-Action to Competitions Overview Page */}
        <div className="text-center pt-2">
          <Link
            href="/competitions"
            className="nexus-btn-ink px-8 py-3.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm inline-flex"
          >
            <span>View Complete Competitions Directory</span>
            <ArrowRight className="w-4 h-4 text-[#F5A16F]" />
          </Link>
        </div>

      </div>
    </section>
  );
}
