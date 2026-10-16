import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CompetitionNotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col text-[#172B49]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-mono font-bold text-[#E07A43] uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[#FFF4EA] border border-[#E07A43]/20 mb-4">
          404 · ARENA NOT FOUND
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight mb-4 text-[#172B49]">
          Competition Not Found
        </h1>
        <p className="text-sm sm:text-base text-[#60728A] max-w-md mx-auto mb-8">
          The requested competition arena doesn&apos;t exist or may have been unlisted. Explore all active competitions across the NEXUS campus.
        </p>
        <Link
          href="/competitions"
          className="nexus-btn-primary px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider"
        >
          View All Competitions →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
