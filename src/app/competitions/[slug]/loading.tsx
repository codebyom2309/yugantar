import React from 'react';

export default function CompetitionDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col selection:bg-[#E07A43]/20 selection:text-[#172B49]">
      {/* Top Navbar Placeholder */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8FAFD]/90 backdrop-blur-md border-b border-[#DCE5F2]/80 h-16 sm:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] animate-pulse" />
            <div className="h-5 w-28 rounded bg-[#E2E8F0] animate-pulse hidden sm:block" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 rounded bg-[#E2E8F0] animate-pulse hidden md:block" />
            <div className="h-4 w-24 rounded bg-[#E2E8F0] animate-pulse hidden md:block" />
            <div className="h-9 w-28 rounded-xl bg-[#CBD5E1] animate-pulse" />
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION SKELETON
          ========================================================================= */}
      <section className="relative pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 overflow-hidden border-b border-[#DCE5F2] bg-gradient-to-b from-[#EDF5FC] via-[#F4F8FD] to-[#F8FAFD]">
        {/* Ambient atmospheric subtle glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4B91E8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#FFF4EA] rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 animate-pulse motion-reduce:animate-none">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <div className="h-3 w-12 rounded bg-[#E2E8F0]" />
            <span className="text-[#8CA0BA] text-xs">/</span>
            <div className="h-3 w-20 rounded bg-[#E2E8F0]" />
            <span className="text-[#8CA0BA] text-xs">/</span>
            <div className="h-3 w-28 rounded bg-[#CBD5E1]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {/* Badges Row Skeleton */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-6 w-36 rounded-full bg-[#E2E8F0] border border-[#DCE5F2]" />
                <div className="h-6 w-24 rounded-full bg-white border border-[#DCE5F2]" />
                <div className="h-6 w-32 rounded-full bg-emerald-50 border border-emerald-100" />
              </div>

              {/* Title Skeleton */}
              <div className="space-y-2 pt-1">
                <div className="h-9 sm:h-12 w-4/5 max-w-xl rounded-2xl bg-[#CBD5E1]" />
                <div className="h-4 sm:h-5 w-3/5 max-w-lg rounded-lg bg-[#E2E8F0]" />
              </div>

              {/* Tagline / Subtitle Skeleton */}
              <div className="h-4 w-11/12 max-w-xl rounded bg-[#E2E8F0] pt-1" />

              {/* Key Highlights / Requirement Badges Skeleton */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <div className="h-8 w-32 rounded-xl bg-white border border-[#DCE5F2]" />
                <div className="h-8 w-36 rounded-xl bg-white border border-[#DCE5F2]" />
                <div className="h-8 w-28 rounded-xl bg-white border border-[#DCE5F2]" />
                <div className="h-8 w-32 rounded-xl bg-white border border-[#DCE5F2]" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <div className="h-12 w-52 rounded-xl bg-gradient-to-r from-[#CBD5E1] to-[#E2E8F0]" />
                <div className="h-12 w-36 rounded-xl bg-white border border-[#DCE5F2]" />
              </div>
            </div>

            {/* Dedicated 16:9 Banner Preview Skeleton */}
            <div className="lg:col-span-4 w-full">
              <div className="relative aspect-video rounded-3xl bg-gradient-to-br from-[#E2E8F0] to-[#EDF2F7] border border-[#DCE5F2] shadow-xs overflow-hidden flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-md bg-[#CBD5E1]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN DOSSIER CONTENT SKELETON
          ========================================================================= */}
      <main className="py-10 sm:py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
            {/* Left Column: Deep Information Dossier */}
            <div className="lg:col-span-8 space-y-8 sm:space-y-10 animate-pulse motion-reduce:animate-none">
              {/* Register Card Skeleton */}
              <div className="p-6 sm:p-7 rounded-3xl border border-[#DCE5F2] bg-white shadow-2xs space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-[#E2E8F0]" />
                    <div className="h-7 w-48 rounded-xl bg-[#CBD5E1]" />
                  </div>
                  <div className="h-8 w-24 rounded-full bg-emerald-50 border border-emerald-100" />
                </div>
                <div className="h-16 w-full rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2]" />
              </div>

              {/* About Section Skeleton */}
              <div className="p-6 sm:p-8 rounded-3xl border border-[#DCE5F2] bg-white shadow-2xs space-y-4">
                <div className="h-6 w-40 rounded-xl bg-[#CBD5E1]" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-[#E2E8F0]" />
                  <div className="h-4 w-11/12 rounded bg-[#E2E8F0]" />
                  <div className="h-4 w-4/5 rounded bg-[#E2E8F0]" />
                </div>
              </div>
            </div>

            {/* Right Column: Quick Facts & Coordinators Sidebar Skeleton */}
            <div className="lg:col-span-4 space-y-6 animate-pulse motion-reduce:animate-none">
              <div className="p-6 rounded-3xl border border-[#DCE5F2] bg-white shadow-2xs space-y-4">
                <div className="h-5 w-32 rounded-lg bg-[#CBD5E1]" />
                <div className="space-y-3 pt-2">
                  <div className="h-12 w-full rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]" />
                  <div className="h-12 w-full rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]" />
                  <div className="h-12 w-full rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="border-t border-[#DCE5F2] bg-white/70 h-24" />
    </div>
  );
}
