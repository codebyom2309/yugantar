import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import JourneyClient from './JourneyClient';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';

export const metadata: Metadata = {
  title: 'Festival Journey & Event Timeline',
  description:
    'Step-by-step delegate journey for YUGANTAR 2026 — from campus arrival and registration staging to live arena evaluations, keynote presentations, and valedictory ceremony at Priyadarshini College of Engineering, Nagpur.',
  alternates: {
    canonical: '/journey',
  },
  openGraph: {
    title: 'Festival Journey & Timeline — YUGANTAR 2026 | PCE Nagpur',
    description:
      'Step-by-step delegate timeline for YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur.',
    url: '/journey',
    images: [
      {
        url: '/images/nexus-city/hero-panoramic-city.webp',
        width: 1947,
        height: 808,
        alt: 'YUGANTAR 2026 Event Journey and Schedule',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Festival Journey & Timeline — YUGANTAR 2026',
    description:
      'Step-by-step delegate journey from campus orientation to valedictory podiums at PCE Nagpur.',
    images: ['/images/nexus-city/hero-panoramic-city.webp'],
  },
};

export default function JourneyPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Journey', path: '/journey' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
        <JourneyClient />
      </Suspense>
    </>
  );
}
