import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { COMPETITIONS, Competition, FESTIVAL_INFO, FESTIVAL_ASSETS, getCompetitionBySlug } from '@/data/events';

/**
 * Public Competition Loader — Database-first with robust static fallback and Next.js Data Cache.
 * Backed by unstable_cache with separate domain tags:
 * - 'competitions': All published competitions and slug details
 * - 'settings': Festival settings, countdown date, venue, footer info
 * - 'organizers': Organizers list and organizer committee members
 * - 'faqs': Published FAQs
 *
 * Cache revalidates every 300 seconds (5 min) automatically or on-demand
 * via targeted admin mutation hooks.
 */

export interface DbCompetition extends Competition {
  isPublished?: boolean;
  registrationOpen?: boolean;
  eventDate?: string;
  venueDirections?: string;
  registrationDeadline?: string;
  registrationInstructions?: string;
  minTeamMembers?: number;
  isPaid?: boolean;
  registrationFee?: string;
  qrMode?: 'upload' | 'generate';
  payeeName?: string;
  qrCodeUrl?: string;
  upiId?: string;
  paymentUrl?: string;
  paymentInstructions?: string;
  requireUtr?: boolean;
  requireScreenshot?: boolean;
  isFeeFixed?: boolean;
  showPaymentQr?: boolean;
  whatsappLink?: string;
  confirmationInstructions?: string;
  passEnabled?: boolean;
  certificateEnabled?: boolean;
  allowedSemesters?: string[];
  sectionVisibility?: Record<string, boolean>;
  customSections?: Array<{
    id: string;
    title: string;
    type: 'text' | 'bullets' | 'notice' | 'download';
    content?: string;
    items?: string[];
    fileUrl?: string;
    isVisible?: boolean;
    displayOrder?: number;
  }>;
  coordinators?: {
    id: string;
    name: string;
    role: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  }[];
}

export interface DepartmentDiscountRule {
  enabled: boolean;
  institution: string;
  department: string;
  discountPercentage: number;
  applicableCompetitions: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface FestivalSettings {
  name: string;
  edition: string;
  concept: string;
  tagline: string;
  subheading: string;
  date: string;
  isoDate: string;
  venue: string;
  locationShort: string;
  address: string;
  department: string;
  organizers: string;
  college: string;
  registrationGlobalOpen: boolean;
  registrationStatusMessage?: string;
  heroArtwork?: string;
  heroArtworkMobile?: string;
  logoEmblem?: string;
  districtsMap?: string;
  homepageHeroCardImage?: string;
  footerDescription?: string;
  footerEmail?: string;
  footerPhone?: string;
  footerInstagram?: string;
  footerLinkedin?: string;
  footerGithub?: string;
  footerCollegeUrl?: string;
  footerCustomLinks?: Array<{ label: string; url: string }>;
  showOrganizerOrder?: boolean;
  departmentDiscountRule?: DepartmentDiscountRule;
}

export interface DbOrganizerMember {
  id: string;
  name: string;
  role: string;
  category: 'turbo_bits' | 'faculty' | 'core_committee';
  organization_id?: string | null;
  department?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  display_order: number;
  is_published: number;
  crop_data?: string | null;
  forum_designation?: string | null;
  is_lead?: number | boolean | null;
}

// -----------------------------------------------------------------------------
// Raw Database Fetchers (With Static Fallback)
// -----------------------------------------------------------------------------

export async function fetchPublicCompetitionsRaw(): Promise<DbCompetition[]> {
  try {
    const rows = await db.query<Record<string, unknown>>(
      `SELECT * FROM competitions
       WHERE is_published = 1
       ORDER BY display_order ASC, created_at ASC`
    );

    if (rows && rows.length > 0) {
      const comps = rows.map((r) => mapDbRowToCompetition(r));

      // Fetch public coordinators for all published competitions
      try {
        const coords = await db.query<{
          id: string;
          competition_slug: string;
          name: string;
          role: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
        }>(
          `SELECT id, competition_slug, name, role, email, phone, avatar_url
           FROM competition_coordinators
           WHERE is_active = 1 AND is_public = 1
           ORDER BY display_order ASC`
        );

        const coordsBySlug = new Map<string, Array<{
          id: string;
          name: string;
          role: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
        }>>();

        for (const c of coords) {
          if (!coordsBySlug.has(c.competition_slug)) {
            coordsBySlug.set(c.competition_slug, []);
          }
          coordsBySlug.get(c.competition_slug)!.push({
            id: c.id,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            avatar_url: c.avatar_url,
          });
        }

        for (const comp of comps) {
          comp.coordinators = coordsBySlug.get(comp.slug) || [];
        }
      } catch (coordErr) {
        console.warn('Failed to attach coordinators to public competitions:', coordErr);
      }

      return comps;
    }
  } catch (err) {
    console.error('Database query for public competitions failed, using static fallback:', err);
  }

  // Fallback to static constants
  return COMPETITIONS as DbCompetition[];
}

export async function fetchPublicCompetitionBySlugRaw(slug: string): Promise<DbCompetition | null> {
  try {
    const rows = await db.query<Record<string, unknown>>(
      `SELECT * FROM competitions
       WHERE (slug = ? OR id = ? OR (slug = 'mock-placement-drive' AND ? = 'mock-placement'))
       LIMIT 1`,
      [slug, slug, slug]
    );

    if (rows && rows.length > 0) {
      const comp = mapDbRowToCompetition(rows[0]);

      // Fetch public coordinators
      const coords = await db.query<{
        id: string;
        name: string;
        role: string;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
      }>(
        `SELECT id, name, role, email, phone, avatar_url
         FROM competition_coordinators
         WHERE competition_slug = ? AND is_active = 1 AND is_public = 1
         ORDER BY display_order ASC`,
        [comp.slug]
      );

      comp.coordinators = coords;
      return comp;
    }
  } catch (err) {
    console.error(`Database query for competition "${slug}" failed, using static fallback:`, err);
  }

  // Fallback to static
  const staticComp = getCompetitionBySlug(slug);
  return (staticComp as DbCompetition) || null;
}

function deriveIsoDate(displayDate?: string, storedIso?: string): string {
  if (displayDate) {
    const months: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const parts = displayDate.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1].toLowerCase();
      const year = parts[2];
      const mm = months[monthStr];
      if (mm && /^\d{4}$/.test(year) && /^\d{2}$/.test(day)) {
        return `${year}-${mm}-${day}T09:00:00+05:30`;
      }
    }
  }
  if (storedIso && storedIso.includes('T')) return storedIso;
  if (storedIso && /^\d{4}-\d{2}-\d{2}$/.test(storedIso)) {
    return `${storedIso}T09:00:00+05:30`;
  }
  return FESTIVAL_INFO.isoDate;
}

