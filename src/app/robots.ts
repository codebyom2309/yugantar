import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/competitions',
          '/competitions/*',
          '/districts',
          '/journey',
          '/faq',
          '/images/*',
          '/api/media/*',
          '/_next/static/*',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/',
          '/pass',
          '/pass/*',
          '/verify',
          '/verify/*',
          '/competitions/*/register',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
