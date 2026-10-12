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

export function invalidatePublicCache(domains: CacheDomain | CacheDomain[], extraSlug?: string): void {
  const domainList = Array.isArray(domains) ? domains : [domains];

  for (const domain of domainList) {
    try {
      switch (domain) {
        case 'competitions':
          revalidateTag('competitions', 'max');
          if (extraSlug) {
            revalidateTag(`competition-${extraSlug}`, 'max');
            revalidatePath(`/competitions/${extraSlug}`);
          }
          revalidatePath('/competitions');
          revalidatePath('/districts');
          revalidatePath('/');
          revalidatePath('/api/competitions');
          break;

        case 'organizers':
          revalidateTag('organizers', 'max');
          revalidatePath('/about');
          revalidatePath('/');
          break;

        case 'settings':
          revalidateTag('settings', 'max');
          revalidatePath('/');
          revalidatePath('/about');
          revalidatePath('/competitions');
          revalidatePath('/districts');
          revalidatePath('/journey');
          revalidatePath('/faq');
          revalidatePath('/api/competitions');
          break;

        case 'faqs':
          revalidateTag('faqs', 'max');
          revalidatePath('/faq');
          revalidatePath('/');
          revalidatePath('/api/faqs');
          break;

        case 'all':
          revalidateTag('competitions', 'max');
          revalidateTag('organizers', 'max');
          revalidateTag('settings', 'max');
          revalidateTag('faqs', 'max');
          revalidatePath('/');
          revalidatePath('/about');
          revalidatePath('/competitions');
          revalidatePath('/districts');
          revalidatePath('/journey');
          revalidatePath('/faq');
          revalidatePath('/api/competitions');
          revalidatePath('/api/faqs');
          break;
      }
    } catch (err) {
      console.warn(`[Cache Invalidation] Failed to invalidate tag/path for ${domain}:`, err);
    }
  }
}
