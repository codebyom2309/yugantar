'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FAQS as STATIC_FAQS, FESTIVAL_INFO } from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import {
  HelpCircle,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';

export default function FaqClient() {
  const [faqsList, setFaqsList] = useState(STATIC_FAQS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [festivalDate, setFestivalDate] = useState<string>(FESTIVAL_INFO.date);
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const toggleAccordion = (idx: number) => {
    setOpenIndexes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    fetch('/api/faqs')
      .then((r) => r.json())
      .then((data) => {
        if (data.faqs && data.faqs.length > 0) {
          setFaqsList(data.faqs);
        }
      })
      .catch((err) => console.warn('Failed to load live FAQs, using static fallback:', err));

    fetchClientFestivalData()
      .then((d) => {
        if (d.festival?.event_date) {
          setFestivalDate(d.festival.event_date);
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    'All',
    'General & Venue',
    'Registration Architecture',
    'Eligibility',
    'Participation',
    'Equipment',
    'Certification & Prizes',
  ];

  const filteredFaqs = faqsList.filter((faq) => {
    const matchesCategory =
      activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header with Atmospheric Background */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-10 sm:pb-14 bg-gradient-to-b from-[#EDF5FC] via-[#F4F9FD] to-[#F8FAFD] border-b border-[#DCE5F2] overflow-hidden">
        {/* Supplied Atmospheric Clouds Asset */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-70 sm:opacity-80">
          <Image
            src="/images/nexus-city/atmospheric-clouds.webp"
            alt="YUGANTAR 2026 Atmospheric Sky"
            fill
            priority
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#EDF5FC]/40 via-[#F4F9FD]/65 to-[#F8FAFD]" />
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#3978F6]/12 via-[#E9F2FF]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-3 sm:mb-4">
            <Link href="/" className="hover:text-[#10264A] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3978F6] font-bold">FAQ &amp; Clarifications</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#DCE5F2] text-xs font-mono font-bold text-[#3978F6] uppercase tracking-wider mb-3 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>OFFICIAL CLARIFICATIONS &amp; GUIDANCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#10264A] mb-3 sm:mb-4 text-balance">
              Frequently Asked <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                Questions &amp; Rules.
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#536781] leading-relaxed mb-4 font-normal">
              Find verified answers regarding festival venue logistics, collegiate eligibility, equipment rules, and the upcoming registration architecture.
            </p>
          </div>

        </div>
      </section>

      {/* Filter & Search Controls (Natural Flow, NOT Sticky) */}
      <section className="py-5 sm:py-6 bg-[#F8FAFC] border-b border-[#DCE5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#10264A] text-white shadow-xs'
                      : 'bg-[#F8FAFD] text-[#536781] border border-[#DCE5F2] hover:bg-[#E9F2FF] hover:text-[#10264A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[#8CA0BA] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2] text-xs text-[#172B49] placeholder:text-[#8CA0BA] focus:outline-none focus:border-[#4B91E8]"
              />
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Content Area */}
      <main className="py-16 sm:py-20 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Important Notice Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF4EA] border border-[#F0E5D8] flex items-start gap-3.5 text-xs text-[#9A4B1A]">
            <AlertCircle className="w-5 h-5 text-[#E0874E] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-[#172B49]">
                Official Rulebooks & Timetables Notice
              </span>
              <p className="leading-relaxed text-[#60728A]">
                Specific round timings, room assignments, and Google Form links will be officially published prior to the event date ({festivalDate}). Unknown or unfinalized criteria are deliberately labeled as pending.
              </p>
            </div>
          </div>

          {/* FAQ Items List with Accessible Accordion */}
          <div className="space-y-3.5">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const isOpen = Boolean(openIndexes[index]);
                return (
                  <div
                    key={index}
                    suppressHydrationWarning
                    className="yugantar-card-interactive glow-neutral bg-white rounded-2xl border border-[#DCE5F2] overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(index)}
                      className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 focus:outline-none cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#E9F2FF] text-[#3978F6] border border-[#D2E4FF]">
                            {faq.category || 'General'}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-display font-bold text-[#10264A]">
                          {faq.question}
                        </h3>
                      </div>
                      <div className={`p-2 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-[#E9F2FF] text-[#3978F6]' : 'text-[#7E93AC]'}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#536781] leading-relaxed border-t border-[#F1F5F9] animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#DCE5F2]">
                <HelpCircle className="w-8 h-8 text-[#8CA0BA] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#172B49]">
                  No matching questions found
                </p>
                <p className="text-xs text-[#60728A] mt-1">
                  Try adjusting your search terms or filter category.
                </p>
              </div>
            )}
          </div>

          {/* Quick Help Card */}
          <div
            suppressHydrationWarning
            className="yugantar-card-interactive glow-blue rounded-2xl bg-gradient-to-r from-[#EDF5FC] via-[#F4F9FD] to-[#FFF4EA]/50 border border-[#DCE5F2] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all"
          >
            <div>
              <h4 className="text-base font-display font-bold text-[#172B49] mb-1">
                Have questions about specific competitions?
              </h4>
              <p className="text-xs text-[#60728A]">
                Each competition page includes track-specific expectations and FAQs.
              </p>
            </div>

            <Link
              href="/competitions"
              className="nexus-btn-primary px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase shrink-0 gap-1.5 shadow-sm"
            >
              <span>Explore 8 Arenas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
