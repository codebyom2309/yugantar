import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import CompetitionsClient from './CompetitionsClient';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';
import { getPublicCompetitions } from '@/lib/competitions';
import { getAbsoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Flagship Technical Competitions & Arenas',
  description:
    'Explore all flagship engineering arenas of YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur — hardware circuits, research presentations, ideathon, mock placements, and esports.',
  alternates: {
    canonical: '/competitions',
  },
  openGraph: {
    title: 'Flagship Technical Competitions — YUGANTAR 2026 | PCE Nagpur',
    description:
      'Explore all flagship engineering arenas of YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur.',
    url: '/competitions',
    images: [
      {
        url: '/images/nexus-city/hero-panoramic-city.webp',
        width: 1947,
        height: 808,
        alt: 'YUGANTAR 2026 Competitions and Technological Arenas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flagship Technical Competitions — YUGANTAR 2026',
    description:
      'Flagship engineering arenas across hardware, research, career, and esports at Priyadarshini College of Engineering, Nagpur.',
    images: ['/images/nexus-city/hero-panoramic-city.webp'],
  },
};

export default async function CompetitionsPage() {
  const competitions = await getPublicCompetitions();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Competitions', path: '/competitions' },
  ]);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'YUGANTAR 2026 Engineering Competitions',
    description: 'Flagship technological arenas at Priyadarshini College of Engineering, Nagpur.',
    numberOfItems: competitions.length,
    itemListElement: competitions.map((comp, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: comp.name,
      url: getAbsoluteUrl(`/competitions/${comp.slug}`),
      description: comp.shortDescription,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
        <CompetitionsClient />
      </Suspense>
    </>
  );
}
