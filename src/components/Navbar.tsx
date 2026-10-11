'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, LayoutGrid, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
              ? 'bg-white/92 backdrop-blur-2xl border border-white/90 shadow-xl shadow-[#102344]/8'
              : 'bg-white/80 backdrop-blur-xl border border-white/85 shadow-lg shadow-[#102344]/5'
          }`}
        >
          {/* Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2.5 group focus:outline-none rounded-full shrink-0"
            aria-label="YUGANTAR 2026 Homepage"
          >
            {/* Deep Midnight Blue Emblem with Gold 4-Point Star */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#102344] border border-white/20 flex items-center justify-center text-white shadow-2xs transition-transform duration-250 group-hover:scale-105 shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="#FF874D" />
                <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Wordmark and Year Badge */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-display font-extrabold text-xs sm:text-base lg:text-lg tracking-tight text-[#15294A] group-hover:text-[#FF874D] transition-colors whitespace-nowrap">
                YUGANTAR
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FFF0E3] text-[#FF874D] border border-[#FFD1B5] shrink-0">
                2026
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
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/90 hover:bg-white text-[#15294A] border border-white/80 shadow-2xs text-[11px] sm:text-xs font-mono font-bold tracking-tight transition-all group shrink-0"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#FF874D] group-hover:rotate-45 transition-transform duration-300" />
              <span className="whitespace-nowrap">8 Arenas</span>
            </Link>

            {/* Circular Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[#15294A] border border-white/80 shadow-2xs transition-all duration-200 active:scale-95 focus:outline-none shrink-0"
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
                <span className="w-2 h-2 rounded-full bg-[#FF874D]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#536781] font-bold">
                  22 OCTOBER 2026 · PCE NAGPUR
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#FF874D]">
                DEPT OF ETC
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
