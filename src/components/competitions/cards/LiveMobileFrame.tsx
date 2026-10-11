'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Layers,
  ExternalLink,
  Wifi,
  Battery,
  Maximize2,
  Minimize2,
  RotateCw,
  Eye,
} from 'lucide-react';
import PublicCompetitionMobileView, {
  MobileViewCompetitionData,
} from './PublicCompetitionMobileView';
import HeroPreviewCard from './HeroPreviewCard';
import RegistrationCtaPreviewCard from './RegistrationCtaPreviewCard';
import AboutPreviewCard from './AboutPreviewCard';
import SchedulePreviewCard from './SchedulePreviewCard';
import RubricPreviewCard from './RubricPreviewCard';
import RulesPreviewCard from './RulesPreviewCard';
import ExpectationsPreviewCard from './ExpectationsPreviewCard';
import FaqPreviewCard from './FaqPreviewCard';
import DossierPreviewCard from './DossierPreviewCard';
import CoordinatorsPreviewCard, { CoordinatorData } from './CoordinatorsPreviewCard';
import CustomSectionsPreviewCard from './CustomSectionsPreviewCard';

interface LiveMobileFrameProps {
  competition: MobileViewCompetitionData;
  coordinators: CoordinatorData[];
  activeSectionId: string;
  activeSectionTitle: string;
}

export default function LiveMobileFrame({
  competition,
  coordinators,
  activeSectionId,
  activeSectionTitle,
}: LiveMobileFrameProps) {
  const [viewMode, setViewMode] = useState<'card' | 'full'>('card');
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  // Render individual card based on activeSectionId
  const renderSingleCard = () => {
    switch (activeSectionId) {
      case 'hero':
        return <HeroPreviewCard data={competition} isStandaloneCard={true} />;
      case 'registration':
        return (
          <RegistrationCtaPreviewCard
            data={{
              name: competition.name,
              accentColor: competition.accentColor,
              accentSecondary: competition.accentSecondary,
              accentBg: competition.accentBg,
              registrationOpen: competition.registrationOpen,
            }}
          />
        );
      case 'about':
        return (
          <AboutPreviewCard
            data={{
              about: competition.about,
              formatNote: competition.formatNote,
              approvedDomains: competition.approvedDomains,
              theme: competition.theme,
              highlights: competition.highlights,
            }}
          />
        );
      case 'schedule':
        return <SchedulePreviewCard schedule={competition.scheduleFlow} />;
      case 'rubric':
        return <RubricPreviewCard rubric={competition.evaluationMatrix} />;
      case 'rules':
        return (
          <RulesPreviewCard
            data={{
              rules: competition.rules,
              pdfUrl: competition.rulesPdfUrl,
            }}
          />
        );
      case 'expectations':
        return (
          <ExpectationsPreviewCard
            expectations={competition.expectations}
            accentColor={competition.accentColor}
          />
        );
      case 'faqs':
        return <FaqPreviewCard faqs={competition.faqs} />;
      case 'dossier':
        return (
          <DossierPreviewCard
            data={{
              venue: competition.venue,
              eligibility: competition.eligibility,
              teamSizeLimit: competition.teamSizeLimit,
              eventDate: competition.eventDate,
              accentColor: competition.accentColor,
              registrationOpen: competition.registrationOpen,
            }}
          />
        );
      case 'coordinators':
        return <CoordinatorsPreviewCard coordinators={coordinators} />;
      case 'custom':
        return (
          <CustomSectionsPreviewCard
            sections={competition.customSections || []}
          />
        );
      default:
        return <HeroPreviewCard data={competition} isStandaloneCard={true} />;
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Frame Top Controls */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-white/10 border border-slate-300 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Selected Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'full'
                  ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Full Page</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh preview render"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400">
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
            Live Reactive Preview
          </span>
          <Link
            href={`/competitions/${competition.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open Tab</span>
          </Link>
        </div>
      </div>

      {/* Simulated Mobile Device Frame (Optimized Slim Bezel) */}
      <div className="relative w-full max-w-[420px] rounded-[32px] p-1.5 bg-gradient-to-b from-slate-800 via-slate-900 to-black shadow-xl border-2 border-slate-700/80 ring-1 ring-black/40">
        {/* Dynamic Island / Top Camera Bezel */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-3 bg-black rounded-full z-30 flex items-center justify-end px-1.5">
          <div className="w-2 h-2 rounded-full bg-[#17253B] border border-slate-700" />
        </div>

        {/* Mobile Viewport Screen Canvas (Isolated Public Light Theme Scope) */}
        <div
          key={key}
          data-theme="public-light"
          className="relative w-full rounded-[26px] overflow-hidden bg-[#F8FAFD] text-[#172B49] border border-slate-200 shadow-inner flex flex-col max-h-[660px]"
        >
          {/* Simulated Mobile Status Bar */}
          <div className="pt-2 px-5 pb-1 flex items-center justify-between text-[10px] font-mono font-bold text-[#172B49] shrink-0 bg-[#F8FAFD] select-none z-20">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-[#172B49]">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Active Card Label Indicator */}
          <div className="px-3.5 py-1.5 bg-[#EDF5FC] border-b border-[#DCE5F2] flex items-center justify-between text-[10px] font-mono text-[#4B91E8] font-bold">
            <span className="truncate">
              {viewMode === 'card' ? `PREVIEW: ${activeSectionTitle}` : 'PREVIEW: FULL PARTICIPANT PAGE'}
            </span>
            <span className="text-[9px] text-[#8CA0BA] font-normal shrink-0">#F8FAFD Light</span>
          </div>

          {/* Inner Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar">
            {viewMode === 'card' ? (
              <div className="animate-in fade-in duration-150">
                {renderSingleCard()}
              </div>
            ) : (
              <PublicCompetitionMobileView
                competition={competition}
                coordinators={coordinators}
                activeSectionId={activeSectionId}
              />
            )}
          </div>

          {/* Home Indicator Bar */}
          <div className="py-2 flex items-center justify-center bg-[#F8FAFD] shrink-0 z-20">
            <div className="w-32 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Helper caption below frame */}
      <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-zinc-400">
        Exact mobile layout using public fonts, light surfaces and badges. Updates live as you type.
      </p>
    </div>
  );
}
