'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ORGANIZERS } from '@/data/events';
import { ShieldCheck, Award, Building, ArrowRight } from 'lucide-react';

export default function OrganizersSection() {
  const shouldReduceMotion = useReducedMotion();

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
    <section id="organizers" className="py-24 sm:py-32 bg-white relative overflow-hidden border-b border-[#DCE5F2]">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#3978F6]/8 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div {...fadeIn(0)} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDF5FC] border border-[#DCE5F2] text-xs font-mono font-bold text-[#3978F6] uppercase tracking-wider mb-4 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3978F6]" />
              <span>STEWARDSHIP & LEADERSHIP</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#10264A] tracking-tight mb-4">
              The Organizing Bodies. <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal text-2xl sm:text-3xl block mt-1">
                Leadership & Heritage.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#536781] leading-relaxed">
              YUGANTAR 2026 is convened through the coordinated leadership of our departmental student forum, faculty mentors, and institutional innovation cells at Priyadarshini College of Engineering, Nagpur.
            </p>
          </motion.div>

          <motion.div {...fadeIn(0.1)}>
            <Link
              href="/about"
              className="nexus-btn-sapphire px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm inline-flex shrink-0"
            >
              <span>Learn More About PCE ETC</span>
              <ArrowRight className="w-4 h-4 text-[#FF783E]" />
            </Link>
          </motion.div>
        </div>

        {/* 3 Organizers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {ORGANIZERS.map((org, idx) => (
            <motion.div
              key={org.name}
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                delay: shouldReduceMotion ? 0 : idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              suppressHydrationWarning
              className={`yugantar-card-interactive ${idx === 0 ? 'glow-amber' : idx === 1 ? 'glow-blue' : 'glow-violet'} nexus-skeuo-card p-8 flex flex-col justify-between group relative transition-all`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#EDF5FC] text-[#3978F6] border border-[#DCE5F2]">
                    {org.badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#8CA0BA]">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-[#10264A] mb-2 group-hover:text-[#3978F6] transition-colors leading-snug">
                  {org.name}
                </h3>

                <span className="text-xs font-mono font-semibold text-[#8578D8] block mb-4">
                  {org.department}
                </span>

                <p className="text-xs sm:text-sm text-[#536781] leading-relaxed mb-6 font-normal">
                  {org.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] text-xs font-mono font-semibold text-[#10264A] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#3978F6]" />
                <span>PCE Nagpur ETC Department</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Institutional Patronage Banner */}
        <motion.div
          {...fadeIn(0.2)}
          suppressHydrationWarning
          className="yugantar-card-interactive glow-gold p-6 sm:p-8 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF5FC] text-[#3978F6] flex items-center justify-center shrink-0 border border-[#DCE5F2]">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#3978F6] block font-bold">
                HOST INSTITUTION
              </span>
              <h4 className="text-base sm:text-lg font-display font-bold text-[#10264A]">
                Priyadarshini College of Engineering, Nagpur
              </h4>
              <p className="text-xs text-[#536781] font-medium">
                Department of Electronics & Telecommunication Engineering • TELE-ERA Forum
              </p>
            </div>
          </div>

          <Link
            href="/about"
            className="nexus-btn-frosted px-5 py-2.5 text-xs font-mono font-bold shrink-0"
          >
            <span>Department Dossier</span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
