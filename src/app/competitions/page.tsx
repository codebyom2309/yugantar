'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { COMPETITIONS, Competition, FESTIVAL_INFO, getCompetitionGlow } from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import { isUnoptimizedUrl } from '@/lib/drive';
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
  ShieldCheck,
  ChevronRight,
  MapPin,
  Users,
  GraduationCap,
  Sparkles,
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

function CompetitionCardArtwork({
  src,
  alt,
  fallbackSrc,
}: {
  src: string;
  alt: string;
  fallbackSrc: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
      unoptimized={isUnoptimizedUrl(imgSrc)}
      onError={() => {
        if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}

export default function CompetitionsOverviewPage() {
  const shouldReduceMotion = useReducedMotion();
  const [competitions, setCompetitions] = useState<Competition[]>(COMPETITIONS);
  const [festival, setFestival] = useState(FESTIVAL_INFO);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    fetchClientFestivalData(true)
      .then((d) => {
        if (d.competitions && Array.isArray(d.competitions) && d.competitions.length > 0) {
          setCompetitions(d.competitions);
        }
        if (d.festival) {
          setFestival(d.festival);
        }
      })
      .catch((err) => {
        console.error('Failed to load live competitions, keeping fallback:', err);
      });
  }, []);

  const categories = [
    'All',
    'Hardware & Circuits',
    'Research & Ideas',
    'Career & Strategy',
    'Esports & Creative',
  ];

  const filteredCompetitions =
    activeCategory === 'All'
      ? competitions
      : competitions.filter((c) => c.category === activeCategory);

  const fadeIn = (delay = 0) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.45,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col selection:bg-[#FF783E]/20 selection:text-[#10264A]">
      <Navbar />

      {/* =========================================================================
          HERO HEADER: FEATURING ASSIGNED COMPETITION BACKGROUND ASSET
          Asset: /images/nexus-city/competition-asset.webp
          ========================================================================= */}
      <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-14 sm:pb-18 bg-gradient-to-b from-[#EDF5FC] via-[#F4F8FD] to-[#F8FAFD] border-b border-[#DCE5F2] overflow-hidden">
        
        {/* Soft atmospheric background glow accents */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFEFE5] rounded-full blur-3xl pointer-events-none opacity-80" />
        <div className="absolute top-24 -left-20 w-80 h-80 bg-[#E0ECFA] rounded-full blur-3xl pointer-events-none opacity-70" />

        {/* =====================================================================
            PRINCIPAL COMPETITION BACKGROUND ARTWORK
            Desktop (>= 1024px): /images/nexus-city/competition-hero-desktop.webp
            Mobile (< 1024px): /images/nexus-city/competition-hero-mobile.webp
            ===================================================================== */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[54%] xl:w-[48%] pointer-events-none overflow-hidden z-0">
          <Image
            src="/images/nexus-city/competition-hero-desktop.webp"
            alt="YUGANTAR 2026 NEXUS CITY Competitions Metropolis"
            fill
            priority
            className="object-cover object-[center_top] opacity-60"
            sizes="48vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EDF5FC] via-[#EDF5FC]/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F8FAFD] to-transparent" />
        </div>

        {/* Mobile ambient header with assigned mobile artwork (< 1024px) */}
        <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden z-0">
          <Image
            src="/images/nexus-city/competition-hero-mobile.webp"
            alt="Competitions Metropolis Mobile"
            fill
            priority
            className="object-cover object-[center_top] brightness-[1.02]"
            sizes="100vw"
          />
          {/* Soft directional luminance veil keeping text pristine while showcasing the metropolis background */}
          <div className="absolute inset-y-0 left-0 w-[88%] bg-gradient-to-r from-[#EDF5FC]/90 via-[#EDF5FC]/55 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#EDF5FC]/80 via-[#EDF5FC]/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F8FAFD] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <motion.nav
            {...fadeIn(0.04)}
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-[#536781] mb-4 sm:mb-5"
          >
            <Link href="/" className="hover:text-[#10264A] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
            <span className="text-[#3978F6] font-bold">Competitions</span>
          </motion.nav>

          <div className="max-w-3xl">
            {/* Festival Badge */}
            <motion.div
              {...fadeIn(0.08)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#FFE0CE] text-[11px] sm:text-xs font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-3.5 shadow-2xs backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>YUGANTAR 2026 · EIGHT DISCOVERY DISTRICTS</span>
            </motion.div>

            {/* Main Page Heading */}
            <motion.h1
              {...fadeIn(0.14)}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-[#10264A] mb-3 sm:mb-4 leading-tight"
            >
              Eight Technical Arenas. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10264A] via-[#3978F6] to-[#FF783E]">
                Engineered for Discovery.
              </span>
            </motion.h1>

            {/* Authoritative Subheading (strictly NO IETE branding) */}
            <motion.p
              {...fadeIn(0.2)}
              className="text-xs sm:text-sm lg:text-base text-[#536781] leading-relaxed mb-6 font-normal max-w-2xl"
            >
              Organized by the Department of Electronics and Telecommunication Engineering and the TELE-ERA Student Forum at Priyadarshini College of Engineering, Nagpur. Explore all eight confirmed competition tracks below.
            </motion.p>

            {/* Quick Metrics Cards */}
            <motion.div
              {...fadeIn(0.26)}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 border-t border-[#DCE5F2]"
            >
              <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-[#DCE5F2] shadow-2xs">
                <span className="block text-lg sm:text-xl font-display font-extrabold text-[#10264A]">08</span>
                <span className="text-[11px] font-mono text-[#536781]">Official Arenas</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF8F2]/90 backdrop-blur-md border border-[#FFE0CE] shadow-2xs">
                <span className="block text-lg sm:text-xl font-display font-extrabold text-[#FF783E]">
                  {festival?.date ? festival.date.split(' ').slice(0, 2).join(' ').toUpperCase() : '19 OCT'}
                </span>
                <span className="text-[11px] font-mono text-[#536781]">Event Date</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#EDF5FC]/90 backdrop-blur-md border border-[#DCE5F2] shadow-2xs">
                <span className="block text-lg sm:text-xl font-display font-extrabold text-[#3978F6]">PCE</span>
                <span className="text-[11px] font-mono text-[#536781]">Nagpur Campus</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F2FC]/90 backdrop-blur-md border border-[#E8E1F8] shadow-2xs">
                <span className="block text-lg sm:text-xl font-display font-extrabold text-[#8578D8]">ETC</span>
                <span className="text-[11px] font-mono text-[#536781]">Host Dept</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CATEGORY FILTER BAR (Smooth natural flow, mobile scrollable)
          ========================================================================= */}
      <section className="py-4 sm:py-5 bg-white border-b border-[#DCE5F2] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-mono font-bold text-[#8CA0BA] uppercase mr-1 shrink-0 hidden md:inline">
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#10264A] text-white shadow-xs'
                      : 'bg-[#F8FAFD] text-[#536781] hover:bg-[#EDF5FC] hover:text-[#10264A] border border-[#DCE5F2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Registration Staging Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-700 shrink-0 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Registrations Active · TiDB Cloud Synced</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          COMPETITIONS GRID: 8 IMAGE-LED 16:9 CARDS
          Responsive layout: 1 col (mobile) -> 2 cols (tablet) -> 3 cols (desktop)
          ========================================================================= */}
      <main className="py-10 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#10264A]">
                All Competitions
              </h2>
              <p className="text-xs sm:text-sm text-[#536781]">
                Select any competition to view the official schedule, evaluation rubric, rules, and register.
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-[#FF783E] bg-[#FFF4EA] border border-[#FFE0CE] px-3 py-1.5 rounded-full hidden sm:inline-block">
              {filteredCompetitions.length} of 8 Arenas
            </span>
          </div>

          {/* Responsive Card Grid with Staggered Entrance Motion */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredCompetitions.map((comp, idx) => {
              const Icon = ICON_MAP[comp.iconName] || Cpu;
              const compGlow = getCompetitionGlow(comp.accentColor, comp.themeVibe);

              return (
                <motion.article
                  key={comp.id}
                  suppressHydrationWarning
                  initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.45,
                    delay: shouldReduceMotion ? 0 : idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`yugantar-card-interactive ${compGlow} rounded-3xl bg-white border border-[#DCE5F2] shadow-xs flex flex-col overflow-hidden group`}
                  style={{
                    '--card-edge-color': comp.accentColor,
                    '--card-edge-hover-border': comp.accentColor,
                  } as React.CSSProperties}
                >
                  {/* 16:9 Image Artwork Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#EDF5FC]">
                    <CompetitionCardArtwork
                      src={comp.cardImage}
                      alt={`${comp.name} 16:9 artwork`}
                      fallbackSrc={`/images/competitions/${comp.slug}.webp`}
                    />

                    {/* Gradient Overlay for Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#102344]/85 via-[#102344]/30 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-mono font-bold text-[#10264A] border border-white/60 shadow-xs">
                        ARENA 0{comp.districtIndex + 1}
                      </span>

                      <span
                        style={{ backgroundColor: comp.accentColor }}
                        className="px-2.5 py-1 rounded-full text-white text-[10px] font-mono font-bold shadow-xs"
                      >
                        {comp.category}
                      </span>
                    </div>

                    {/* Bottom Image Overlay Title & Icon */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: comp.accentBg, color: comp.accentColor }}
                          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/40"
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-white/90 truncate">
                          {comp.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div className="space-y-3">
                      {/* Competition Title */}
                      <h3 className="text-lg sm:text-xl font-display font-bold text-[#10264A] group-hover:text-[#FF783E] transition-colors leading-snug">
                        <Link href={`/competitions/${comp.slug}`}>
                          {comp.name}
                        </Link>
                      </h3>

                      {/* Accurate Description */}
                      <p className="text-xs text-[#536781] leading-relaxed line-clamp-3 font-normal">
                        {comp.shortDescription}
                      </p>

                      {/* Authoritative Requirement Pills */}
                      <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]/70 text-[11px] text-[#536781]">
                        {/* Eligibility */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[#8CA0BA] flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-[#3978F6]" /> Eligibility:
                          </span>
                          <span className="font-bold text-[#10264A] truncate text-right">
                            {comp.eligibility}
                          </span>
                        </div>

                        {/* Team Format */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[#8CA0BA] flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#FF783E]" /> Format:
                          </span>
                          <span className="font-bold text-[#10264A] truncate text-right">
                            {comp.teamSizeLimit}
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[#8CA0BA] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#8578D8]" /> Venue:
                          </span>
                          <span className="font-bold text-[#10264A] truncate text-right">
                            {comp.venue}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-[#E2E8F0] grid grid-cols-2 gap-2">
                      <Link
                        href={`/competitions/${comp.slug}`}
                        className="py-2.5 px-3 rounded-xl bg-[#F8FAFD] hover:bg-[#10264A] text-[#10264A] hover:text-white border border-[#DCE5F2] text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <Link
                        href={`/competitions/${comp.slug}/register`}
                        style={{ backgroundColor: comp.accentColor }}
                        className="py-2.5 px-3 rounded-xl text-white text-xs font-mono font-bold shadow-2xs hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Register</span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Department Organization Information Card (strictly NO IETE branding) */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
            className="rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF783E] bg-[#FFF4EA] border border-[#FFE0CE] px-2.5 py-0.5 rounded-full inline-block">
                  ACADEMIC HOST
                </span>
                <h4 className="text-base sm:text-lg font-display font-bold text-[#10264A]">
                  Department of Electronics & Telecommunication Engineering
                </h4>
                <p className="text-xs text-[#536781] max-w-xl">
                  Priyadarshini College of Engineering, CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur. Spearheaded by the TELE-ERA Department Student Forum.
                </p>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EDF5FC] hover:bg-[#10264A] text-[#10264A] hover:text-white text-xs font-mono font-bold transition-all shrink-0"
              >
                <span>About Organizers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
