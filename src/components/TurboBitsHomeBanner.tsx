'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, ArrowRight, Sparkles } from 'lucide-react';

export default function TurboBitsHomeBanner() {
  return (
    <section className="py-10 sm:py-12 bg-gradient-to-b from-[#F8FAFD] via-[#F0F6FF]/60 to-[#F8FAFD] border-b border-[#DCE5F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-white border border-[#DCE5F2] p-6 sm:p-8 lg:p-9 shadow-xs hover:border-[#3978F6]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden group">
          {/* Subtle background tech glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#3978F6]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F2FF] border border-[#CDE1FF] text-[11px] font-mono font-bold text-[#3978F6] uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Made by TurboBits</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#10264A] tracking-tight">
              Curious about the team behind this website? Meet TurboBits.
            </h3>

            <p className="text-xs sm:text-sm text-[#536781] leading-relaxed font-normal">
              Built by student engineers from the Department of Electronics &amp; Telecommunication Engineering at PCE Nagpur.
            </p>
          </div>

          <div className="relative z-10 shrink-0 w-full sm:w-auto">
            <Link
              href="/turbobits"
              className="nexus-btn-primary w-full sm:w-auto px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Meet the Team</span>
              <ArrowRight className="w-4 h-4 text-[#FF783E] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