export async function fetchFestivalSettingsRaw(): Promise<FestivalSettings> {
  try {
    const rows = await db.query<{ setting_key: string; setting_value: string }>(
      'SELECT setting_key, setting_value FROM site_settings'
    );

    if (rows && rows.length > 0) {
      const map: Record<string, string> = {};
      rows.forEach((r) => {
        map[r.setting_key] = r.setting_value;
      });

      const date = map.event_date || FESTIVAL_INFO.date;
      const isoDate = deriveIsoDate(date, map.event_iso_date);

      return {
        name: map.event_name || FESTIVAL_INFO.name,
        edition: map.event_edition || FESTIVAL_INFO.edition,
        concept: map.event_concept || FESTIVAL_INFO.concept,
        tagline: map.event_tagline || FESTIVAL_INFO.tagline,
        subheading: map.event_subheading || FESTIVAL_INFO.subheading,
        date,
        isoDate,
        venue: map.event_venue || FESTIVAL_INFO.venue,
        locationShort: map.event_location_short || FESTIVAL_INFO.locationShort,
        address: map.event_address || FESTIVAL_INFO.address,
        department: map.event_department || FESTIVAL_INFO.department,
        organizers: map.event_organizers_text || FESTIVAL_INFO.organizers,
        college: map.event_college || FESTIVAL_INFO.college,
        registrationGlobalOpen: map.registration_global_open !== '0',
        registrationStatusMessage: map.registration_status_message || undefined,
        heroArtwork: map.hero_artwork || FESTIVAL_ASSETS.heroArtwork,
        heroArtworkMobile: map.hero_artwork_mobile || FESTIVAL_ASSETS.heroArtworkMobile,
        logoEmblem: map.logo_emblem || FESTIVAL_ASSETS.logoEmblem,
        districtsMap: map.districts_map || FESTIVAL_ASSETS.districtsMap,
        homepageHeroCardImage: map.homepage_hero_card_image || '/images/nexus-city/hero-futuristic-city-clouds.webp',
        footerDescription: map.footer_description,
        footerEmail: map.footer_email,
        footerPhone: map.footer_phone,
        footerInstagram: map.footer_instagram,
        footerLinkedin: map.footer_linkedin,
        footerGithub: map.footer_github,
        footerCollegeUrl: map.footer_college_url,
        footerCustomLinks: (() => {
          if (!map.footer_custom_links) return undefined;
          try {
            return JSON.parse(map.footer_custom_links);
          } catch {
            return undefined;
          }
        })(),
        showOrganizerOrder: map.show_organizer_order === '1',
        departmentDiscountRule: (() => {
          if (!map.department_discount_rules) return undefined;
          try {
            return JSON.parse(map.department_discount_rules);
          } catch {
            return undefined;
          }
        })(),
      };
    }
  } catch (err) {
    console.error('Database query for site settings failed, using static fallback:', err);
  }

  return {
    ...FESTIVAL_INFO,
    registrationGlobalOpen: true,
    showOrganizerOrder: false,
    heroArtwork: FESTIVAL_ASSETS.heroArtwork,
    heroArtworkMobile: FESTIVAL_ASSETS.heroArtworkMobile,
    logoEmblem: FESTIVAL_ASSETS.logoEmblem,
    districtsMap: FESTIVAL_ASSETS.districtsMap,
    footerDescription: 'YUGANTAR 2026 is the premier intercollegiate technical symposium organized by the Department of Electronics & Telecommunication Engineering and TELE-ERA at Priyadarshini College of Engineering, Nagpur.',
    footerEmail: 'teleera.etc@pcenagpur.edu.in',
    footerPhone: '+91 7104 236381 / 236382',
    footerInstagram: 'https://instagram.com',
    footerLinkedin: 'https://linkedin.com',
    footerGithub: 'https://github.com/codebyom2309/yugantar',
    footerCollegeUrl: 'https://www.pcenagpur.edu.in',
  };
}

