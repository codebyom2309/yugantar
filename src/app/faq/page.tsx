import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import FaqClient from './FaqClient';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/seo-schema';
import { FAQS } from '@/data/events';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ)',
  description:
    'Find answers regarding registration, eligibility, payment verification, competition rules, venue directions, and digital passes for YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions — YUGANTAR 2026 | PCE Nagpur',
    description:
      'Official FAQ regarding registration, event dates, eligibility, and payment for YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur.',
    url: '/faq',
    images: [
      {
        url: '/images/nexus-city/hero-panoramic-city.webp',
        width: 1947,
        height: 808,
        alt: 'YUGANTAR 2026 Frequently Asked Questions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions — YUGANTAR 2026',
    description:
      'Answers to registration, rules, digital passes, and logistics for YUGANTAR 2026 at PCE Nagpur.',
    images: ['/images/nexus-city/hero-panoramic-city.webp'],
  },
};

export default function FaqPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'FAQ', path: '/faq' },
  ]);

  const faqSchema = buildFaqSchema(FAQS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
        <FaqClient />
      </Suspense>
    </>
  );
}
