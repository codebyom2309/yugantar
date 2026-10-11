'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FESTIVAL_JOURNEY, FESTIVAL_INFO } from '@/data/events';
import {
  Compass,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export default function JourneyPage() {
  const [selectedPhase, setSelectedPhase] = useState<number>(0);

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header in Pale Sky Blue Atmosphere */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 bg-gradient-to-b from-[#EDF5FC] to-[#F8FAFD] overflow-hidden border-b border-[#DCE5F2]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFF4EA] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-5">
            <Link href="/" className="hover:text-[#15294A] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3B82F6] font-semibold">Festival Journey</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#FFE0CE] text-xs font-mono font-bold text-[#FF874D] uppercase tracking-wider mb-4 shadow-2xs">
              <Navigation className="w-3.5 h-3.5" />
              <span>THE DELEGATE EXPERIENCE ROADMAP</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#15294A] mb-4 sm:mb-5 text-balance">
              The Journey Through <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                YUGANTAR 2026.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed mb-6 font-normal">
              A structured roadmap explaining how delegates participate in the festival—from initial track selection and campus concourse check-in to technical jury defense and the central valedictory.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#172B49]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#4B91E8]" />
                22 October 2026
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#9187DE]" />
                PCE Campus, Nagpur
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Roadmap & Timeline Sequence */}
      <main className="py-16 sm:py-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Phase Sequence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {FESTIVAL_JOURNEY.map((item, index) => {
              const isActive = selectedPhase === index;
              return (
                <button
                  key={item.step}
                  onClick={() => setSelectedPhase(index)}
                  type="button"
                  className={`p-6 rounded-2xl text-left transition-all border-2 relative overflow-hidden group ${
                    isActive
                      ? 'bg-white border-[#4B91E8] shadow-md ring-2 ring-[#4B91E8]/15'
                      : 'bg-white border-[#E2E8F0] hover:border-[#B8D5F8] shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-2xl font-mono font-extrabold ${
                        isActive ? 'text-[#4B91E8]' : 'text-[#8CA0BA]'
                      }`}
                    >
                      {item.step}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#EDF5FC] text-[#4B91E8]'
                          : 'bg-[#F8FAFD] text-[#60728A]'
                      }`}
                    >
                      PHASE 0{index + 1}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#4B91E8] block mb-1">
                    {item.subtitle}
                  </span>

                  <h3 className="text-lg font-display font-bold text-[#172B49] mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#60728A] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Phase Deep Dive Banner */}
          <div className="rounded-3xl bg-white border border-[#DCE5F2] p-8 sm:p-10 shadow-xs relative overflow-hidden mb-16">
            <div className="max-w-3xl">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B91E8] bg-[#EDF5FC] px-3 py-1 rounded-md mb-4 inline-block">
                PHASE 0{selectedPhase + 1} DETAILED WALKTHROUGH
              </span>

              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B49] mb-3">
                {FESTIVAL_JOURNEY[selectedPhase].title} — {FESTIVAL_JOURNEY[selectedPhase].subtitle}
              </h2>

              <p className="text-sm sm:text-base text-[#60728A] leading-relaxed mb-6 font-normal">
                {FESTIVAL_JOURNEY[selectedPhase].description}
              </p>

              <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] mb-6">
                <h4 className="text-xs font-mono font-bold uppercase text-[#172B49] mb-1">
                  Operational Breakdown
                </h4>
                <p className="text-xs text-[#60728A] leading-relaxed">
                  {FESTIVAL_JOURNEY[selectedPhase].details}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/competitions"
                  className="nexus-btn-primary px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-xs"
                >
                  <span>Explore Participating Competitions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/districts"
                  className="nexus-btn-secondary px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2"
                >
                  <span>Explore Campus Map</span>
                </Link>
              </div>

            </div>
          </div>

          {/* Delegate Tips & Readiness Card in Soft Sky */}
          <div className="rounded-2xl bg-[#EDF5FC] p-8 sm:p-10 border border-[#DCE5F2] relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4B91E8] bg-white px-3 py-1 rounded-md mb-3 inline-block shadow-2xs">
                DELEGATE READINESS NOTE
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#172B49] mb-2">
                What to Prepare Before Festival Day
              </h3>
              <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-6 font-normal">
                Ensure all team members hold valid student identity cards from their respective colleges. For hardware events, prepare your schematics and circuit documentation in advance. Official timetables will be published prior to 22 October 2026.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#4B91E8] font-semibold">
                <span>Organized by TELE-ERA · IETE · III Cell · Department of ETC</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
