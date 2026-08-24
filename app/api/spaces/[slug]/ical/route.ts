import { NextRequest, NextResponse } from 'next/server';
import ical, { ICalEventStatus, ICalEventTransparency } from 'ical-generator';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Fetch the space by slug or UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let spaceQuery = supabase
      .from('spaces')
      .select('id, title, description, slug');

    if (isUuid) {
      spaceQuery = spaceQuery.eq('id', slug);
    } else {
      spaceQuery = spaceQuery.eq('slug', slug);
    }

    const { data: space, error: spaceError } = await spaceQuery.single();

    if (spaceError || !space) {
      return new NextResponse('Space not found', { status: 404 });
    }

    // 2. Fetch all active/confirmed internal bookings for this space
    const { data: bookings, error: bookError } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, guests, status')
      .eq('space_id', space.id)
      .neq('status', 'cancelled');

    if (bookError) {
      console.error('iCal export bookError:', bookError);
      return new NextResponse('Failed to fetch bookings', { status: 500 });
    }

    // 3. Fetch external blocked dates and manual blocks
    const { data: externalDates, error: blockedError } = await supabase
      .from('external_blocked_dates')
      .select('id, start_date, end_date, summary, external_uid')
      .eq('space_id', space.id);

    if (blockedError) {
      console.error('iCal export blockedError:', blockedError);
    }

    // 4. Generate the iCal feed
    const calendar = ical({
      name: `Nothingness - ${space.title}`,
      description: space.description || `Live calendar for ${space.title}`,
      prodId: {
        company: 'Nothingness',
        product: `${space.title} Sanctuary Calendar`,
        language: 'EN'
      },
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia'}/api/spaces/${space.slug}/ical`,
      timezone: 'UTC'
    });

    // Add internal bookings
    bookings?.forEach((booking) => {
      calendar.createEvent({
        id: `booking-${booking.id}@nothingness.asia`,
        start: new Date(booking.check_in),
        end: new Date(booking.check_out),
        summary: 'Reserved',
        description: `Reserved via Nothingness Sanctuary (Booking #${booking.id.slice(0, 8)})`,
        allDay: true,
        transparency: ICalEventTransparency.OPAQUE,
        status: ICalEventStatus.CONFIRMED,
      });
    });

    // Add external blocked dates
    externalDates?.forEach((blocked) => {
      calendar.createEvent({
        id: `block-${blocked.external_uid || blocked.id}@nothingness.asia`,
        start: new Date(blocked.start_date),
        end: new Date(blocked.end_date),
        summary: blocked.summary || 'Blocked',
        description: 'Dates blocked on Nothingness',
        allDay: true,
        transparency: ICalEventTransparency.OPAQUE,
        status: ICalEventStatus.CONFIRMED,
      });
    });

    // 5. Return as standard iCal format with live, zero-cache headers
    return new NextResponse(calendar.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="nothingness-${space.slug}.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('iCal Export Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
