'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CityIntroduction from '@/components/CityIntroduction';
import CompetitionsGrid from '@/components/CompetitionsGrid';
import InteractiveCityMap from '@/components/InteractiveCityMap';
import FestivalJourney from '@/components/FestivalJourney';
import OrganizersSection from '@/components/OrganizersSection';
import FaqSection from '@/components/FaqSection';
import ClosingCta from '@/components/ClosingCta';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFD] flex flex-col overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero: Crisp, Unfogged NEXUS CITY Artwork + Prominent Registration Placeholder Card */}
      <Hero />

      {/* Section A: Festival & Theme Introduction */}
      <CityIntroduction />

      {/* Section B: Preview of the Eight Competitions (direct links to detail pages) */}
      <CompetitionsGrid />

      {/* Section C: Preview of the Interactive City / District Map (direct link to /districts) */}
      <InteractiveCityMap />

      {/* Section D: Concise Festival Journey (direct link to /journey) */}
      <FestivalJourney />

      {/* Section E: Organizing Bodies (TELE-ERA, IETE, III Cell) */}
      <OrganizersSection />

      {/* Section F: Frequently Asked Questions (direct link to /faq) */}
      <FaqSection />

      {/* Closing Call to Action */}
      <ClosingCta />

      {/* Footer */}
      <Footer />
    </main>
  );
}
