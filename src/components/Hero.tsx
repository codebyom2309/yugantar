'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Cpu,
  ArrowRight,
  Play,
  X,
  Users,
  Landmark,
  Zap,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { FESTIVAL_INFO, FESTIVAL_ASSETS } from '@/data/events';
import type { FestivalSettings } from '@/lib/competitions';
import { fetchClientFestivalData } from '@/lib/client-festival-data';

export default function Hero({ festival: initialFestival }: { festival?: FestivalSettings }) {
  const containerRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [festival, setFestival] = useState<FestivalSettings>(() => initialFestival || {
    ...FESTIVAL_INFO,
    registrationGlobalOpen: true,
    heroArtwork: FESTIVAL_ASSETS.heroArtwork,
    heroArtworkMobile: FESTIVAL_ASSETS.heroArtworkMobile,
    logoEmblem: FESTIVAL_ASSETS.logoEmblem,
    districtsMap: FESTIVAL_ASSETS.districtsMap,
  });

  useEffect(() => {
    setMounted(true);
    if (initialFestival) {
      setFestival(initialFestival);
    } else {
      fetchClientFestivalData()
        .then((d) => {
          if (d.festival) setFestival(d.festival);
        })
        .catch(() => {});
    }
  }, [initialFestival]);

  // Live Countdown targeting authoritative festival date in IST
  // FIXED: Strict mathematical breakdown from totalSeconds prevents 347 HRS calculation bug
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(festival.isoDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const totalSeconds = Math.max(0, Math.floor(difference / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [festival.isoDate]);

  const padZero = (n: number) => n.toString().padStart(2, '0');

  // Subtle scroll-linked architectural depth (parallax)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 35]);

  // Motion animation presets honoring prefers-reduced-motion
  const fadeIn = (delay: number) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.45,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  // College & Department display labels
  const collegeLabel = festival.college
    ? festival.college.split(',')[0].trim().toUpperCase() + ' • NAGPUR'
    : 'PRIYADARSHINI COLLEGE OF ENGINEERING • NAGPUR';

  // Dynamic Headline parsing from database-backed tagline
  const rawTagline = festival.tagline || 'Ideas into circuits. Innovation into action.';
  const sentences = rawTagline.split('.').map((s) => s.trim()).filter(Boolean);
  const headlineLine1 = sentences[0] ? `${sentences[0]}.` : 'Ideas into circuits.';
  const headlineLine2 = sentences[1]
    ? sentences[1].endsWith('.')
      ? sentences[1]
      : `${sentences[1]}.`
    : 'Innovation into action.';

  // Assigned Hero Assets: Desktop = FuturisticCityAbovetheClouds, Mobile = DreamySunrise
  const heroDesktopImageSrc = festival.heroArtwork || '/images/nexus-city/home-hero-desktop.webp';
  const heroMobileImageSrc = festival.heroArtworkMobile || '/images/nexus-city/home-hero-mobile.webp';

  // Format festival date cleanly into day/month + year rows to guarantee no mobile card overflow
  const rawDateParts = (festival.date || '19 October 2026').trim().split(/\s+/);
  const displayDayMonth = rawDateParts.length >= 2
    ? `${rawDateParts[0]} ${rawDateParts[1].slice(0, 3).toUpperCase()}`
    : (festival.date || '19 OCT');
  const displayYear = rawDateParts.length >= 3 ? rawDateParts[2] : '2026';

  return (
    <section
      ref={containerRef}
      className="relative min-h-[92vh] lg:min-h-screen flex items-center pt-24 sm:pt-28 pb-16 lg:py-0 overflow-hidden bg-[#F5F6FA]"
    >
      {/* =========================================================================
          BACKGROUND ARTWORK:
          - Desktop (>= 1024px): FuturisticCityAbovetheClouds (/images/nexus-city/home-hero-desktop.webp)
          - Mobile (< 1024px): DreamySunrise (/images/nexus-city/home-hero-mobile.webp)
          ========================================================================= */}

      {/* 1. MOBILE HERO BACKGROUND (< 1024px) */}
      <div className="lg:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src={heroMobileImageSrc}
          alt={`${festival.concept} — ${festival.name} ${festival.edition} Futuristic Architectural Cityscape`}
          fill
          priority
          className="object-cover object-[70%_top] sm:object-center brightness-[1.02]"
          sizes="100vw"
        />

        {/* Soft luminance veil for pristine text contrast on narrow phones */}
        <div className="absolute inset-y-0 left-0 w-[82%] max-w-sm bg-gradient-to-r from-[#F8FAFC]/85 via-[#F8FAFC]/45 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#F8FAFC]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
      </div>

      {/* 2. DESKTOP HERO BACKGROUND (>= 1024px) with subtle depth transform */}
      <motion.div
        style={{ y: bgY }}
        className="hidden lg:block absolute inset-0 z-0 pointer-events-none overflow-hidden will-change-transform"
      >
        <Image
          src={heroDesktopImageSrc}
          alt={`${festival.concept} — ${festival.name} ${festival.edition} Desktop Futuristic Architectural Cityscape`}
          fill
          priority
          className="object-cover object-[78%_center] xl:object-right-top brightness-[1.03]"
          sizes="100vw"
        />

        {/* Desktop atmospheric gradient blend on the left for maximum typographic readability while keeping the city artwork crisp */}
        <div className="absolute inset-y-0 left-0 w-[46%] xl:w-[40%] bg-gradient-to-r from-[#F8FAFC]/88 via-[#F8FAFC]/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
      </motion.div>

      {/* Atmospheric ambient glows complementing the architecture (cool pale-blue and subtle electric blue) */}
      <div className="absolute top-16 left-12 w-96 h-96 rounded-full bg-gradient-to-br from-[#E9F2FF] to-[#3978F6]/15 blur-3xl opacity-60 pointer-events-none z-0" />
      <div className="absolute -bottom-10 right-20 w-80 h-80 rounded-full bg-[#E9F2FF]/50 blur-3xl opacity-50 pointer-events-none z-0" />

      {/* =========================================================================
          MAIN HERO CONTENT CONTAINER
          ========================================================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* =====================================================================
              LEFT COLUMN: Editorial Narrative, Headline, Metadata & CTAs
              ===================================================================== */}
          <div className="lg:col-span-7 flex flex-col items-start text-left pt-2 lg:pt-8">

            {/* 1. Compact Institutional Identity Strips (Dual-badge for mobile clarity) */}
            <motion.div
              {...fadeIn(0.05)}
              className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4 w-full"
            >
              {/* Institution Strip */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#DCE5F2] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3978F6] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-[#10264A] uppercase truncate max-w-[280px] sm:max-w-none">
                  {collegeLabel}
                </span>
              </div>

              {/* Department & Forum Strip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF4EA] border border-[#FFE0CE] shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF783E] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-[#FF783E] uppercase whitespace-nowrap">
                  DEPARTMENT OF ETC • TELE-ERA FORUM
                </span>
              </div>
            </motion.div>

            {/* 2. Brand & NEXUS CITY Concept Badges */}
            <motion.div
              {...fadeIn(0.12)}
              className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3.5 sm:mb-4"
            >
              {/* Midnight Glass Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-[#102344]/90 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-mono font-bold shadow-xs">
                <span className="text-[#FF783E]">✦</span>
                <span>{festival.name} {festival.edition}</span>
              </div>

              {/* Restrained Champagne Concept Badge */}
              <div className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-1 rounded-full bg-[#FFF0E3]/90 backdrop-blur-md border border-[#FFD1B5] text-[11px] sm:text-xs font-mono font-bold tracking-wider shadow-xs">
                <span className="text-[#9C6B52]">THEME:</span>
                <span className="text-[#FF783E]">{festival.concept}</span>
              </div>
            </motion.div>

            {/* 3. Centerpiece Display Headline */}
            <motion.div {...fadeIn(0.2)}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold tracking-tight text-[#10264A] leading-[1.08] sm:leading-[1.05] mb-4 sm:mb-5 max-w-2xl break-words">
                <span className="block text-[#10264A]">
                  {headlineLine1}
                </span>
                <span className="font-editorial text-sunset-glow italic font-normal inline-block relative mt-1 sm:mt-1.5">
                  {headlineLine2}
                  <span className="text-[#FF783E] ml-1.5 sm:ml-2 not-italic text-sm sm:text-base align-middle animate-pulse">
                    ✦
                  </span>
                </span>
              </h1>
            </motion.div>

            {/* 4. Narrative Festival Subtitle */}
            <motion.p
              {...fadeIn(0.28)}
              className="text-xs sm:text-sm lg:text-base text-[#475569] sm:text-[#334155] leading-relaxed max-w-xl mb-6 sm:mb-7 font-normal"
            >
              {festival.subheading}
            </motion.p>

            {/* 5. Horizontal 3-Card Metadata Deck (Engineered Skeuomorphic Glass) */}
            <motion.div
              {...fadeIn(0.36)}
              className="w-full grid grid-cols-3 gap-2 sm:gap-3.5 mb-6 sm:mb-7 max-w-lg"
            >
              {/* Card 1: Festival Date */}
              <div className="nexus-skeuo-card tech-crosshair p-2.5 sm:p-3 text-center flex flex-col items-center justify-between group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFF0E6] text-[#FF783E] border border-[#FFDEC9] flex items-center justify-center shrink-0 mb-1.5 transition-transform duration-250 group-hover:scale-105">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-[#10264A] block leading-tight">
                    {displayDayMonth}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-[#FF783E] block leading-tight mt-0.5">
                    {displayYear}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#60728A] block mt-0.5">
                    Festival Date
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#FF783E]/60 mx-auto mt-1.5 circuit-node-dot" />
              </div>

              {/* Card 2: Campus Location */}
              <div className="nexus-skeuo-card tech-crosshair p-2.5 sm:p-3 text-center flex flex-col items-center justify-between group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#EBF4FE] text-[#3978F6] border border-[#D0E6FC] flex items-center justify-center shrink-0 mb-1.5 transition-transform duration-250 group-hover:scale-105">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-[#10264A] block leading-tight truncate">
                    {festival.locationShort ? festival.locationShort.split(',')[0].trim() : 'PCE Campus'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#60728A] block mt-0.5">
                    {festival.locationShort && festival.locationShort.includes(',')
                      ? festival.locationShort.split(',')[1].trim()
                      : 'Nagpur'}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#3978F6]/60 mx-auto mt-1.5 circuit-node-dot" />
              </div>

              {/* Card 3: Eight Arenas */}
              <div className="nexus-skeuo-card tech-crosshair p-2.5 sm:p-3 text-center flex flex-col items-center justify-between group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFF4EA] text-[#FF783E] border border-[#FFE0CE] flex items-center justify-center shrink-0 mb-1.5 transition-transform duration-250 group-hover:scale-105">
                  <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-[#10264A] block leading-tight">
                    8 Arenas
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#60728A] block mt-0.5">
                    Hardware & Tech
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#FF783E]/60 mx-auto mt-1.5 circuit-node-dot" />
              </div>
            </motion.div>

            {/* 6. Action CTAs: Midnight Sapphire Pill + Frosted Glass Secondary */}
            <motion.div
              {...fadeIn(0.44)}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto mb-7 lg:mb-0"
            >
              {/* Primary: Deep Midnight Sapphire Pill with Embedded Arrow Button */}
              <Link
                href="/competitions"
                className="nexus-btn-sapphire pl-4 sm:pl-5 pr-2 py-2 text-xs sm:text-sm font-bold gap-2.5 sm:gap-3 group shadow-xl justify-between sm:justify-start"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[#FF783E] text-base">✦</span>
                  <span className="text-white">Explore 8 Competitions</span>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1D63B8] border border-white/30 flex items-center justify-center text-white transition-transform duration-200 group-hover:translate-x-1 shadow-xs shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Secondary: Frosted Glass Button with Dark Play Icon */}
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="nexus-btn-frosted px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold gap-2.5 shadow-md cursor-pointer justify-center sm:justify-start"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10264A] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-[#FF783E]" />
                </div>
                <span className="text-[#10264A]">Watch Trailer</span>
              </button>
            </motion.div>

            {/* Mobile-Only Countdown Deck */}
            <div className="lg:hidden w-full mt-6">
              <CountdownDeck timeLeft={timeLeft} padZero={padZero} mounted={mounted} />
            </div>

          </div>

          {/* =====================================================================
              RIGHT COLUMN: Desktop Floating Glass Countdown & Staging Gateway
              ===================================================================== */}
          <div className="hidden lg:flex lg:col-span-5 flex-col items-end gap-6">

            {/* The Cinematic Floating Countdown Deck */}
            <motion.div {...fadeIn(0.25)} className="w-full max-w-md">
              <CountdownDeck timeLeft={timeLeft} padZero={padZero} mounted={mounted} />
            </motion.div>

            {/* Registration Gateway Staging Card */}
            <motion.div
              {...fadeIn(0.35)}
              className="w-full max-w-md nexus-midnight-glass p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF783E]/20 border border-[#FF783E]/40">
                  <span className="w-2 h-2 rounded-full bg-[#FF783E] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFD1B5]">
                    REGISTRATION DESK
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-white/70">
                  <Clock className="w-3.5 h-3.5 text-[#B8D9F5]" />
                  <span>{festival.registrationGlobalOpen ? 'Active Phase' : 'Staging Phase'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF783E]" />
                <h3 className="text-sm font-display font-bold text-white">
                  Official Registration Gateway
                </h3>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                {festival.registrationStatusMessage ||
                  (festival.registrationGlobalOpen
                    ? 'Delegate registrations are live for all eight innovation competitions with instant TiDB Cloud verification.'
                    : 'Delegate registrations are in staging phase. Official links will activate shortly.')}
              </p>

              <Link
                href="/competitions"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200"
              >
                <span>{festival.registrationGlobalOpen ? 'Explore & Register Now' : 'Preview 8 Arenas'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF783E]" />
              </Link>
            </motion.div>

          </div>

        </div>
      </div>

      {/* =========================================================================
          CINEMATIC TRAILER PREVIEW MODAL
          Preserved functionality with festival details & teaser preview
          ========================================================================= */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#102344]/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white/95 rounded-3xl border border-white/80 shadow-2xl overflow-hidden p-6 sm:p-8">
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#10264A] text-white flex items-center justify-center hover:bg-[#FF783E] transition-colors cursor-pointer"
              aria-label="Close trailer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0E3] border border-[#FFD1B5] text-xs font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YUGANTAR 2026 · FESTIVAL TEASER</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#10264A] mb-3">
              NEXUS CITY: Metropole of Innovation
            </h3>

            <p className="text-sm text-[#475569] leading-relaxed mb-6">
              Experience the convergence of eight engineering districts, hardware circuits, research defense, and intercollegiate competition at Priyadarshini College of Engineering, Nagpur.
            </p>

            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 border border-[#D2E4F7] shadow-inner bg-[#102344]">
              <Image
                src={heroDesktopImageSrc}
                alt="Trailer Preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102344]/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-mono text-[#FF783E] font-bold uppercase tracking-wider">
                  {festival.date ? festival.date.toUpperCase() : '19 OCTOBER 2026'} · {festival.locationShort || 'NAGPUR'}
                </span>
                <span className="text-lg font-display font-bold text-white">
                  Eight Competitions. One Epic Stage.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/competitions"
                onClick={() => setTrailerOpen(false)}
                className="nexus-btn-sapphire px-6 py-2.5 text-xs font-bold gap-2"
              >
                <span>Explore Competitions</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF783E]" />
              </Link>
              <button
                type="button"
                onClick={() => setTrailerOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-mono font-bold text-[#536781] hover:bg-[#F5F6FA] cursor-pointer"
              >
                Close Teaser
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

// =============================================================================
// FLOATING COUNTDOWN GLASS DECK ("THE JOURNEY BEGINS IN")
// Tabular numbers prevent layout shift; correct math strictly normalizes hours (0-23)
// =============================================================================
function CountdownDeck({
  timeLeft,
  padZero,
  mounted,
}: {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  padZero: (n: number) => string;
  mounted: boolean;
}) {
  return (
    <div className="w-full bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
      {/* Top Tier: Header and 4 Frosted Countdown Cubes */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#536781] uppercase mb-3 sm:mb-4 text-center">
          <span className="text-[#FF783E]">✦</span>
          <span>THE JOURNEY BEGINS IN</span>
          <span className="text-[#FF783E]">✦</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
          {/* Days */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#10264A] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.days) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              DAYS
            </span>
          </div>

          {/* Hours (strictly 00-23) */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#10264A] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.hours) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              HRS
            </span>
          </div>

          {/* Minutes (strictly 00-59) */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#10264A] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.minutes) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              MIN
            </span>
          </div>

          {/* Seconds (strictly 00-59) */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#FF783E] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.seconds) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              SEC
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Tier: Deep Midnight Glass Base Bar */}
      <div className="bg-[#102344]/95 backdrop-blur-xl border-t border-white/15 px-3 sm:px-6 py-2.5 sm:py-3 text-white flex items-center justify-around text-[11px] sm:text-xs font-mono font-medium">
        <div className="flex items-center gap-1.5 text-white/90">
          <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#B8D9F5]" />
          <span>Students</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1.5 text-white/90">
          <Landmark className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FFD1B5]" />
          <span>Institutions</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1.5 text-white/90">
          <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FF783E]" />
          <span>Ideas</span>
        </div>
      </div>
    </div>
  );
}
