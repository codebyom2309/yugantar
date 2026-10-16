'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface ModernSelectOption {
  label: string;
  value: string;
}

export interface ModernSelectProps {
  id?: string;
  name?: string;
  value: string;
  options: readonly (string | ModernSelectOption)[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function ModernSelect({
  id: customId,
  name,
  value,
  options,
  onChange,
  placeholder = 'Select an option...',
  error,
  disabled = false,
  required = false,
  searchable,
  className = '',
  ariaLabel,
}: ModernSelectProps) {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Normalize options to { label, value }
  const normalizedOptions: ModernSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  // Determine if search should be enabled (auto-enabled if > 6 options)
  const isSearchable = searchable !== undefined ? searchable : normalizedOptions.length > 6;

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected option label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : '';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, isSearchable]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const chosen = filteredOptions[highlightedIndex];
            onChange(chosen.value);
            setIsOpen(false);
            setSearchQuery('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          break;
        default:
          break;
      }
    },
    [disabled, isOpen, filteredOptions, highlightedIndex, onChange]
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
        aria-label={ariaLabel || placeholder}
        aria-required={required}
        className={`w-full px-4 py-3 min-h-[48px] rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 bg-white text-[#10264A] shadow-xs cursor-pointer ${
          error
            ? 'border-2 border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'border-2 border-[#3978F6] ring-2 ring-[#3978F6]/20'
            : 'border border-[#DCE5F2] hover:border-[#3978F6]/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <span
          className={`block truncate ${
            displayText ? 'text-[#10264A] font-semibold' : 'text-[#8CA0BA] font-normal'
          }`}
        >
          {displayText || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#8CA0BA] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#3978F6]' : ''
          }`}
        />
      </button>

      {/* Hidden input for form submission compatibility */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={selectId}
          className="absolute z-50 left-0 right-0 mt-1.5 p-2 rounded-2xl bg-white border border-[#DCE5F2] shadow-xl space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150 origin-top text-xs max-h-72 flex flex-col"
          style={{ minWidth: '100%' }}
        >
          {/* Optional Search Bar */}
          {isSearchable && (
            <div className="relative px-1 pt-1 pb-1.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#8CA0BA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Type to filter..."
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#10264A] placeholder:text-[#8CA0BA] focus:outline-none focus:border-[#3978F6] focus:bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 custom-scrollbar max-h-52"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#8CA0BA]">
                No options match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#E9F2FF] text-[#3978F6] font-bold border border-[#3978F6]/20'
                        : isHighlighted
                        ? 'bg-[#F8FAFD] text-[#10264A] font-medium'
                        : 'text-[#10264A] hover:bg-[#F8FAFD]'
                    }`}
                  >
                    <span className="truncate leading-snug">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#3978F6] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
