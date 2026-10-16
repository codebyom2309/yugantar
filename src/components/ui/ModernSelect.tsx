'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
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

interface DropdownCoords {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpwards: boolean;
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
  const listboxId = `${selectId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  const [coords, setCoords] = useState<DropdownCoords>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
    openUpwards: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Calculate anchored viewport coordinates for the portaled dropdown
  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // Use visualViewport if supported for high precision on mobile (virtual keyboard detection)
    const viewportHeight =
      typeof window !== 'undefined' && window.visualViewport
        ? window.visualViewport.height
        : typeof window !== 'undefined'
        ? window.innerHeight
        : 800;
    const viewportWidth =
      typeof window !== 'undefined' && window.visualViewport
        ? window.visualViewport.width
        : typeof window !== 'undefined'
        ? window.innerWidth
        : 375;

    const viewportTop =
      typeof window !== 'undefined' && window.visualViewport
        ? window.visualViewport.offsetTop
        : 0;
    const viewportLeft =
      typeof window !== 'undefined' && window.visualViewport
        ? window.visualViewport.offsetLeft
        : 0;

    const padding = 8;
    const width = Math.min(rect.width, viewportWidth - padding * 2);
    const left = Math.max(
      viewportLeft + padding,
      Math.min(rect.left, viewportLeft + viewportWidth - width - padding)
    );

    const spaceBelow = viewportTop + viewportHeight - rect.bottom - padding;
    const spaceAbove = rect.top - viewportTop - padding;

    // Standard dropdown max height
    const preferredHeight = isSearchable ? 300 : 250;

    // Flip upward if below space is restricted (< 220px) and above space is larger
    const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;

    let top: number;
    let maxHeight: number;

    if (openUpwards) {
      maxHeight = Math.min(preferredHeight, Math.max(120, spaceAbove - 6));
      top = rect.top - maxHeight - 6;
    } else {
      maxHeight = Math.min(preferredHeight, Math.max(120, spaceBelow - 6));
      top = rect.bottom + 6;
    }

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(width),
      maxHeight: Math.round(maxHeight),
      openUpwards,
    });
  }, [isSearchable]);

  // Recalculate position when dropdown opens or viewport changes
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleScrollOrResize, { passive: true });
      window.visualViewport.addEventListener('scroll', handleScrollOrResize, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleScrollOrResize);
        window.visualViewport.removeEventListener('scroll', handleScrollOrResize);
      }
    };
  }, [isOpen, updateCoords]);

  // Close when clicking outside (checks both the trigger and portaled menu)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  // Automatically scroll highlighted option into view for keyboard navigation
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle keyboard navigation on trigger button
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          updateCoords();
          setIsOpen(true);
          const initialIdx = filteredOptions.findIndex((opt) => opt.value === value);
          setHighlightedIndex(initialIdx >= 0 ? initialIdx : 0);
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
            setHighlightedIndex(-1);
            triggerRef.current?.focus();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
          triggerRef.current?.focus();
          break;
        case 'Tab':
          // Standard ARIA: Tab closes listbox and moves focus to next form element
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
          break;
        default:
          break;
      }
    },
    [disabled, isOpen, filteredOptions, highlightedIndex, onChange, value, isSearchable, updateCoords]
  );

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
      const initialIdx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(initialIdx >= 0 ? initialIdx : 0);
    } else {
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  // Dropdown Menu Panel (Portaled to document.body to guarantee stacking above all cards)
  const dropdownPanel = (
    <div
      ref={dropdownRef}
      role="listbox"
      id={listboxId}
      aria-labelledby={selectId}
      className={`fixed z-[9999] p-2 rounded-2xl bg-white border border-[#DCE5F2] shadow-2xl space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150 text-xs flex flex-col ${
        coords.openUpwards ? 'origin-bottom' : 'origin-top'
      }`}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        maxHeight: `${coords.maxHeight}px`,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Optional Search Bar — NEVER auto-focused; keyboard only appears if participant explicitly taps it */}
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
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#10264A] placeholder:text-[#8CA0BA] focus:outline-none focus:border-[#3978F6] focus:bg-white font-medium"
            onClick={(e) => e.stopPropagation()}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setHighlightedIndex(-1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Options List — with overscroll-contain for smooth touch scrolling on mobile */}
      <div
        ref={listRef}
        className="overflow-y-auto space-y-0.5 pr-0.5 flex-1 custom-scrollbar overscroll-contain"
        style={{
          maxHeight: isSearchable
            ? `${Math.max(80, coords.maxHeight - 58)}px`
            : `${Math.max(80, coords.maxHeight - 16)}px`,
        }}
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
                id={`${selectId}-option-${idx}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer min-h-[40px] ${
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
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
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

      {/* Hidden input for standard HTML form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Render via Portal to document.body, escaping all container stacking contexts */}
      {isOpen && mounted && typeof document !== 'undefined'
        ? createPortal(dropdownPanel, document.body)
        : null}
    </div>
  );
}
