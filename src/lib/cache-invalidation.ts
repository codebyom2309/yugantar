import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Targeted cache invalidation helper for YUGANTAR 2026.
 * Adheres to Next.js 16 signature: revalidateTag(tag, 'max')
 * 
 * Tags:
 * - 'competitions': Public competitions list & individual competitions
 * - 'organizers': Organizers & organizer members
 * - 'settings': Festival settings, date, venue, footer links
 * - 'faqs': FAQs list
 */

export type CacheDomain = 'competitions' | 'organizers' | 'settings' | 'faqs' | 'all';

function safeRevalidateTag(tag: string) {
  try {
    // Next.js standard signature
    (revalidateTag as any)(tag);
  } catch {
    try {
      // Next.js with expire 0 for immediate purge
      (revalidateTag as any)(tag, { expire: 0 });
    } catch {
      try {
        (revalidateTag as any)(tag, 'max');
      } catch (err) {
        console.warn(`[Cache Invalidation] Failed to revalidate tag ${tag}:`, err);
      }
    }
  }
}

export function invalidatePublicCache(domains: CacheDomain | CacheDomain[], extraSlug?: string): void {
  const domainList = Array.isArray(domains) ? domains : [domains];

  for (const domain of domainList) {
    try {
      switch (domain) {
        case 'competitions':
          safeRevalidateTag('competitions');
          if (extraSlug) {
            safeRevalidateTag(`competition-${extraSlug}`);
            revalidatePath(`/competitions/${extraSlug}`, 'page');
          }
          revalidatePath('/competitions', 'page');
          revalidatePath('/competitions/[slug]', 'page');
          revalidatePath('/districts', 'page');
          revalidatePath('/', 'page');
          revalidatePath('/journey', 'page');
          revalidatePath('/api/competitions');
          break;

        case 'organizers':
          safeRevalidateTag('organizers');
          revalidatePath('/about', 'page');
          revalidatePath('/', 'page');
          break;

        case 'settings':
          safeRevalidateTag('settings');
          safeRevalidateTag('competitions');
          revalidatePath('/', 'page');
          revalidatePath('/about', 'page');
          revalidatePath('/competitions', 'page');
          revalidatePath('/competitions/[slug]', 'page');
          revalidatePath('/districts', 'page');
          revalidatePath('/journey', 'page');
          revalidatePath('/faq', 'page');
          revalidatePath('/api/competitions');
          break;

        case 'faqs':
          safeRevalidateTag('faqs');
          revalidatePath('/faq', 'page');
          revalidatePath('/', 'page');
          revalidatePath('/api/faqs');
          break;

        case 'all':
          safeRevalidateTag('competitions');
          safeRevalidateTag('organizers');
          safeRevalidateTag('settings');
          safeRevalidateTag('faqs');
          revalidatePath('/', 'page');
          revalidatePath('/about', 'page');
          revalidatePath('/competitions', 'page');
          revalidatePath('/competitions/[slug]', 'page');
          revalidatePath('/districts', 'page');
          revalidatePath('/journey', 'page');
          revalidatePath('/faq', 'page');
          revalidatePath('/api/competitions');
          revalidatePath('/api/faqs');
          break;
      }
    } catch (err) {
      console.warn(`[Cache Invalidation] Failed to invalidate tag/path for ${domain}:`, err);
    }
  }
}

