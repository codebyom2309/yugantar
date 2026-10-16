import React, { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPublicCompetitionBySlug, getFestivalSettings } from '@/lib/competitions';
import { connection } from 'next/server';
import {
  ChevronRight,
  Calendar,
  MapPin,
  ArrowLeft,
  FileText,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import RegistrationFormWrapper from './RegistrationFormWrapper';
import { getAllCompetitionSlugs, getCompetitionGlow } from '@/data/events';
import { getRegistrationFormBySlug } from '@/data/registrationForms';

import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  return {
    title: 'Competition Registration',
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `/competitions/${slug}`,
    },
  };
}

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function RegistrationSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col animate-pulse">
      <div className="h-16 w-full border-b border-[#DCE5F2] bg-white/70" />
      <div className="pt-24 sm:pt-28 pb-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="h-4 w-48 bg-[#E2E8F0] rounded mb-5" />
        <div className="h-6 w-32 bg-[#E2E8F0] rounded-full mb-3" />
        <div className="h-10 w-80 bg-[#E2E8F0] rounded-xl mb-3" />
        <div className="h-4 w-96 bg-[#E2E8F0] rounded mb-8" />
        <div className="h-96 bg-white border border-[#DCE5F2] rounded-2xl" />
      </div>
      <div className="h-24 w-full border-t border-[#DCE5F2] bg-white/70" />
    </div>
  );
}

export default async function RegistrationPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;

  const [competition, festivalSettings] = await Promise.all([
    getPublicCompetitionBySlug(slug),
    getFestivalSettings(),
  ]);
  const formConfig = getRegistrationFormBySlug(slug);

  if (!competition || !formConfig) {
    notFound();
  }

  const isRegistrationOpen = Boolean(
    competition.registrationOpen !== false && festivalSettings.registrationGlobalOpen !== false
  );
  const eventDateDisplay = competition.eventDate || festivalSettings.date || '21 October 2026';
  const compGlow = getCompetitionGlow(competition.accentColor, (competition as any).themeVibe);

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header with refined navbar clearance */}
      <section className="relative pt-24 sm:pt-28 pb-6 sm:pb-8 bg-gradient-to-b from-[#EDF5FC] via-[#F8FAFD] to-[#F8FAFD] border-b border-[#DCE5F2] overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: competition.accentColor }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-[#60728A] mb-4"
          >
            <Link href="/" className="hover:text-[#172B49] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
            <Link href="/competitions" className="hover:text-[#172B49] transition-colors">Competitions</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
            <Link href={`/competitions/${competition.slug}`} className="hover:text-[#172B49] transition-colors">
              {competition.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
            <span className="font-bold" style={{ color: competition.accentColor }}>Register</span>
          </nav>

          {/* Title & Metadata Block */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              style={{
                backgroundColor: competition.accentBg,
                color: competition.accentColor,
                borderColor: competition.accentColor,
              }}
              className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-2xs"
            >
              ARENA 0{competition.districtIndex + 1}
            </span>
            <span className="text-xs font-mono text-[#60728A] px-3 py-1 rounded-full bg-white border border-[#DCE5F2]">
              {competition.category}
            </span>
            {competition.isPaid ? (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#EDF5FC] text-[#1E5FA8] border border-[#B8D5F8]">
                ENTRY FEE: {competition.registrationFee?.trim() || 'Configured Fee Required'}
              </span>
            ) : (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% FREE ENTRY
              </span>
            )}
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 border ${
                isRegistrationOpen
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              {isRegistrationOpen ? 'Registration Active' : 'Registration Closed'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-[#172B49] mb-2.5">
            Register for {competition.name}
          </h1>

          <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-5 max-w-2xl font-normal">
            Complete the official registration dossier below. Submissions are securely recorded in the festival system and synced directly to the Department Google Sheet. Once submitted, download your official YUGANTAR 2026 Delegate Pass.
          </p>

          {/* Quick metadata chips */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#172B49]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#4B91E8]" />
              <span>{eventDateDisplay}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#9187DE]" />
              <span>{competition.venue || 'PCE Campus, Nagpur'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Registration Experience */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Multi-Step Form Workspace */}
            <div className="lg:col-span-8">
              <div
                suppressHydrationWarning
                className={`registration-workspace-card yugantar-card-interactive ${compGlow} nexus-card p-5 sm:p-8 bg-white border border-[#DCE5F2] shadow-sm rounded-3xl transition-all`}
                style={{
                  '--card-edge-color': competition.accentColor,
                  '--card-edge-hover-border': competition.accentColor,
                } as React.CSSProperties}
              >
                {isRegistrationOpen ? (
                  <RegistrationFormWrapper
                    competitionSlug={competition.slug}
                    accentColor={competition.accentColor}
                    competition={competition}
                  />
                ) : (
                  <div className="py-12 px-4 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-2xs">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-lg font-display font-bold text-[#172B49]">
                         Registrations Currently Closed
                      </h3>
                      <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed">
                        {festivalSettings.registrationStatusMessage ||
                          'Official delegate registrations for this arena are not currently accepting submissions. Please check back later or read the competition dossier for schedule updates.'}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link
                        href={`/competitions/${competition.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#172B49] text-white text-xs font-mono font-bold hover:bg-[#253D66] transition shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Return to Event Dossier</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Sidebar Panel */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-28">
              {/* Competition Quick Card */}
              <div
                suppressHydrationWarning
                className={`yugantar-card-interactive ${compGlow} nexus-card p-5 bg-white border border-[#DCE5F2] rounded-2xl shadow-xs transition-all`}
                style={{
                  '--card-edge-color': competition.accentColor,
                  '--card-edge-hover-border': competition.accentColor,
                } as React.CSSProperties}
              >
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49] pb-3 border-b border-[#E2E8F0] mb-4">
                  Arena Reference
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Track Name</span>
                    <span className="font-bold text-[#172B49]">{competition.name}</span>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Discovery District</span>
                    <span className="font-bold text-[#172B49]">{competition.district}</span>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Presentation Format</span>
                    <span className="text-[#60728A]">{competition.formatNote}</span>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Team Eligibility</span>
                    <span className="text-[#60728A]">{competition.teamRequirementsPlaceholder}</span>
                  </div>
                </div>
              </div>

              {/* Guidelines Card */}
              <div
                suppressHydrationWarning
                className="yugantar-card-interactive glow-amber p-4 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] space-y-2 shadow-xs transition-all"
              >
                <h4 className="text-xs font-bold text-[#E07A43] flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  Submission Safeguards
                </h4>
                <ul className="space-y-1.5 text-[11px] text-[#60728A] leading-relaxed">
                  <li>• Progress auto-saves as a draft in your browser.</li>
                  <li>• Verify that your UPI transaction UTR is accurate.</li>
                  <li>• Ensure payment screenshot links (Google Drive / Imgur) are set to viewable by anyone.</li>
                  <li>• Each registration receives a unique Reference ID upon submission.</li>
                </ul>
              </div>

              {/* Navigation Actions */}
              <div className="space-y-2">
                <Link
                  href={`/competitions/${competition.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#F8FAFD] text-[#172B49] text-xs font-mono font-bold transition-colors border border-[#DCE5F2]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Track Dossier
                </Link>
                <Link
                  href="/competitions"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F8FAFD] hover:bg-[#EDF5FC] text-[#60728A] hover:text-[#172B49] text-xs font-mono font-medium transition-colors border border-[#DCE5F2]"
                >
                  View All Arenas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
