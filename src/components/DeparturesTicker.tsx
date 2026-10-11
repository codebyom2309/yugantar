'use client';

import React, { useState, useEffect } from 'react';
import { PlaneTakeoff, Clock, MapPin, Radio, Sparkles } from 'lucide-react';
import { FESTIVAL_INFO } from '@/data/events';

export default function DeparturesTicker() {
  const [festival, setFestival] = useState(FESTIVAL_INFO);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    fetch('/api/competitions')
      .then((r) => r.json())
      .then((d) => {
        if (d.festival) setFestival(d.festival);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const targetDate = new Date(festival.isoDate).getTime();

    const updateClocks = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }

      // Nagpur Local Time (Asia/Kolkata)
      const nowObj = new Date();
      setCurrentTimeStr(
        nowObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        })
      );
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full bg-[#082750] text-[#FFF4E5] border-y border-[#E8D4B8]/30 py-3.5 px-4 sm:px-6 shadow-md overflow-hidden relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-mono">
        
        {/* Terminal Header & Route */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6">
          <div className="flex items-center gap-2 text-[#FF681F] font-semibold tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#FF681F]" />
            <span className="uppercase font-bold">TERMINAL DISPATCH</span>
          </div>

          <div className="flex items-center gap-2 bg-[#04142B] px-2.5 py-1 rounded border border-[#163665]">
            <span className="text-[#82C9F4] text-[10px]">EVENT</span>
            <span className="font-bold text-[#FFF4E5]">YG-26</span>
          </div>

          <div className="flex items-center gap-2 text-[#FFF4E5]">
            <MapPin className="w-3.5 h-3.5 text-[#FF681F]" />
            <span>NAGPUR (PCE)</span>
            <span className="text-[#82C9F4]">→</span>
            <span className="font-bold text-[#FF681F]">ENGINEERING NEXT ERA</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#04142B] px-2.5 py-1 rounded border border-[#163665]">
            <span className="text-[#82C9F4] text-[10px]">DATE</span>
            <span className="font-semibold text-[#FFF4E5]">{festival.date ? festival.date.toUpperCase() : '19 OCT 2026'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[#82C9F4]">
            <Sparkles className="w-3 h-3 text-[#FF681F]" />
            <span className="text-[11px] font-semibold">8 CONFIRMED COMPETITIONS</span>
          </div>
        </div>

        {/* Countdown & Local Time */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#82C9F4]">
            <PlaneTakeoff className="w-3.5 h-3.5 text-[#FF681F]" />
            <span>COUNTDOWN:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-center">
              <span className="ticker-cell px-2 py-0.5 font-bold text-sm tracking-widest text-[#FFF4E5]">
                {timeLeft.days}
              </span>
              <span className="text-[9px] text-[#82C9F4] mt-0.5 font-medium">DAYS</span>
            </div>
            <span className="text-[#FF681F] font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="ticker-cell px-2 py-0.5 font-bold text-sm tracking-widest text-[#FFF4E5]">
                {pad(timeLeft.hours)}
              </span>
              <span className="text-[9px] text-[#82C9F4] mt-0.5 font-medium">HRS</span>
            </div>
            <span className="text-[#FF681F] font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="ticker-cell px-2 py-0.5 font-bold text-sm tracking-widest text-[#FFF4E5]">
                {pad(timeLeft.minutes)}
              </span>
              <span className="text-[9px] text-[#82C9F4] mt-0.5 font-medium">MIN</span>
            </div>
            <span className="text-[#FF681F] font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="ticker-cell px-2 py-0.5 font-bold text-sm tracking-widest text-[#FF681F]">
                {pad(timeLeft.seconds)}
              </span>
              <span className="text-[9px] text-[#82C9F4] mt-0.5 font-medium">SEC</span>
            </div>
          </div>

          {currentTimeStr && (
            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-[#163665] text-[#82C9F4] text-[11px]">
              <Clock className="w-3 h-3 text-[#FF681F]" />
              <span>NAGPUR: {currentTimeStr}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
