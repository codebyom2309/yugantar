import React from 'react';
import HeroPreviewCard, { HeroCardData } from './HeroPreviewCard';
import RegistrationCtaPreviewCard from './RegistrationCtaPreviewCard';
import AboutPreviewCard from './AboutPreviewCard';
import SchedulePreviewCard, { ScheduleItem } from './SchedulePreviewCard';
import RubricPreviewCard, { EvaluationMatrix } from './RubricPreviewCard';
import RulesPreviewCard from './RulesPreviewCard';
import ExpectationsPreviewCard from './ExpectationsPreviewCard';
import FaqPreviewCard, { FaqItem } from './FaqPreviewCard';
import DossierPreviewCard from './DossierPreviewCard';
import CoordinatorsPreviewCard, { CoordinatorData } from './CoordinatorsPreviewCard';
import CustomSectionsPreviewCard, { CustomSectionItem } from './CustomSectionsPreviewCard';

export interface MobileViewCompetitionData extends HeroCardData {
  about: string;
  formatNote: string;
  approvedDomains?: string[];
  theme?: string;
  highlights?: string[];
  scheduleFlow: ScheduleItem[];
  evaluationMatrix: EvaluationMatrix;
  rules: string[];
  expectations: string[];
  faqs: FaqItem[];
  customSections?: CustomSectionItem[];
  sectionVisibility?: Record<string, boolean>;
}

export default function PublicCompetitionMobileView({
  competition,
  coordinators,
  activeSectionId,
}: {
  competition: MobileViewCompetitionData;
  coordinators: CoordinatorData[];
  activeSectionId?: string;
}) {
  const vis = competition.sectionVisibility || {
    hero: true,
    registration: true,
    about: true,
    schedule: true,
    rubric: true,
    rules: true,
    expectations: true,
    faqs: true,
    dossier: true,
    coordinators: true,
    custom: true,
  };

  const getCardRing = (sectionId: string) => {
    return activeSectionId === sectionId
      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#F8FAFD] transition-all'
      : '';
  };

  return (
    <div className="w-full bg-[#F8FAFD] text-[#172B49] p-3.5 space-y-4 font-sans select-none">
      {/* 1. Hero Card */}
      {vis.hero !== false && (
        <div id="preview-hero" className={getCardRing('hero')}>
          <HeroPreviewCard data={competition} isStandaloneCard={false} />
        </div>
      )}

      {/* 2. Registration CTA Card */}
      {vis.registration !== false && (
        <div id="preview-registration" className={getCardRing('registration')}>
          <RegistrationCtaPreviewCard
            data={{
              name: competition.name,
              accentColor: competition.accentColor,
              accentSecondary: competition.accentSecondary,
              accentBg: competition.accentBg,
              registrationOpen: competition.registrationOpen,
            }}
          />
        </div>
      )}

      {/* 3. About Card */}
      {vis.about !== false && (
        <div id="preview-about" className={getCardRing('about')}>
          <AboutPreviewCard
            data={{
              about: competition.about,
              formatNote: competition.formatNote,
              approvedDomains: competition.approvedDomains,
              theme: competition.theme,
              highlights: competition.highlights,
            }}
          />
        </div>
      )}

      {/* 4. Schedule Card */}
      {vis.schedule !== false && (
        <div id="preview-schedule" className={getCardRing('schedule')}>
          <SchedulePreviewCard schedule={competition.scheduleFlow} />
        </div>
      )}

      {/* 5. Rubric Card */}
      {vis.rubric !== false && (
        <div id="preview-rubric" className={getCardRing('rubric')}>
          <RubricPreviewCard rubric={competition.evaluationMatrix} />
        </div>
      )}

      {/* 6. Rules Card */}
      {vis.rules !== false && (
        <div id="preview-rules" className={getCardRing('rules')}>
          <RulesPreviewCard data={{ rules: competition.rules, pdfUrl: competition.rulesPdfUrl }} />
        </div>
      )}

      {/* 7. Expectations Card */}
      {vis.expectations !== false && (
        <div id="preview-expectations" className={getCardRing('expectations')}>
          <ExpectationsPreviewCard
            expectations={competition.expectations}
            accentColor={competition.accentColor}
          />
        </div>
      )}

      {/* 8. FAQs Card */}
      {vis.faqs !== false && (
        <div id="preview-faqs" className={getCardRing('faqs')}>
          <FaqPreviewCard faqs={competition.faqs} />
        </div>
      )}

      {/* 9. Dossier Card */}
      {vis.dossier !== false && (
        <div id="preview-dossier" className={getCardRing('dossier')}>
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
        </div>
      )}

      {/* 10. Coordinators Card */}
      {vis.coordinators !== false && (
        <div id="preview-coordinators" className={getCardRing('coordinators')}>
          <CoordinatorsPreviewCard coordinators={coordinators} />
        </div>
      )}

      {/* 11. Custom Content Blocks */}
      {vis.custom !== false && competition.customSections && (
        <div id="preview-custom" className={getCardRing('custom')}>
          <CustomSectionsPreviewCard sections={competition.customSections} />
        </div>
      )}
    </div>
  );
}
