'use client';

import { FESTIVAL_INFO, COMPETITIONS } from '@/data/events';
import { FestivalSettings, DbCompetition } from '@/lib/competitions';

export type ClientFestivalSettings = FestivalSettings & {
  event_name?: string;
  event_edition?: string;
  event_concept?: string;
  event_tagline?: string;
  event_subheading?: string;
  event_date?: string;
  event_iso_date?: string;
  event_venue?: string;
  event_location_short?: string;
  [key: string]: any;
};

interface FestivalDataResponse {
  competitions: DbCompetition[];
  festival: ClientFestivalSettings;
}

let inFlightPromise: Promise<FestivalDataResponse> | null = null;
let cachedData: FestivalDataResponse | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds client memory cache

/**
 * Deduplicated client-side loader for festival configuration & competitions.
 * Merges concurrent fetch requests from Navbar, Hero, DeparturesTicker, CompetitionsGrid,
 * InteractiveCityMap, Footer, etc. into a single HTTP request.
 */
export async function fetchClientFestivalData(forceFresh = false): Promise<FestivalDataResponse> {
  const now = Date.now();

  if (!forceFresh && cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedData;
  }

  if (inFlightPromise && !forceFresh) {
    return inFlightPromise;
  }

  inFlightPromise = fetch('/api/competitions')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<FestivalDataResponse>;
    })
    .then((data) => {
      cachedData = data;
      lastFetchTime = Date.now();
      inFlightPromise = null;
      return data;
    })
    .catch((err) => {
      inFlightPromise = null;
      console.warn('Failed to fetch festival data, returning fallback:', err);
      return {
        competitions: COMPETITIONS as DbCompetition[],
        festival: {
          ...FESTIVAL_INFO,
          registrationGlobalOpen: true,
          event_name: FESTIVAL_INFO.name,
          event_edition: FESTIVAL_INFO.edition,
          event_concept: FESTIVAL_INFO.concept,
          event_tagline: FESTIVAL_INFO.tagline,
          event_subheading: FESTIVAL_INFO.subheading,
          event_date: FESTIVAL_INFO.date,
          event_iso_date: FESTIVAL_INFO.isoDate,
          event_venue: FESTIVAL_INFO.venue,
          event_location_short: FESTIVAL_INFO.locationShort,
        },
      };
    });

  return inFlightPromise;
}

export function clearClientFestivalCache(): void {
  cachedData = null;
  lastFetchTime = 0;
  inFlightPromise = null;
}
