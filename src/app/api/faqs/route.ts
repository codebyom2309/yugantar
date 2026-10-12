import { NextResponse } from 'next/server';
import { getPublicFaqs } from '@/lib/competitions';
import { FAQS as STATIC_FAQS } from '@/data/events';

// GET /api/faqs — Public endpoint for published festival and competition FAQs
export async function GET() {
  const cacheHeaders = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
  };

  try {
    const dbFaqs = await getPublicFaqs();
    if (dbFaqs && dbFaqs.length > 0) {
      return NextResponse.json({ faqs: dbFaqs }, { headers: cacheHeaders });
    }
  } catch (err) {
    console.warn('DB faqs query failed, using static fallback:', err);
  }

  return NextResponse.json({ faqs: STATIC_FAQS }, { headers: cacheHeaders });
}
