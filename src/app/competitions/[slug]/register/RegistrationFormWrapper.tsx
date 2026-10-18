'use client';

import React from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import { getRegistrationFormBySlug } from '@/data/registrationForms';

export default function RegistrationFormWrapper({
  competitionSlug,
  accentColor,
  competition,
}: {
  competitionSlug: string;
  accentColor?: string;
  competition?: any;
}) {
  const formConfig = getRegistrationFormBySlug(competitionSlug);

  if (!formConfig) {
    return (
      <div className="py-8 text-center text-sm text-[#7E93AC]">
        Registration form configuration not found for this competition.
      </div>
    );
  }

  const sanitizedCompetition = competition
    ? {
        ...competition,
        upiId: 'poojakonge2727@oksbi',
        payeeName: 'Pooja Konge',
      }
    : competition;

  return (
    <RegistrationForm
      config={formConfig}
      accentColor={accentColor}
      competition={sanitizedCompetition}
    />
  );
}
