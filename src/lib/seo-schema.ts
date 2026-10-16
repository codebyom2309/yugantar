import { getAbsoluteUrl, getSiteUrl } from './site-url';
import type { DbCompetition } from './competitions';

/**
 * Verified Institutional and Event details for Schema.org JSON-LD
 */
export const EVENT_INSTITUTION = {
  name: 'Priyadarshini College of Engineering',
  department: 'Department of Electronics and Telecommunication Engineering',
  forum: 'TELE-ERA Student Forum',
  venueName: 'Priyadarshini College of Engineering Campus',
  streetAddress: 'CRPF Gate No. 3, Hingna Road, Digdoh Hills',
  addressLocality: 'Nagpur',
  addressRegion: 'Maharashtra',
  postalCode: '440019',
  addressCountry: 'IN',
  eventDate: '2026-10-21',
  eventStartTime: '2026-10-21T09:00:00+05:30',
  eventEndTime: '2026-10-21T18:00:00+05:30',
};

/**
 * 1. Organization Schema (Department of ETC, PCE Nagpur & TELE-ERA Forum)
 */
export function buildOrganizationSchema() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${siteUrl}/#organization`,
    name: 'Department of Electronics and Telecommunication Engineering, Priyadarshini College of Engineering',
    alternateName: ['TELE-ERA Student Forum', 'ETC Department PCE Nagpur'],
    url: siteUrl,
    logo: getAbsoluteUrl('/icon-512.png'),
    image: getAbsoluteUrl('/images/nexus-city/hero-panoramic-city.webp'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: EVENT_INSTITUTION.streetAddress,
      addressLocality: EVENT_INSTITUTION.addressLocality,
      addressRegion: EVENT_INSTITUTION.addressRegion,
      postalCode: EVENT_INSTITUTION.postalCode,
      addressCountry: EVENT_INSTITUTION.addressCountry,
    },
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: EVENT_INSTITUTION.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: EVENT_INSTITUTION.addressLocality,
        addressRegion: EVENT_INSTITUTION.addressRegion,
        addressCountry: EVENT_INSTITUTION.addressCountry,
      },
    },
  };
}

/**
 * 2. WebSite Schema
 */
export function buildWebSiteSchema() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'YUGANTAR 2026 — Engineering the Next Era',
    alternateName: 'YUGANTAR 2026 Official Technical Festival Portal',
    description:
      'Official technical festival portal for YUGANTAR 2026, featuring flagship engineering arenas, hardware challenges, research showcases, and strategy tracks at Priyadarshini College of Engineering, Nagpur.',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    inLanguage: 'en-US',
  };
}

/**
 * 3. Overall Festival Event Schema (Homepage)
 */
export function buildFestivalEventSchema() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${siteUrl}/#event`,
    name: 'YUGANTAR 2026 — National Technical Festival',
    description:
      'Annual intercollegiate technical festival organized by the Department of Electronics and Telecommunication Engineering & TELE-ERA at Priyadarshini College of Engineering, Nagpur on 21 October 2026.',
    startDate: EVENT_INSTITUTION.eventStartTime,
    endDate: EVENT_INSTITUTION.eventEndTime,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: EVENT_INSTITUTION.venueName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: EVENT_INSTITUTION.streetAddress,
        addressLocality: EVENT_INSTITUTION.addressLocality,
        addressRegion: EVENT_INSTITUTION.addressRegion,
        postalCode: EVENT_INSTITUTION.postalCode,
        addressCountry: EVENT_INSTITUTION.addressCountry,
      },
    },
    image: [
      getAbsoluteUrl('/images/nexus-city/hero-panoramic-city.webp'),
      getAbsoluteUrl('/icon-512.png'),
    ],
    organizer: {
      '@id': `${siteUrl}/#organization`,
    },
  };
}

/**
 * 4. Individual Competition Event Schema
 */
export function buildCompetitionEventSchema(competition: DbCompetition) {
  const compUrl = getAbsoluteUrl(`/competitions/${competition.slug}`);
  const siteUrl = getSiteUrl();

  // Resolve canonical image URL
  let imageUrl = getAbsoluteUrl('/images/nexus-city/hero-panoramic-city.webp');
  if (competition.bannerImage) {
    imageUrl = competition.bannerImage.startsWith('http')
      ? competition.bannerImage
      : getAbsoluteUrl(competition.bannerImage);
  } else if (competition.cardImage) {
    imageUrl = competition.cardImage.startsWith('http')
      ? competition.cardImage
      : getAbsoluteUrl(competition.cardImage);
  }

  // Parse fee if present
  let price = '0';
  let isFree = true;
  if (competition.isPaid && competition.registrationFee) {
    const numericFee = competition.registrationFee.replace(/[^0-9.]/g, '');
    if (numericFee && Number(numericFee) > 0) {
      price = numericFee;
      isFree = false;
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${compUrl}#event`,
    name: `${competition.name} — YUGANTAR 2026`,
    alternateName: competition.tag || competition.name,
    description: competition.shortDescription || competition.about,
    url: compUrl,
    startDate: `${EVENT_INSTITUTION.eventDate}T09:30:00+05:30`,
    endDate: `${EVENT_INSTITUTION.eventDate}T17:30:00+05:30`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: `${competition.venue || 'Department of ETC'}, ${EVENT_INSTITUTION.name}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: EVENT_INSTITUTION.streetAddress,
        addressLocality: EVENT_INSTITUTION.addressLocality,
        addressRegion: EVENT_INSTITUTION.addressRegion,
        postalCode: EVENT_INSTITUTION.postalCode,
        addressCountry: EVENT_INSTITUTION.addressCountry,
      },
    },
    image: imageUrl,
    offers: {
      '@type': 'Offer',
      url: getAbsoluteUrl(`/competitions/${competition.slug}`),
      price: price,
      priceCurrency: 'INR',
      availability: competition.registrationOpen !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      validFrom: '2026-09-01T00:00:00+05:30',
    },
    organizer: {
      '@id': `${siteUrl}/#organization`,
    },
    superEvent: {
      '@id': `${siteUrl}/#event`,
    },
  };
}

/**
 * 5. BreadcrumbList Schema
 */
export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.path),
    })),
  };
}

/**
 * 6. FAQPage Schema
 */
export function buildFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
