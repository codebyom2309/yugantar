import type { MetadataRoute } from 'next';
import { getPublicCompetitions } from '@/lib/competitions';
import { getAbsoluteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Query all published competitions from the authoritative source
  const competitions = await getPublicCompetitions();

  const now = new Date();

  // 1. Core Public Institutional Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: getAbsoluteUrl('/competitions'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl('/about'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: getAbsoluteUrl('/districts'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: getAbsoluteUrl('/journey'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: getAbsoluteUrl('/faq'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: getAbsoluteUrl('/turbobits'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // 2. Individual Published Competition Pages
  const competitionRoutes: MetadataRoute.Sitemap = competitions
    .filter((comp) => comp.isPublished !== false && comp.slug)
    .map((comp) => ({
      url: getAbsoluteUrl(`/competitions/${comp.slug}`),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  return [...staticRoutes, ...competitionRoutes];
}
