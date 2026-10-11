'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

interface AdminDatePickerProps {
  value: string;
  onChange: (displayDate: string, isoDate?: string) => void;
  label?: string;
  placeholder?: string;
  includeTime?: boolean;
  disabled?: boolean;
  festivalDate?: string;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function AdminDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date...',
  includeTime = false,
  disabled = false,
  festivalDate,
  className = '',
}: AdminDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Calendar view state (defaults to October 2026 or current selection)
  const [viewYear, setViewYear] = useState<number>(() => {
    return parsedDate ? parsedDate.getFullYear() : 2026;
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parsedDate ? parsedDate.getMonth() : 9; // October (0-indexed)
  });

  // Time state (if includeTime is enabled)
  const [selectedHours, setSelectedHours] = useState<number>(() => {
    return parsedDate ? (parsedDate.getHours() % 12 || 12) : 9;
  });
  const [selectedMinutes, setSelectedMinutes] = useState<number>(() => {
    return parsedDate ? parsedDate.getMinutes() : 0;
  });
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(() => {
    return parsedDate ? (parsedDate.getHours() >= 12 ? 'PM' : 'AM') : 'AM';
  });

  // Close when clicking outside
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

  // Sync view state when value changes externally
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
      setSelectedHours(parsedDate.getHours() % 12 || 12);
      setSelectedMinutes(parsedDate.getMinutes());
      setSelectedAmPm(parsedDate.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [parsedDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; monthOffset: number; date: Date }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({
        day: d,
        monthOffset: -1,
        date: new Date(viewYear, viewMonth - 1, d),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        monthOffset: 0,
        date: new Date(viewYear, viewMonth, i),
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        monthOffset: 1,
        date: new Date(viewYear, viewMonth + 1, i),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const commitDate = (dateObj: Date) => {
    let finalHours = selectedHours;
    if (selectedAmPm === 'PM' && finalHours < 12) finalHours += 12;
    if (selectedAmPm === 'AM' && finalHours === 12) finalHours = 0;

    const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), finalHours, selectedMinutes);

    // Format display string e.g. "22 October 2026"
    const day = target.getDate();
    const month = MONTH_NAMES[target.getMonth()];
    const year = target.getFullYear();

    let displayStr = `${day} ${month} ${year}`;
    if (includeTime) {
      const padMin = String(selectedMinutes).padStart(2, '0');
      const padHour = String(selectedHours).padStart(2, '0');
      displayStr += ` at ${padHour}:${padMin} ${selectedAmPm}`;
    }

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(finalHours).padStart(2, '0');
    const min = String(selectedMinutes).padStart(2, '0');
    const isoStr = includeTime
      ? `${yyyy}-${mm}-${dd}T${hh}:${min}:00+05:30`
      : `${yyyy}-${mm}-${dd}T09:00:00+05:30`;

    onChange(displayStr, isoStr);
    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handleQuickPreset = (preset: 'fest' | 'today' | 'tomorrow' | 'nextWeek') => {
    let d = new Date();
    if (preset === 'fest') {
      if (festivalDate) {
        const parsed = new Date(festivalDate);
        if (!isNaN(parsed.getTime())) {
          d = parsed;
        } else {
          d = new Date(2026, 9, 19);
        }
      } else {
        d = new Date(2026, 9, 19); // Default festival date
      }
    } else if (preset === 'today') {
      d = new Date();
    } else if (preset === 'tomorrow') {
      d = new Date();
      d.setDate(d.getDate() + 1);
    } else if (preset === 'nextWeek') {
      d = new Date();
      d.setDate(d.getDate() + 7);
    }
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    commitDate(d);
  };

  const isSelected = (date: Date) => {
    if (!parsedDate) return false;
    return (
      date.getFullYear() === parsedDate.getFullYear() &&
      date.getMonth() === parsedDate.getMonth() &&
      date.getDate() === parsedDate.getDate()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 block mb-1 font-semibold">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`admin-glass-input w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer select-none transition-all group ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/40'
        } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500!' : ''}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-blue-500 shrink-0 group-hover:scale-105 transition-transform" />
          <span className={`truncate font-medium ${value ? 'text-slate-900 dark:text-white font-mono' : 'text-slate-400 dark:text-zinc-500'}`}>
            {value || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white transition"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] text-blue-500 font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
            Pick
          </span>
        </div>
      </div>

      {/* Floating Glassmorphic Calendar Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-80 max-w-[calc(100vw-32px)] admin-glass-panel rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150"
          style={{ backdropFilter: 'blur(28px) saturate(200%)' }}
        >
          {/* Quick Presets Bar */}
          <div className="flex items-center gap-1.5 pb-3 border-b border-black/5 dark:border-white/10 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickPreset('fest')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5" /> {festivalDate ? festivalDate.split(' ').slice(0, 2).join(' ') : '19 Oct'} (Fest)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('today')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium admin-glass-card hover:border-blue-500/30 transition shrink-0 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('tomorrow')}
              className="px-2 py-1 rounded-lg text-[10px] font-medium admin-glass-card hover:border-blue-500/30 transition shrink-0 cursor-pointer"
            >
              Tomorrow
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between py-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="admin-glass-input px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="admin-glass-input px-2 py-1 rounded-lg text-xs font-semibold font-mono cursor-pointer"
              >
                {[2025, 2026, 2027, 2028, 2029].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <span
                key={d}
                className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase py-1"
              >
                {d}
              </span>
            ))}
          </div>

          {/* 6x7 Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((item, idx) => {
              const active = isSelected(item.date);
              const today = isToday(item.date);
              const isOtherMonth = item.monthOffset !== 0;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => commitDate(item.date)}
                  className={`h-8 w-8 mx-auto rounded-xl text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer relative ${
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
                      : isOtherMonth
                      ? 'text-slate-300 dark:text-zinc-600 hover:bg-black/5 dark:hover:bg-white/5'
                      : today
                      ? 'text-blue-600 dark:text-blue-400 font-bold border border-blue-500/40 hover:bg-blue-500/10'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {item.day}
                  {today && !active && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section (if enabled) */}
          {includeTime && (
            <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Time:</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <select
                  value={selectedHours}
                  onChange={(e) => setSelectedHours(parseInt(e.target.value, 10))}
                  className="admin-glass-input px-2 py-1 rounded-lg text-xs"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={selectedMinutes}
                  onChange={(e) => setSelectedMinutes(parseInt(e.target.value, 10))}
                  className="admin-glass-input px-2 py-1 rounded-lg text-xs"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-black/10 dark:border-white/10 overflow-hidden ml-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAmPm('AM')}
                    className={`px-2 py-1 text-[10px] font-bold ${
                      selectedAmPm === 'AM'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAmPm('PM')}
                    className={`px-2 py-1 text-[10px] font-bold ${
                      selectedAmPm === 'PM'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate max-w-[170px]">
              {value || 'No date selected'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Check className="w-3 h-3" /> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
