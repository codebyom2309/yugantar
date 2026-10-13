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
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

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

  // Video Autoplay & Failure Fallback Handling
  useEffect(() => {
    if (shouldReduceMotion) return;
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setVideoLoaded(true);
    const handleError = () => setVideoFailed(true);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setVideoLoaded(true))
        .catch((err) => {
          // Autoplay policy or media format fallback
          console.warn('Hero video autoplay blocked or failed, using poster fallback:', err);
          setVideoFailed(true);
        });
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [shouldReduceMotion]);

  // Live Countdown targeting authoritative festival date in IST
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(festival.isoDate || '2026-10-21T09:00:00+05:30').getTime();

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

  // College label matching reference
  const collegeLabel = festival.college
    ? festival.college.split(',')[0].trim().toUpperCase() + ' • NAGPUR'
    : 'PRIYADARSHINI COLLEGE OF ENGINEERING • NAGPUR';

  // Date labels matching reference (21 OCT 2026)
  const displayDayMonth = '21 OCT';
  const displayYear = '2026';

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] lg:min-h-screen flex flex-col justify-start lg:justify-center pt-24 sm:pt-28 lg:pt-0 pb-10 sm:pb-14 lg:pb-0 overflow-hidden bg-[#071329]"
    >
      {/* =========================================================================
          BACKGROUND ARTWORK:
          - Continuous, seamless cinematic space composition with rings & stars
          - ZERO hard vertical edges, ZERO rectangular overlays, ZERO cutoffs
          - Natural edge-free smooth gradient blending into the next section
          ========================================================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* 1. High-Performance Static Poster Bedrock (Instant Paint & Fallback) */}
        <Image
          src="/images/nexus-city/hero-space-poster.webp"
          alt="YUGANTAR 2026 Space Atmosphere"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center lg:object-[center_35%] brightness-[0.95] contrast-[1.08] saturate-[1.08]"
        />

        {/* 2. Moving Space Background Video */}
        {!shouldReduceMotion && !videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            poster="/images/nexus-city/hero-space-poster.webp"
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center lg:object-[center_35%] brightness-[0.95] contrast-[1.08] saturate-[1.08] transition-opacity duration-700 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/videos/hero-space-bg.mp4" type="video/mp4" />
          </video>
        )}

        {/* 3. Broad, seamless horizontal light gradient - 100% full-bleed, zero vertical lines or boundaries */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none" />

        {/* 4. Desktop-only Luminous Electric-Blue Hero HUD Frame */}
        <div className="hero-frame-border" />

        {/* 5. Smooth Dissolve Transition into Next Beige Section (#FFF8F2) */}
        <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 bg-gradient-to-b from-transparent via-[#FFF8F2]/60 to-[#FFF8F2] pointer-events-none z-1" />
      </div>

      {/* =========================================================================
          MAIN HERO CONTENT CONTAINER
          ========================================================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full py-2 sm:py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">

          {/* =====================================================================
              LEFT COLUMN: Editorial Narrative, Headline, Metadata & CTAs
              ===================================================================== */}
          <div className="lg:col-span-7 w-full flex flex-col items-start text-left pt-0 lg:pt-4">

            {/* 1. College Institution Badge */}
            <motion.div
              {...fadeIn(0.04)}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-white/94 sm:bg-white/96 backdrop-blur-md border border-white shadow-xs shadow-[#102344]/5 mb-1.5 sm:mb-2 max-w-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-[#10264A] uppercase truncate">
                {collegeLabel}
              </span>
            </motion.div>

            {/* 2. Department & Forum Badge */}
            <motion.div
              {...fadeIn(0.08)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#FFFBF7]/95 sm:bg-[#FFFBF7]/96 backdrop-blur-md border border-[#FFDFC9] shadow-xs shadow-[#102344]/5 mb-2 sm:mb-2.5 max-w-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF783E] shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-[#FF783E] uppercase truncate">
                DEPARTMENT OF ETC • TELE-ERA FORUM
              </span>
            </motion.div>

            {/* 3. Festival Brand & Concept Badges */}
            <motion.div
              {...fadeIn(0.12)}
              className="flex flex-wrap items-center gap-2 mb-2.5 sm:mb-3.5"
            >
              {/* Midnight Navy Capsule with Orange Star */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-[#0B1B36] border border-white/20 text-white text-[10.5px] sm:text-xs font-mono font-bold shadow-xs">
                <span className="text-[#FF783E]">✦</span>
                <span>{festival.name} {festival.edition}</span>
              </div>

              {/* White Glass Concept Badge */}
              <div className="inline-flex items-center gap-1 px-3 py-0.5 sm:py-1 rounded-full bg-white/94 sm:bg-white/96 backdrop-blur-md border border-white text-[10.5px] sm:text-xs font-mono font-bold tracking-wider shadow-xs shadow-[#102344]/5">
                <span className="text-[#10264A]">THEME:</span>
                <span className="text-[#FF783E]">{festival.concept}</span>
              </div>
            </motion.div>

            {/* 4. Display Headline & Narrative backed by Subtle Glass-Mist Plate (Reference Image 2) */}
            <motion.div {...fadeIn(0.18)} className="hero-glass-mist-plate w-full max-w-xl mb-3 sm:mb-4">
              {/* Pre-headline */}
              <div className="text-[11px] sm:text-xs lg:text-sm font-mono font-bold tracking-[0.28em] text-[#0B1B36] uppercase mb-1">
                IDEAS INTO
              </div>

              {/* Display Headline */}
              <h1 className="text-[37px] sm:text-6xl lg:text-7xl xl:text-8xl font-display font-black tracking-tight text-[#0B1B36] leading-[0.98]">
                <div className="relative inline-flex items-center">
                  <span>CIRCUITS</span>
                  <span className="text-[#FF783E]">.</span>
                  {/* 4-Pointed Sparkle Star */}
                  <span
                    className="absolute -top-2.5 -right-6 sm:-top-3.5 sm:-right-8 text-[#FF783E] text-2xl sm:text-3xl lg:text-4xl animate-pulse select-none filter drop-shadow-[0_0_8px_rgba(255,120,62,0.5)]"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                </div>
                <span className="block font-editorial italic font-normal hero-innovation-glow text-[33px] sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-[1.02] mt-0.5 sm:mt-1">
                  INNOVATION
                </span>
                <span className="block text-[11.5px] sm:text-base lg:text-xl font-mono font-bold tracking-[0.24em] text-[#0B1B36] uppercase mt-1 sm:mt-1.5">
                  INTO ACTION.
                </span>
                <div className="w-14 sm:w-20 h-0.5 bg-[#FF783E] rounded-full mt-1.5" />
              </h1>

              {/* Clean Narrative Festival Description - High Visibility & Constrained Left-to-Center */}
              <p className="mt-2.5 sm:mt-3 text-[12px] sm:text-[13.5px] lg:text-[14.5px] text-[#0F203C] leading-relaxed font-medium max-w-[85%] sm:max-w-md lg:max-w-lg">
                {festival.subheading}
              </p>
            </motion.div>

            {/* 6. Horizontal 3-Card Metadata Deck (Restrained Real Glassmorphism) */}
            <motion.div
              {...fadeIn(0.32)}
              className="w-full grid grid-cols-3 gap-1.5 sm:gap-3 mb-3.5 sm:mb-5 max-w-lg"
            >
              {/* Card 1: Festival Date */}
              <div className="hero-glass-card tech-bracket-tl px-1.5 py-2 sm:p-2.5 text-center flex flex-col items-center justify-between group min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FFF2E8]/90 text-[#FF783E] border border-[#FFDFC9] flex items-center justify-center shrink-0 mb-1 transition-transform duration-250 group-hover:scale-105">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="w-full">
                  <span className="text-[11px] sm:text-sm font-display font-extrabold text-[#0B1B36] block leading-tight truncate">
                    {displayDayMonth}
                  </span>
                  <span className="text-[9px] sm:text-xs font-mono font-bold text-[#FF783E] block leading-tight mt-0.5">
                    {displayYear}
                  </span>
                  <span className="text-[8px] sm:text-[9.5px] font-mono text-[#52647E] block mt-0.5 truncate">
                    Festival Date
                  </span>
                </div>
                {/* Concentric Node Dot */}
                <div className="flex items-center justify-center mt-1 sm:mt-1.5">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF783E]/25" />
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-[#FF783E]" />
                  </span>
                </div>
              </div>

              {/* Card 2: Campus Location */}
              <div className="hero-glass-card tech-bracket-tl px-1.5 py-2 sm:p-2.5 text-center flex flex-col items-center justify-between group min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#EEF5FF]/90 text-[#2563EB] border border-[#D5E8FD] flex items-center justify-center shrink-0 mb-1 transition-transform duration-250 group-hover:scale-105">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="w-full">
                  <span className="text-[11px] sm:text-sm font-display font-extrabold text-[#0B1B36] block leading-tight truncate">
                    {festival.locationShort ? festival.locationShort.split(',')[0].trim() : 'PCE Campus'}
                  </span>
                  <span className="text-[8px] sm:text-[9.5px] font-mono text-[#52647E] block mt-0.5 truncate">
                    {festival.locationShort && festival.locationShort.includes(',')
                      ? festival.locationShort.split(',')[1].trim()
                      : 'Nagpur'}
                  </span>
                </div>
                {/* Concentric Node Dot */}
                <div className="flex items-center justify-center mt-1 sm:mt-1.5">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#2563EB]/25" />
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-[#2563EB]" />
                  </span>
                </div>
              </div>

              {/* Card 3: Eight Arenas */}
              <div className="hero-glass-card tech-bracket-tl px-1.5 py-2 sm:p-2.5 text-center flex flex-col items-center justify-between group min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FFF2E8]/90 text-[#FF783E] border border-[#FFDFC9] flex items-center justify-center shrink-0 mb-1 transition-transform duration-250 group-hover:scale-105">
                  <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="w-full">
                  <span className="text-[11px] sm:text-sm font-display font-extrabold text-[#0B1B36] block leading-tight truncate">
                    8 Arenas
                  </span>
                  <span className="text-[7.5px] sm:text-[9.5px] font-mono text-[#52647E] block mt-0.5 truncate">
                    Hardware & Tech
                  </span>
                </div>
                {/* Concentric Node Dot */}
                <div className="flex items-center justify-center mt-1 sm:mt-1.5">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF783E]/25" />
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-[#FF783E]" />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 7. Action CTAs: Primary Midnight Sapphire Pill with Edge Glow + Glassmorphic Secondary */}
            <motion.div
              {...fadeIn(0.4)}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto mb-2 lg:mb-0"
            >
              {/* Primary: Deep Midnight Pill with Restrained Electric-Blue Edge Lighting */}
              <Link
                href="/competitions"
                className="hero-edge-glow-cta pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1.5 sm:py-2 text-xs sm:text-sm font-bold gap-2.5 sm:gap-3 group shadow-xl justify-between sm:justify-start rounded-full inline-flex items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#FF783E] text-sm sm:text-base select-none">✦</span>
                  <span className="text-white tracking-tight">Explore 8 Competitions</span>
                </div>
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] border border-white/30 flex items-center justify-center text-white transition-transform duration-200 group-hover:translate-x-1 shadow-xs shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </Link>

              {/* Secondary: Glassmorphic Button with Dark Play Icon */}
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="hero-glass-trailer px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold gap-2 cursor-pointer justify-center sm:justify-start rounded-full inline-flex items-center"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0B1B36] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#FF783E] text-[#FF783E] ml-0.5" />
                </div>
                <span className="text-[#0B1B36]">Watch Trailer</span>
              </button>
            </motion.div>

            {/* 8. Mobile & Tablet Live Countdown Glass Deck with Stats Strip */}
            <div className="lg:hidden w-full mt-4 sm:mt-5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B36]/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white/95 rounded-3xl border border-white/80 shadow-2xl overflow-hidden p-6 sm:p-8">
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0B1B36] text-white flex items-center justify-center hover:bg-[#FF783E] transition-colors cursor-pointer"
              aria-label="Close trailer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0E6] border border-[#FFD1B5] text-xs font-mono font-bold text-[#FF783E] uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YUGANTAR 2026 · FESTIVAL TEASER</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0B1B36] mb-3">
              NEXUS CITY: Metropole of Innovation
            </h3>

            <p className="text-sm text-[#475569] leading-relaxed mb-6">
              Experience the convergence of eight engineering districts, hardware circuits, research defense, and intercollegiate competition at Priyadarshini College of Engineering, Nagpur.
            </p>

            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 border border-[#D2E4F7] shadow-inner bg-[#0B1B36]">
              <Image
                src="/images/nexus-city/hero-space-poster.webp"
                alt="Trailer Preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B36]/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-mono text-[#FF783E] font-bold uppercase tracking-wider">
                  21 OCTOBER 2026 · NAGPUR
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
                className="hero-edge-glow-cta px-6 py-2.5 text-xs font-bold gap-2 rounded-full inline-flex items-center text-white"
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
    <div className="w-full bg-white/86 sm:bg-white/90 backdrop-blur-2xl border border-white rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
      {/* Top Tier: Header and 4 Frosted Countdown Cubes */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#536781] uppercase mb-3 sm:mb-4 text-center">
          <span className="text-[#FF783E]">✦</span>
          <span>THE JOURNEY BEGINS IN</span>
          <span className="text-[#FF783E]">✦</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
          {/* Days */}
          <div className="bg-[#F1F5FD]/92 backdrop-blur-md border border-white/90 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#0B1B36] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.days) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              DAYS
            </span>
          </div>

          {/* Hours (strictly 00-23) */}
          <div className="bg-[#F1F5FD]/92 backdrop-blur-md border border-white/90 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#0B1B36] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.hours) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              HRS
            </span>
          </div>

          {/* Minutes (strictly 00-59) */}
          <div className="bg-[#F1F5FD]/92 backdrop-blur-md border border-white/90 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span
              suppressHydrationWarning
              className="block text-lg sm:text-2xl font-display font-extrabold text-[#0B1B36] leading-tight tabular-nums"
            >
              {mounted ? padZero(timeLeft.minutes) : '--'}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              MIN
            </span>
          </div>

          {/* Seconds (strictly 00-59) */}
          <div className="bg-[#F1F5FD]/92 backdrop-blur-md border border-white/90 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
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
      <div className="bg-[#0B1B36]/95 backdrop-blur-xl border-t border-white/15 px-3 sm:px-6 py-2.5 sm:py-3 text-white flex items-center justify-around text-[11px] sm:text-xs font-mono font-medium">
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
