import { NextResponse } from 'next/server';
import { getPublicCompetitions, getFestivalSettings } from '@/lib/competitions';

// GET /api/competitions — Public endpoint for published competitions & festival configuration
export async function GET() {
  try {
    const [competitions, festival] = await Promise.all([
      getPublicCompetitions(),
      getFestivalSettings(),
    ]);

    return NextResponse.json({
      competitions,
      festival: {
        ...festival,
        event_name: festival.name,
        event_edition: festival.edition,
        event_concept: festival.concept,
        event_tagline: festival.tagline,
        event_subheading: festival.subheading,
        event_date: festival.date,
        event_iso_date: festival.isoDate,
        event_venue: festival.venue,
        event_location_short: festival.locationShort,
      },
    });
  } catch (err) {
    console.error('Public competitions API error:', err);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  }
}
