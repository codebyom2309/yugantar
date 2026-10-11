'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUp, MapPin, Calendar, Sparkles } from 'lucide-react';
import { FESTIVAL_INFO, ORGANIZERS } from '@/data/events';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F5F6FA] text-[#15294A] pt-16 pb-12 border-t border-[#DCE5F2] relative overflow-hidden">
      
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-gradient-to-br from-[#FFF0E3] to-[#B8D9F5]/30 rounded-full blur-3xl pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#DCE5F2]">
          
          {/* Brand & Institution Info (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#102344] flex items-center justify-center text-white shadow-xs">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="#FF874D" />
                  <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold tracking-tight text-xl text-[#15294A]">
                  YUGANTAR 2026
                </span>
                <span className="text-[11px] font-mono font-bold text-[#FF874D] uppercase tracking-wider">
                  NEXUS CITY · ENGINEERING FESTIVAL
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#536781] leading-relaxed mb-6 max-w-sm font-normal">
              The premier intercollegiate technical festival organized by the Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur.
            </p>

            <div className="space-y-2 text-xs text-[#536781]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                <span>{FESTIVAL_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF874D] shrink-0" />
                <span className="font-mono font-semibold">22 October 2026 · PCE Concourse</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation (col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#15294A] mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#536781] font-medium">
              <li>
                <Link href="/" className="hover:text-[#FF874D] transition-colors">
                  Home (Festival Gateway)
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-[#FF874D] transition-colors">
                  All 8 Competitions Overview
                </Link>
              </li>
              <li>
                <Link href="/districts" className="hover:text-[#FF874D] transition-colors">
                  Interactive Districts Map
                </Link>
              </li>
              <li>
                <Link href="/journey" className="hover:text-[#FF874D] transition-colors">
                  Festival Journey Roadmap
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#FF874D] transition-colors">
                  About & Organizing Forums
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#FF874D] transition-colors">
                  FAQ & Clarifications
                </Link>
              </li>
            </ul>
          </div>

          {/* Organizing Bodies (col-span-4) */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#15294A] mb-4">
              Organizing Bodies
            </h4>
            <div className="space-y-2.5">
              {ORGANIZERS.map((org) => (
                <div key={org.name} className="p-3 rounded-2xl bg-white border border-[#DCE5F2] shadow-2xs hover:border-[#FF874D]/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-display font-bold text-[#15294A]">
                      {org.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDF5FC] text-[#3B82F6] border border-[#DCE5F2]">
                      {org.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#536781] font-normal leading-relaxed">
                    {org.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#536781] text-center sm:text-left font-normal">
            © 2026 YUGANTAR · Department of Electronics & Telecommunication Engineering, Priyadarshini College of Engineering, Nagpur.
          </p>

          <button
            onClick={scrollToTop}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFF0E3] text-[#15294A] border border-[#DCE5F2] text-xs font-mono font-bold transition-all shadow-2xs"
            aria-label="Scroll to top of page"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#FF874D]" />
          </button>
        </div>

      </div>
    </footer>
  );
}
