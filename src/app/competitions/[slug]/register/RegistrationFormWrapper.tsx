'use client';

import React from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import { getRegistrationFormBySlug } from '@/data/registrationForms';

export default function RegistrationFormWrapper({
  competitionSlug,
  accentColor,
}: {
  competitionSlug: string;
  accentColor?: string;
}) {
  const formConfig = getRegistrationFormBySlug(competitionSlug);

  if (!formConfig) {
    return (
      <div className="py-8 text-center text-sm text-[#7E93AC]">
        Registration form configuration not found for this competition.
      </div>
    );
  }

  return <RegistrationForm config={formConfig} accentColor={accentColor} />;
}
