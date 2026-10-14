'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, LayoutGrid, Sparkles } from 'lucide-react';
import { fetchClientFestivalData } from '@/lib/client-festival-data';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventDateLabel, setEventDateLabel] = useState('19 OCTOBER 2026 · PCE NAGPUR');
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchClientFestivalData()
      .then((d) => {
        if (d.festival?.event_date) {
          setEventDateLabel(
            `${d.festival.event_date.toUpperCase()} · ${
              d.festival.event_location_short
                ? d.festival.event_location_short.toUpperCase()
                : 'PCE NAGPUR'
            }`
          );
        }
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Competitions', href: '/competitions' },
    { label: 'Districts Map', href: '/districts' },
    { label: 'Journey', href: '/journey' },
    { label: 'About & Organizers', href: '/about' },
    { label: 'FAQ', href: '/faq' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-2.5 sm:top-4 left-0 right-0 z-50 px-2 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300">
      <div className="w-full max-w-xl lg:max-w-6xl mx-auto flex items-center justify-center">
        
        {/* =======================================================================
            UNIFIED FLOATING GLASS CAPSULE (Brand + 2026 + 8 Arenas + Menu)
            Single coherent container matching user reference perfectly
            ======================================================================= */}
        <div
          className={`pointer-events-auto w-full flex items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${
            isScrolled
              ? 'bg-white/98 backdrop-blur-2xl border border-white shadow-xl shadow-[#102344]/12'
              : 'bg-white/94 backdrop-blur-2xl border border-white/95 shadow-lg shadow-[#102344]/8'
          }`}
        >
          {/* Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2.5 group focus:outline-none rounded-full shrink-0"
            aria-label="YUGANTAR 2026 Homepage"
          >
            {/* Official TELE-ERA / YUGANTAR 2026 Emblem */}
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#0B1B36] border border-white/20 p-0.5 flex items-center justify-center shadow-2xs transition-transform duration-250 group-hover:scale-105 shrink-0 overflow-hidden">
              <Image
                src="/images/yugantar-logo.webp"
                alt="YUGANTAR 2026 Official Logo"
                width={32}
                height={32}
                priority
                unoptimized
                className="w-full h-full object-contain rounded-md sm:rounded-lg"
              />
            </div>

            {/* Wordmark, Year Badge and TELE-ERA Identity */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-display font-extrabold text-xs sm:text-base lg:text-lg tracking-tight text-[#15294A] group-hover:text-[#FF874D] transition-colors whitespace-nowrap">
                YUGANTAR
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FFF0E3] text-[#FF874D] border border-[#FFD1B5] shrink-0">
                2026
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#536781] border-l border-[#DCE5F2] pl-2.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3978F6]" />
                TELE-ERA FORUM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1 px-3 border-x border-[#E2E8F0]">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all focus:outline-none whitespace-nowrap ${
                    active
                      ? 'bg-[#15294A] text-white font-bold shadow-2xs'
                      : 'text-[#536781] hover:text-[#15294A] hover:bg-white/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Cluster: 8 Arenas Pill + Circular Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 8 Arenas Pill */}
            <Link
              href="/competitions"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-[#15294A] border border-white shadow-2xs text-[11px] sm:text-xs font-mono font-bold tracking-tight transition-all group shrink-0"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#FF874D] group-hover:rotate-45 transition-transform duration-300" />
              <span className="whitespace-nowrap">8 Arenas</span>
            </Link>

            {/* Circular Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-[#15294A] border border-white shadow-2xs transition-all duration-200 active:scale-95 focus:outline-none shrink-0"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-[#15294A]" />
              ) : (
                <Menu className="w-4 h-4 text-[#15294A]" />
              )}
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          RESPONSIVE MOBILE DRAWER
          Constrained safely within screen with auto-scroll and touch-safe targets
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto w-full max-w-md mx-auto mt-2">
          <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[#0B1B36] border border-[#FFD1B5]/50 shrink-0">
                  <Image
                    src="/images/yugantar-logo.webp"
                    alt="YUGANTAR 2026"
                    width={20}
                    height={20}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#536781] font-bold">
                  {eventDateLabel}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#FF783E]">
                TELE-ERA FORUM
              </span>
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#15294A] text-white font-bold shadow-xs'
                        : 'text-[#15294A] hover:bg-[#F5F6FA]'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className={`w-3.5 h-3.5 ${active ? 'text-[#FF874D]' : 'text-[#7E93AC]'}`} />
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0]">
              <Link
                href="/competitions"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full nexus-btn-sapphire justify-center py-2.5 px-4 text-xs font-bold gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF874D]" />
                <span>Explore 8 Competitions</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