export async function fetchPublicOrganizersRaw() {
  try {
    const rows = await db.query<{
      id: string;
      name: string;
      role: string;
      department: string;
      description: string;
      badge: string;
      leadership_note: string;
      logo_url: string | null;
    }>(
      'SELECT * FROM organizers WHERE is_published = 1 ORDER BY display_order ASC, created_at ASC'
    );
    if (rows && rows.length > 0) {
      const seen = new Set<string>();
      const uniqueRows = rows.filter((r) => {
        if (!r.name || seen.has(r.name)) return false;
        seen.add(r.name);
        return true;
      });
      return uniqueRows.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        department: r.department,
        description: r.description,
        badge: r.badge,
        leadershipNote: r.leadership_note,
        logoUrl: r.logo_url,
      }));
    }
  } catch (err) {
    console.warn('Failed to load DB organizers, using fallback:', err);
  }

  const { ORGANIZERS } = await import('@/data/events');
  return ORGANIZERS.map((o) => ({ ...o, id: o.name, logoUrl: null }));
}

export async function fetchPublicOrganizerMembersRaw(category?: 'turbo_bits' | 'faculty' | 'core_committee'): Promise<DbOrganizerMember[]> {
  try {
    let sql = 'SELECT * FROM organizer_members WHERE is_published = 1';
    const params: string[] = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY display_order ASC, created_at ASC';
    const rows = await db.query<DbOrganizerMember>(sql, params);
    if (rows && rows.length > 0) {
      const seen = new Set<string>();
      return rows.filter((r) => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    }
  } catch (err) {
    console.warn('Failed to load DB organizer members:', err);
  }
  return [];
}

export async function fetchPublicFaqsRaw(competitionSlug?: string) {
  try {
    let where = 'WHERE is_published = 1';
    const params: string[] = [];
    if (competitionSlug) {
      where += ' AND (competition_slug = ? OR competition_slug IS NULL)';
      params.push(competitionSlug);
    }
    const rows = await db.query<{
      id: string;
      category: string;
      question: string;
      answer: string;
      competition_slug: string | null;
    }>(
      `SELECT * FROM faqs ${where} ORDER BY display_order ASC, created_at ASC`,
      params
    );
    if (rows && rows.length > 0) {
      const seen = new Set<string>();
      return rows.filter((r) => {
        if (!r.question || seen.has(r.question)) return false;
        seen.add(r.question);
        return true;
      });
    }
  } catch (err) {
    console.warn('Failed to load DB faqs:', err);
  }

  return [];
}

// -----------------------------------------------------------------------------
// Cached Fetchers (Next.js Data Cache / Vercel Shared Cache)
// -----------------------------------------------------------------------------

const getCachedPublicCompetitions = unstable_cache(
  async () => fetchPublicCompetitionsRaw(),
  ['public-competitions-list'],
  { revalidate: 60, tags: ['competitions'] }
);

export async function getPublicCompetitions(): Promise<DbCompetition[]> {
  return getCachedPublicCompetitions();
}

export async function getPublicCompetitionBySlug(slug: string): Promise<DbCompetition | null> {
  const fetcher = unstable_cache(
    async () => fetchPublicCompetitionBySlugRaw(slug),
    ['public-competition-by-slug', slug],
    { revalidate: 60, tags: ['competitions', `competition-${slug}`] }
  );
  return fetcher();
}

const getCachedFestivalSettings = unstable_cache(
  async () => fetchFestivalSettingsRaw(),
  ['festival-settings-data'],
  { revalidate: 60, tags: ['settings'] }
);

const getCachedPublicOrganizers = unstable_cache(
  async () => fetchPublicOrganizersRaw(),
  ['public-organizers-list'],
  { revalidate: 60, tags: ['organizers'] }
);

const getCachedPublicOrganizerMembers = unstable_cache(
  async (category?: string) => fetchPublicOrganizerMembersRaw(category as 'turbo_bits' | 'faculty' | 'core_committee'),
  ['public-organizer-members-list'],
  { revalidate: 60, tags: ['organizers'] }
);

const getCachedPublicFaqs = unstable_cache(
  async (competitionSlug?: string) => fetchPublicFaqsRaw(competitionSlug),
  ['public-faqs-list'],
  { revalidate: 60, tags: ['faqs'] }
);


export async function getFestivalSettings(): Promise<FestivalSettings> {
  return getCachedFestivalSettings();
}

export async function getDepartmentDiscountRule(): Promise<DepartmentDiscountRule | null> {
  try {
    const settings = await getCachedFestivalSettings();
    if (settings.departmentDiscountRule) {
      return settings.departmentDiscountRule;
    }
  } catch (err) {
    console.error('Failed to get cached department discount rule:', err);
  }
  return {
    enabled: true,
    institution: 'PCE',
    department: 'ITC',
    discountPercentage: 50,
    applicableCompetitions: ['all'],
  };
}

export async function getPublicOrganizers() {
  return getCachedPublicOrganizers();
}

export async function getPublicOrganizerMembers(category?: 'turbo_bits' | 'faculty' | 'core_committee'): Promise<DbOrganizerMember[]> {
  return getCachedPublicOrganizerMembers(category);
}

export async function getPublicFaqs(competitionSlug?: string) {
  return getCachedPublicFaqs(competitionSlug);
}

// -----------------------------------------------------------------------------
// Mapping Helpers
// -----------------------------------------------------------------------------

function mapDbRowToCompetition(r: Record<string, unknown>): DbCompetition {
  const parseJson = (val: unknown, fallback: unknown) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val as string);
    } catch {
      return fallback;
    }
  };

  return {
    id: String(r.id || r.slug),
    slug: String(r.slug),
    name: String(r.name),
    district: String(r.district || 'Nexus Arena'),
    districtIndex: Number(r.district_index || 0),
    districtTagline: String(r.district_tagline || ''),
    category: (r.category as DbCompetition['category']) || 'Hardware & Circuits',
    tag: String(r.tag || ''),
    shortDescription: String(r.short_description || ''),
    fullDescription: String(r.full_description || ''),
    about: String(r.about || ''),
    venue: String(r.venue || ''),
    eligibility: String(r.eligibility || ''),
    teamSizeLimit: String(r.team_size_limit || ''),
    maxTeamMembers: Number(r.max_team_members || 1),
    isIndividualOnly: Boolean(r.is_individual_only),
    isFixedSquad: Boolean(r.is_fixed_squad),
    theme: r.theme ? String(r.theme) : undefined,
    approvedDomains: parseJson(r.approved_domains, []),
    scheduleFlow: parseJson(r.schedule_flow, []),
    evaluationMatrix: parseJson(r.evaluation_matrix, undefined),
    roundsDescription: parseJson(r.rounds_description, []),
    rules: parseJson(r.rules, []),
    expectations: parseJson(r.expectations, []),
    formatNote: String(r.format_note || ''),
    highlights: parseJson(r.highlights, []),
    iconName: String(r.icon_name || 'Trophy'),
    bannerImage: String(
      r.banner_image ||
      COMPETITIONS.find((c) => c.slug === r.slug)?.bannerImage ||
      '/images/nexus-city/hero-futuristic-city-clouds.webp'
    ),
    cardImage: String(
      r.card_image ||
      COMPETITIONS.find((c) => c.slug === r.slug)?.cardImage ||
      '/images/nexus-city/hero-futuristic-city-clouds.webp'
    ),
    mapCoords: parseJson(r.map_coords, { x: 50, y: 50 }),
    accentColor: String(r.accent_color || '#3B82F6'),
    accentSecondary: String(r.accent_secondary || '#6366F1'),
    accentBg: String(r.accent_bg || 'rgba(59, 130, 246, 0.1)'),
    themeVibe: (r.theme_vibe as DbCompetition['themeVibe']) || 'circuit',
    faqs: parseJson(r.faqs, []),
    sectionVisibility: parseJson(r.section_visibility, {
      hero: true,
      registration: true,
      about: true,
      schedule: true,
      rubric: true,
      rules: true,
      expectations: true,
      faqs: true,
      dossier: true,
      coordinators: true,
      custom: true,
    }),
    customSections: parseJson(r.custom_sections, []),
    eligibilityPlaceholder: String(r.eligibility || ''),
    teamRequirementsPlaceholder: String(r.team_size_limit || ''),
    rulesPlaceholder: parseJson(r.rules, []),
    isPublished: Boolean(r.is_published),
    eventDate:
      r.event_date &&
      String(r.event_date).trim() !== '' &&
      String(r.event_date).trim() !== 'null' &&
      String(r.event_date).trim() !== 'undefined'
        ? String(r.event_date).trim()
        : undefined,
    venueDirections: r.venue_directions ? String(r.venue_directions) : undefined,
    registrationDeadline: r.registration_deadline ? String(r.registration_deadline) : undefined,
    registrationInstructions: r.registration_instructions ? String(r.registration_instructions) : undefined,
    minTeamMembers: Number(r.min_team_members || 1),
    isPaid: r.is_paid !== undefined && r.is_paid !== null ? Boolean(r.is_paid) : Boolean(COMPETITIONS.find((c) => c.slug === r.slug)?.isPaid),
    registrationFee: r.registration_fee ? String(r.registration_fee) : (COMPETITIONS.find((c) => c.slug === r.slug)?.registrationFee || 'Free'),
    qrMode: (r.qr_mode as 'upload' | 'generate') || COMPETITIONS.find((c) => c.slug === r.slug)?.qrMode || (r.qr_code_url ? 'upload' : 'generate'),
    payeeName: r.payee_name ? String(r.payee_name) : (COMPETITIONS.find((c) => c.slug === r.slug)?.payeeName || 'TELE-ERA YUGANTAR 2026'),
    qrCodeUrl: r.qr_code_url ? String(r.qr_code_url) : COMPETITIONS.find((c) => c.slug === r.slug)?.qrCodeUrl,
    upiId: r.upi_id ? String(r.upi_id) : (COMPETITIONS.find((c) => c.slug === r.slug)?.upiId || 'teleera@oksbi'),
    paymentUrl: r.payment_url ? String(r.payment_url) : undefined,
    paymentInstructions: r.payment_instructions ? String(r.payment_instructions) : undefined,
    requireUtr: r.require_utr !== undefined && r.require_utr !== null ? Boolean(r.require_utr) : Boolean(COMPETITIONS.find((c) => c.slug === r.slug)?.requireUtr),
    requireScreenshot: r.require_screenshot !== undefined && r.require_screenshot !== null ? Boolean(r.require_screenshot) : Boolean(COMPETITIONS.find((c) => c.slug === r.slug)?.requireScreenshot),
    isFeeFixed: r.is_fee_fixed !== undefined && r.is_fee_fixed !== null ? Boolean(r.is_fee_fixed) : true,
    showPaymentQr: r.show_payment_qr !== undefined && r.show_payment_qr !== null ? Boolean(r.show_payment_qr) : true,
    whatsappLink: r.whatsapp_link ? String(r.whatsapp_link) : COMPETITIONS.find((c) => c.slug === r.slug)?.whatsappLink,
    confirmationInstructions: r.confirmation_instructions ? String(r.confirmation_instructions) : undefined,
    passEnabled: r.pass_enabled !== undefined && r.pass_enabled !== null ? Boolean(r.pass_enabled) : true,
    certificateEnabled: r.certificate_enabled !== undefined && r.certificate_enabled !== null ? Boolean(r.certificate_enabled) : true,
    allowedSemesters: parseJson(r.allowed_semesters, []),
  };
}
