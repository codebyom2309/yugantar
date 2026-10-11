import React, { Suspense } from 'react';
import { connection } from 'next/server';
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
import { getFestivalSettings } from '@/lib/competitions';

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col animate-pulse">
      <Navbar />
      <div className="pt-32 pb-16 max-w-7xl mx-auto px-4 w-full flex-1">
        <div className="h-12 w-64 bg-[#E2E8F0] rounded mb-6" />
        <div className="h-64 bg-white border border-[#DCE5F2] rounded-3xl" />
      </div>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  const festival = await getFestivalSettings();

  return (
    <main className="min-h-screen bg-[#F8FAFD] flex flex-col overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero: Crisp, Unfogged NEXUS CITY Artwork + Dynamic Authoritative Festival Settings */}
      <Hero festival={festival} />

      {/* Section A: Festival & Theme Introduction */}
      <CityIntroduction festival={festival} />

      {/* Section B: Preview of the Eight Competitions (direct links to detail pages) */}
      <CompetitionsGrid />

      {/* Section C: Preview of the Interactive City / District Map (direct link to /districts) */}
      <InteractiveCityMap />

      {/* Section D: Concise Festival Journey (direct link to /journey) */}
      <FestivalJourney festival={festival} />

      {/* Section E: Organizing Bodies (TELE-ERA, Faculty Mentorship, IIC Cell) */}
      <OrganizersSection />

      {/* Section F: Frequently Asked Questions (direct link to /faq) */}
      <FaqSection />

      {/* Closing Call to Action */}
      <ClosingCta festival={festival} />

      {/* Footer */}
      <Footer festival={festival} />
    </main>
  );
}
