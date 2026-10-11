'use client';

import React from 'react';
import { Sparkles, Layers, Cpu, Zap, Lightbulb, Briefcase, Presentation, Gamepad2, Mic, Trophy } from 'lucide-react';

const TRACK_TAGS = [
  { name: 'Hardware Prototypes', icon: Cpu, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300' },
  { name: 'Circuit Speed Run', icon: Zap, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300' },
  { name: 'Ideathon & Venture', icon: Lightbulb, color: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300' },
  { name: 'Mock Placement Drive', icon: Briefcase, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300' },
  { name: 'Research Symposia', icon: Presentation, color: 'bg-sky-50 text-sky-700 border-sky-200 hover:sky-300' },
  { name: 'Esports Arena (BGMI/FF)', icon: Gamepad2, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300' },
  { name: 'Acoustic Open Mic', icon: Mic, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300' },
  { name: '₹50,000+ Prize Pool', icon: Trophy, color: 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400 font-bold' },
];

export default function InnovationStream() {
  const repeated = [...TRACK_TAGS, ...TRACK_TAGS, ...TRACK_TAGS];

  return (
    <div className="w-full bg-[#FAFCFF] border-b border-[#CDE0FF]/60 py-3 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono font-semibold tracking-wider text-[#243B64] uppercase">
          <span className="px-2 py-0.5 rounded bg-[#243B64] text-white text-[10px]">
            CONVEYOR TRACK
          </span>
          <span>EXPLORE THE 8 COMPETITION DISTRICTS</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#4B638A] font-medium">
          <Sparkles className="w-3 h-3 text-[#F4A477]" />
          <span>Interactive Festival Journey</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden mask-fade">
        <div className="animate-marquee flex items-center gap-3 py-1 cursor-grab">
          {repeated.map((item, idx) => {
            const Icon = item.icon;
            return (
              <a
                key={`${item.name}-${idx}`}
                href="#competitions"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium shadow-2xs transition-all duration-200 hover:scale-105 hover:shadow-xs whitespace-nowrap ${item.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
                <span className="text-[10px] opacity-60">→</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
