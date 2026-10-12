'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  COMPETITIONS,
  Competition,
} from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
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
  const shouldReduceMotion = useReducedMotion();
  const [competitions, setCompetitions] = useState<Competition[]>(COMPETITIONS);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  React.useEffect(() => {
    fetchClientFestivalData()
      .then((d) => {
        if (d.competitions && Array.isArray(d.competitions) && d.competitions.length > 0) {
          setCompetitions(d.competitions);
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    'All',
    'Hardware & Circuits',
    'Research & Ideas',
    'Career & Strategy',
    'Esports & Creative',
  ];

  const filteredCompetitions =
    activeFilter === 'All'
      ? competitions
      : competitions.filter((c) => c.category === activeFilter);

  const fadeIn = (delay = 0) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.45,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <section id="competitions" className="py-24 sm:py-32 bg-white relative overflow-hidden border-b border-[#DCE5F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <motion.div {...fadeIn(0)} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDF5FC] border border-[#DCE5F2] text-xs font-mono font-bold text-[#3978F6] uppercase tracking-wider mb-4 shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span>THE EIGHT ARENAS · NEXUS CITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#10264A] tracking-tight mb-4">
              Eight Competitions. Eight Districts.
            </h2>
            <p className="text-sm sm:text-base text-[#536781] leading-relaxed">
              Explore the eight confirmed competition tracks organized by the Department of Electronics & Telecommunication Engineering. Each event is anchored in a dedicated discovery district with its own dedicated detail page.
            </p>
          </motion.div>

          {/* Category Filter Pills */}
          <motion.div
            {...fadeIn(0.1)}
            className="flex flex-wrap items-center gap-1.5 bg-[#F8FAFD] p-1.5 rounded-2xl border border-[#DCE5F2] shadow-2xs"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                type="button"
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-[#10264A] text-white shadow-xs'
                    : 'text-[#536781] hover:text-[#10264A] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Varied Competitions Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {filteredCompetitions.map((comp, idx) => {
            const Icon = ICON_MAP[comp.iconName] || Cpu;

            return (
              <motion.div
                key={comp.id}
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  delay: shouldReduceMotion ? 0 : idx * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="nexus-skeuo-card tech-crosshair p-6 sm:p-7 flex flex-col justify-between group relative transition-all"
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

                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F8FAFD] text-[#10264A] border border-[#DCE5F2]">
                      ARENA 0{comp.districtIndex + 1}
                    </span>
                  </div>

                  <span
                    style={{ color: comp.accentColor }}
                    className="text-[11px] font-mono uppercase tracking-wider font-extrabold block mb-1"
                  >
                    {comp.district}
                  </span>

                  <h3 className="text-lg font-display font-bold text-[#10264A] mb-2.5 group-hover:text-[#FF783E] transition-colors leading-snug">
                    {comp.name}
                  </h3>

                  <p className="text-xs text-[#536781] leading-relaxed mb-5 font-normal">
                    {comp.shortDescription}
                  </p>

                  {/* Highlights preview */}
                  <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] mb-5">
                    {comp.highlights.slice(0, 2).map((h, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#536781]">
                        <span
                          style={{ backgroundColor: comp.accentColor }}
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 circuit-node-dot"
                        />
                        <span className="line-clamp-1">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action: Navigate to Dedicated Detail Route */}
                <Link
                  href={`/competitions/${comp.slug}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F8FAFD] group-hover:bg-[#10264A] text-[#10264A] group-hover:text-white border border-[#DCE5F2] group-hover:border-[#10264A] text-xs font-mono font-bold transition-all duration-200"
                >
                  <span>Explore Track Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF783E] transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Call-to-Action to Competitions Overview Page */}
        <motion.div {...fadeIn(0.2)} className="text-center pt-2">
          <Link
            href="/competitions"
            className="nexus-btn-sapphire px-8 py-3.5 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm inline-flex"
          >
            <span>View Complete Competitions Directory</span>
            <ArrowRight className="w-4 h-4 text-[#FF783E]" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
