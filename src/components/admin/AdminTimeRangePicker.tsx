'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, X, Sparkles, ChevronDown } from 'lucide-react';

interface AdminTimeRangePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const PRESET_WINDOWS = [
  { label: '09:00 AM - 10:00 AM', desc: 'Reporting & Kit Handout' },
  { label: '10:00 AM - 01:00 PM', desc: 'Morning Evaluation Round' },
  { label: '01:00 PM - 02:00 PM', desc: 'Lunch & Break' },
  { label: '02:00 PM - 04:30 PM', desc: 'Grand Finale & Jury Pitch' },
  { label: '04:30 PM - 05:30 PM', desc: 'Valedictory & Awards' },
];

export default function AdminTimeRangePicker({
  value,
  onChange,
  label,
  placeholder = 'e.g. 09:00 AM - 10:00 AM',
  disabled = false,
  className = '',
}: AdminTimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value if possible
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');

  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('AM');

  // Sync internal state if value matches standard format
  useEffect(() => {
    if (!value) return;
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      setStartHour(match[1].padStart(2, '0'));
      setStartMin(match[2]);
      setStartPeriod(match[3].toUpperCase() as 'AM' | 'PM');
      setEndHour(match[4].padStart(2, '0'));
      setEndMin(match[5]);
      setEndPeriod(match[6].toUpperCase() as 'AM' | 'PM');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const applyCustomTime = () => {
    const formatted = `${startHour}:${startMin} ${startPeriod} - ${endHour}:${endMin} ${endPeriod}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectPreset = (presetLabel: string) => {
    onChange(presetLabel);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-mono mb-1 font-semibold">
          {label}
        </label>
      )}

      {/* Trigger pill */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`admin-glass-input w-full p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer select-none transition-all group ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/40'
        } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500!' : ''}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-105 transition-transform" />
          <span
            className={`truncate font-mono text-[11px] font-semibold ${
              value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500 font-normal'
            }`}
          >
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white transition"
              title="Clear time"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
        </div>
      </div>

      {/* Floating Glassmorphic Time Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-80 max-w-[calc(100vw-32px)] admin-glass-panel rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150"
          style={{ backdropFilter: 'blur(28px) saturate(200%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10 mb-3">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Program Time Window
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono uppercase block font-semibold">
              Standard Festival Rounds:
            </span>
            <div className="grid grid-cols-1 gap-1">
              {PRESET_WINDOWS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(p.label)}
                  className={`text-left px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                    value === p.label
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'admin-glass-card hover:border-blue-500/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="font-mono text-[11px] font-semibold">{p.label}</span>
                  <span className={`text-[10px] ${value === p.label ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Time Selector */}
          <div className="p-3 rounded-xl admin-glass-card space-y-3">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono uppercase block font-semibold">
              Or Customize Interval:
            </span>

            {/* Start Time */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">Start:</span>
              <div className="flex items-center gap-1 font-mono">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="admin-glass-input px-2 py-1 rounded-lg text-xs font-semibold"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={startMin}
                  onChange={(e) => setStartMin(e.target.value)}
                  className="admin-glass-input px-2 py-1 rounded-lg text-xs font-semibold"
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden ml-1">
                  {(['AM', 'PM'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setStartPeriod(period)}
                      className={`px-2 py-1 text-[10px] font-bold ${
                        startPeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* End Time */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">End:</span>
              <div className="flex items-center gap-1 font-mono">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="admin-glass-input px-2 py-1 rounded-lg text-xs font-semibold"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={endMin}
                  onChange={(e) => setEndMin(e.target.value)}
                  className="admin-glass-input px-2 py-1 rounded-lg text-xs font-semibold"
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden ml-1">
                  {(['AM', 'PM'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setEndPeriod(period)}
                      className={`px-2 py-1 text-[10px] font-bold ${
                        endPeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
              {startHour}:{startMin} {startPeriod} – {endHour}:{endMin} {endPeriod}
            </span>
            <button
              type="button"
              onClick={applyCustomTime}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Apply Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
