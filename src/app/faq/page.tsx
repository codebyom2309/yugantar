'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FAQS as STATIC_FAQS, FESTIVAL_INFO } from '@/data/events';
import { fetchClientFestivalData } from '@/lib/client-festival-data';
import {
  HelpCircle,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';

export default function FaqPage() {
  const [faqsList, setFaqsList] = useState(STATIC_FAQS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [festivalDate, setFestivalDate] = useState<string>(FESTIVAL_INFO.date);

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

      {/* Hero Header */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-16 bg-gradient-to-b from-[#EDF5FC] via-[#F4F9FD] to-[#F8FAFD] border-b border-[#DCE5F2] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#3B82F6]/10 via-[#9187DE]/8 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-5">
            <Link href="/" className="hover:text-[#15294A] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3B82F6] font-bold">FAQ & Clarifications</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#DCE5F2] text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider mb-4 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>OFFICIAL CLARIFICATIONS & GUIDANCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#15294A] mb-4 sm:mb-6 text-balance">
              Frequently Asked <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                Questions & Rules.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed mb-6 font-normal">
              Find verified answers regarding festival venue logistics, collegiate eligibility, equipment rules, and the upcoming registration architecture.
            </p>
          </div>

        </div>
      </section>

      {/* Filter & Search Controls (Natural Flow, NOT Sticky) */}
      <section className="py-5 sm:py-6 bg-[#F5F6FA] border-b border-[#DCE5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#4B91E8] text-white shadow-xs'
                      : 'bg-[#F8FAFD] text-[#60728A] border border-[#DCE5F2]/80 hover:bg-[#EDF5FC] hover:text-[#172B49]'
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

          {/* FAQ Items List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="nexus-card p-6 sm:p-7 hover:border-[#4B91E8]/40 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EDF5FC] text-[#4B91E8] border border-[#DCE5F2]">
                      {faq.category || 'General'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-display font-bold text-[#172B49] mb-3">
                    {faq.question}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed font-normal">
                    {faq.answer}
                  </p>
                </div>
              ))
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
          <div className="rounded-2xl bg-gradient-to-r from-[#EDF5FC] via-[#F4F9FD] to-[#FFF4EA]/50 border border-[#DCE5F2] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
