'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, Sparkles, Compass } from 'lucide-react';
import { FESTIVAL_INFO } from '@/data/events';
import type { FestivalSettings } from '@/lib/competitions';

export default function ClosingCta({ festival }: { festival?: FestivalSettings }) {
  const shouldReduceMotion = useReducedMotion();

  const fadeIn = (delay = 0) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.5,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-[#F8FAFD] via-[#F0F5FB] to-[#F5F6FA] border-t border-[#DCE5F2]">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[26rem] bg-gradient-to-tr from-[#FF783E]/15 via-[#9187DE]/10 to-[#3978F6]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Inner Luminous Midnight Glass Pavilion Frame */}
        <motion.div
          {...fadeIn(0)}
          className="p-8 sm:p-14 rounded-3xl nexus-midnight-glass relative overflow-hidden"
        >
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold text-[#FFD1B5] uppercase tracking-wider mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FF783E]" />
            <span>JOIN US IN NAGPUR · {festival?.name || 'YUGANTAR'} {festival?.edition || '2026'}</span>
          </div>

          {/* Main Heading with Warm Sunset Italic Emphasis */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight mb-6">
            Ready to enter the city? <br />
            <span className="font-editorial text-sunset-glow font-normal tracking-normal">
              Engineer the future.
            </span>
          </h2>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-9 font-normal leading-relaxed">
            Bring your working prototypes, research findings, circuit wiring speed, and visionary ideas to {festival?.college || 'Priyadarshini College of Engineering, Nagpur'}.
          </p>

          {/* Verified Event Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-bold text-white">
              <Calendar className="w-4 h-4 text-[#FF783E]" />
              <span>{(festival?.date || FESTIVAL_INFO.date).toUpperCase()}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-bold text-white">
              <MapPin className="w-4 h-4 text-[#3978F6]" />
              <span>{(festival?.locationShort || FESTIVAL_INFO.locationShort).toUpperCase()}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-semibold text-white/70">
              <span>{(festival?.department ? festival.department.toUpperCase() : 'DEPT OF ELECTRONICS & TELECOM')}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              href="/competitions"
              className="nexus-btn-sunset px-8 py-4 text-sm font-bold shadow-lg justify-center gap-2"
            >
              <span>Explore All Competitions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/districts"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all duration-200"
            >
              <Compass className="w-4 h-4 text-[#FF783E]" />
              <span>NEXUS Districts Map</span>
            </Link>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
