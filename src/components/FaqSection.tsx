'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FAQS } from '@/data/events';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  // Preview first 4 on homepage
  const previewFaqs = FAQS.slice(0, 4);

  return (
    <section id="faq" className="py-24 sm:py-32 bg-[#F8FAFD] relative overflow-hidden border-b border-[#DCE5F2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#DCE5F2] text-xs font-mono font-bold text-[#4B91E8] uppercase tracking-wider mb-4 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5 text-[#4B91E8]" />
              <span>FESTIVAL CLARIFICATIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#172B49] tracking-tight mb-4">
              Frequently Asked Questions.
            </h2>
            <p className="text-sm sm:text-base text-[#60728A] leading-relaxed">
              Essential guidelines regarding event participation, campus logistics, and competition formats for YUGANTAR 2026.
            </p>
          </div>

          <Link
            href="/faq"
            className="nexus-btn-primary px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-sm inline-flex shrink-0"
          >
            <span>View All FAQs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {previewFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="nexus-card overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B91E8]"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-display font-bold text-[#172B49] flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EDF5FC] text-[#4B91E8] border border-[#DCE5F2]">
                      0{idx + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#4B91E8] text-white shadow-xs' : 'bg-[#F8FAFD] text-[#60728A] border border-[#DCE5F2]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-[#60728A] leading-relaxed border-t border-[#E2E8F0] animate-in fade-in duration-200 font-normal">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Note */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-white border border-[#DCE5F2] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="text-left">
            <h4 className="text-sm font-display font-bold text-[#172B49]">
              Need more official clarifications?
            </h4>
            <p className="text-xs text-[#60728A]">
              Browse the dedicated FAQ page for category filtering and search.
            </p>
          </div>
          <Link
            href="/faq"
            className="nexus-btn-secondary px-5 py-2.5 text-xs font-mono font-bold shrink-0 shadow-xs gap-1.5"
          >
            <span>Complete FAQ Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
