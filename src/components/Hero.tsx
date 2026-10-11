'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Layers,
  ArrowRight,
  Play,
  X,
  Users,
  Landmark,
  Zap,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { FESTIVAL_INFO, FESTIVAL_ASSETS } from '@/data/events';

export default function Hero() {
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Live Countdown state targeting 22 October 2026 09:00 IST
  const [timeLeft, setTimeLeft] = useState({
    days: 11,
    hours: 12,
    minutes: 30,
    seconds: 2,
  });

  useEffect(() => {
    const targetDate = new Date(FESTIVAL_INFO.isoDate).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format numbers with leading zeros
  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center pt-24 sm:pt-28 pb-16 lg:py-0 overflow-hidden bg-[#F5F6FA]">
      
      {/* =========================================================================
          RESPONSIVE BACKGROUND ARTWORK SELECTION
          Mobile: Dedicated DreamySunrise portrait wallpaper (nexus-city-mobile.png)
          Desktop: FuturisticCityAbovetheClouds landscape panoramic artwork
          ========================================================================= */}

      {/* 1. MOBILE DEDICATED HERO BACKGROUND (Viewports < 1024px) */}
      <div className="lg:hidden absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src={FESTIVAL_ASSETS.heroArtworkMobile}
          alt="NEXUS CITY — YUGANTAR 2026 Mobile Futuristic Cityscape"
          fill
          priority
          className="object-cover object-right-top brightness-[1.02]"
          sizes="100vw"
        />

        {/* Subtle, soft luminance veil over the open sky on the left where text sits */}
        {/* Preserves crystal spires, terraces, cherry blossoms, and waterfalls on the right */}
        <div className="absolute inset-y-0 left-0 w-[82%] max-w-sm bg-gradient-to-r from-[#F5F6FA]/80 via-[#F5F6FA]/40 to-transparent" />
        
        {/* Soft upper blend behind the floating navigation pill */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F5F6FA]/70 via-[#F5F6FA]/25 to-transparent" />

        {/* Bottom seamless blend into next section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F5F6FA] to-transparent" />
      </div>

      {/* 2. DESKTOP DEDICATED HERO BACKGROUND (Viewports >= 1024px) */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src={FESTIVAL_ASSETS.heroArtwork}
          alt="NEXUS CITY — YUGANTAR 2026 Desktop Futuristic Architectural Cityscape"
          fill
          priority
          className="object-cover object-[75%_center] xl:object-right-top brightness-[1.03]"
          sizes="100vw"
        />

        {/* Desktop atmospheric gradient blend on the left for maximum typographic readability */}
        <div className="absolute inset-y-0 left-0 w-[55%] xl:w-[48%] bg-gradient-to-r from-[#F5F6FA]/92 via-[#F5F6FA]/70 to-transparent backdrop-blur-[1px]" />

        {/* Bottom seamless transition to following sections */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F5F6FA] to-transparent" />
      </div>

      {/* Atmospheric ambient glows complementing the peach sunset atmosphere */}
      <div className="absolute top-16 left-12 w-96 h-96 rounded-full bg-gradient-to-br from-[#FFF0E3] to-[#B8D9F5]/30 blur-3xl opacity-70 pointer-events-none z-0" />
      <div className="absolute -bottom-10 right-20 w-80 h-80 rounded-full bg-[#FFD1B5]/40 blur-3xl opacity-60 pointer-events-none z-0" />

      {/* =========================================================================
          MAIN HERO CONTENT CONTAINER
          ========================================================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* =====================================================================
              LEFT COLUMN: Editorial Narrative, Headline, Metadata & CTAs
              Positioned over the open sky area for pristine legibility!
              ===================================================================== */}
          <div className="lg:col-span-7 flex flex-col items-start text-left pt-2 lg:pt-8">
            
            {/* 1. Institutional Eyebrow Pill */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-white/85 shadow-2xs mb-4 sm:mb-5">
              <span className="w-2 h-2 rounded-full bg-[#FF874D]" />
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-[#15294A] uppercase">
                PCE NAGPUR • DEPARTMENT OF ETC
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#536781]" />
            </div>

            {/* 2. Dual Concept Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-4 sm:mb-5">
              {/* Midnight Glass Badge with Gold Sparkle */}
              <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-[#102344]/90 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-mono font-bold shadow-xs">
                <span className="text-[#FF874D]">✦</span>
                <span>YUGANTAR 2026</span>
              </div>

              {/* Warm Champagne Frosted Badge */}
              <div className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-1 rounded-full bg-[#FFF0E3]/90 backdrop-blur-md border border-[#FFD1B5] text-[11px] sm:text-xs font-mono font-bold tracking-wider shadow-xs">
                <span className="text-[#9C6B52]">THEME:</span>
                <span className="text-[#FF874D]">NEXUS CITY</span>
              </div>
            </div>

            {/* 3. Centerpiece Display Headline with Sunset Italic Script */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-[#15294A] leading-[1.06] mb-4 sm:mb-5">
              Enter the city. <br />
              <span className="font-editorial text-sunset-glow relative inline-block font-normal">
                Engineer the future.
                <span className="absolute -top-1 -right-6 text-[#FF874D] text-lg sm:text-xl animate-pulse">✦</span>
              </span>
            </h1>

            {/* 4. Narrative Festival Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed max-w-xl mb-6 sm:mb-7 font-normal">
              An intercollegiate technical festival celebrating engineering ideas, hands-on experimentation, and collaborative discovery. Compete across eight specialized innovation arenas at Priyadarshini College of Engineering, Nagpur.
            </p>

            {/* 5. Horizontal 3-Card Metadata Deck (Translucent Frosted Glass) */}
            {/* Structured with icon on top so text fits without truncation even at 320px-360px! */}
            <div className="w-full grid grid-cols-3 gap-2 sm:gap-3.5 mb-6 sm:mb-7 max-w-lg">
              {/* Card 1: Festival Date */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/85 rounded-2xl p-2 sm:p-3 shadow-xs hover:shadow-md hover:bg-white/90 transition-all duration-300 text-center flex flex-col items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFF0E6] text-[#FF874D] border border-[#FFDEC9] flex items-center justify-center shrink-0 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-[#15294A] block leading-tight">
                    22 OCT 2026
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#536781] block mt-0.5">
                    Festival Date
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#FF874D]/50 mx-auto mt-1.5" />
              </div>

              {/* Card 2: Campus Location */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/85 rounded-2xl p-2 sm:p-3 shadow-xs hover:shadow-md hover:bg-white/90 transition-all duration-300 text-center flex flex-col items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#EBF4FE] text-[#3B82F6] border border-[#D0E6FC] flex items-center justify-center shrink-0 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-[#15294A] block leading-tight">
                    PCE Campus
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#536781] block mt-0.5">
                    Nagpur
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#3B82F6]/50 mx-auto mt-1.5" />
              </div>

              {/* Card 3: Eight Arenas */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/85 rounded-2xl p-2 sm:p-3 shadow-xs hover:shadow-md hover:bg-white/90 transition-all duration-300 text-center flex flex-col items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFF2E8] text-[#FF874D] border border-[#FFDEC9] flex items-center justify-center shrink-0 mb-1.5">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-display font-extrabold text-[#15294A] block leading-tight">
                    8 Arenas
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-[#536781] block mt-0.5">
                    Explore All
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#FF874D]/50 mx-auto mt-1.5" />
              </div>
            </div>

            {/* 6. Action CTAs: Midnight Sapphire Pill + Frosted Glass Secondary */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto mb-7 lg:mb-0">
              {/* Primary: Deep Midnight Sapphire Pill with Embedded Arrow Button */}
              <Link
                href="/competitions"
                className="nexus-btn-sapphire pl-4 sm:pl-5 pr-2 py-2 text-xs sm:text-sm font-bold gap-2.5 sm:gap-3 group shadow-xl justify-between sm:justify-start"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[#FF874D] text-base">✦</span>
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
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#15294A] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-[#FF874D]" />
                </div>
                <span className="text-[#15294A]">Watch Trailer</span>
              </button>
            </div>

            {/* Mobile-Only Countdown Deck Display */}
            <div className="lg:hidden w-full mt-6">
              <CountdownDeck timeLeft={timeLeft} padZero={padZero} />
            </div>

          </div>

          {/* =====================================================================
              RIGHT COLUMN: Desktop Floating Glass Countdown & Staging Gateway
              ===================================================================== */}
          <div className="hidden lg:flex lg:col-span-5 flex-col items-end gap-6">
            
            {/* The Cinematic Floating Countdown Deck */}
            <div className="w-full max-w-md">
              <CountdownDeck timeLeft={timeLeft} padZero={padZero} />
            </div>

            {/* Registration Gateway Staging Card */}
            <div className="w-full max-w-md nexus-midnight-glass p-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF874D]/20 border border-[#FF874D]/40">
                  <span className="w-2 h-2 rounded-full bg-[#FF874D] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFD1B5]">
                    REGISTRATION DESK
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-white/70">
                  <Clock className="w-3.5 h-3.5 text-[#B8D9F5]" />
                  <span>Staging Phase</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF874D]" />
                <h3 className="text-sm font-display font-bold text-white">
                  Official Registration Gateway
                </h3>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                Delegate registrations will be managed through official Google Forms for each of the eight competitions. Official links will activate here.
              </p>

              <Link
                href="/competitions"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200"
              >
                <span>Preview 8 Arenas</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF874D]" />
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* =========================================================================
          CINEMATIC TRAILER PREVIEW MODAL
          ========================================================================= */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#102344]/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white/95 rounded-3xl border border-white/80 shadow-2xl overflow-hidden p-6 sm:p-8">
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#15294A] text-white flex items-center justify-center hover:bg-[#FF874D] transition-colors"
              aria-label="Close trailer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0E3] border border-[#FFD1B5] text-xs font-mono font-bold text-[#FF874D] uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YUGANTAR 2026 · FESTIVAL TEASER</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#15294A] mb-3">
              NEXUS CITY: Enter the Metropole of Innovation
            </h3>

            <p className="text-sm text-[#536781] leading-relaxed mb-6">
              Experience the convergence of eight engineering districts, hardware circuits, research defense, and intercollegiate competition at Priyadarshini College of Engineering, Nagpur.
            </p>

            <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 border border-[#D2E4F7] shadow-inner bg-[#102344]">
              <Image
                src={FESTIVAL_ASSETS.heroArtwork}
                alt="Trailer Preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102344]/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-mono text-[#FF874D] font-bold uppercase tracking-wider">
                  22 OCTOBER 2026 · NAGPUR
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
                <ArrowRight className="w-3.5 h-3.5 text-[#FF874D]" />
              </Link>
              <button
                onClick={() => setTrailerOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-mono font-bold text-[#536781] hover:bg-[#F5F6FA]"
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
// Authentically recreates the frosted cubes & midnight base bar from reference
// =============================================================================
function CountdownDeck({
  timeLeft,
  padZero,
}: {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  padZero: (n: number) => string;
}) {
  return (
    <div className="w-full bg-white/70 backdrop-blur-2xl border border-white/85 rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
      {/* Top Tier: Header and 4 Frosted Countdown Cubes */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#536781] uppercase mb-3 sm:mb-4 text-center">
          <span className="text-[#FF874D]">✦</span>
          <span>THE JOURNEY BEGINS IN</span>
          <span className="text-[#FF874D]">✦</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
          {/* Days */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span className="block text-lg sm:text-2xl font-display font-extrabold text-[#15294A] leading-tight">
              {padZero(timeLeft.days)}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              DAYS
            </span>
          </div>

          {/* Hours */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span className="block text-lg sm:text-2xl font-display font-extrabold text-[#15294A] leading-tight">
              {padZero(timeLeft.hours)}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              HRS
            </span>
          </div>

          {/* Minutes */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span className="block text-lg sm:text-2xl font-display font-extrabold text-[#15294A] leading-tight">
              {padZero(timeLeft.minutes)}
            </span>
            <span className="block text-[9px] sm:text-[10px] font-mono font-bold text-[#536781] tracking-wider uppercase mt-0.5">
              MIN
            </span>
          </div>

          {/* Seconds */}
          <div className="bg-[#E8EDF8]/85 backdrop-blur-md border border-white/85 rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 text-center shadow-inner">
            <span className="block text-lg sm:text-2xl font-display font-extrabold text-[#FF874D] leading-tight">
              {padZero(timeLeft.seconds)}
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
          <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FF874D]" />
          <span>Ideas</span>
        </div>
      </div>
    </div>
  );
}
