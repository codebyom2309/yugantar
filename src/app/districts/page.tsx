import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import DistrictsClient from './DistrictsClient';
import { buildBreadcrumbSchema } from '@/lib/seo-schema';

export const metadata: Metadata = {
  title: 'NEXUS CITY Districts & Interactive Arenas',
  description:
    'Navigate the eight technological districts of NEXUS CITY and the central ETC Department spire for YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur.',
  alternates: {
    canonical: '/districts',
  },
  openGraph: {
    title: 'NEXUS CITY Districts — YUGANTAR 2026 | PCE Nagpur',
    description:
      'Interactive arena map and technological districts for YUGANTAR 2026 at Priyadarshini College of Engineering, Nagpur.',
    url: '/districts',
    images: [
      {
        url: '/images/nexus-city/city-districts-map.webp',
        width: 1920,
        height: 1080,
        alt: 'YUGANTAR 2026 NEXUS CITY Interactive Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEXUS CITY Districts — YUGANTAR 2026',
    description:
      'Navigate the eight technological districts and central ETC department spire at PCE Nagpur.',
    images: ['/images/nexus-city/city-districts-map.webp'],
  },
};

export default function DistrictsPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Districts', path: '/districts' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
        <DistrictsClient />
      </Suspense>
    </>
  );
}
