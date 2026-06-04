import { NextRequest, NextResponse } from 'next/server';
import ical from 'ical-generator';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch the space by slug
  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select('id, title, description')
    .eq('slug', slug)
    .single();

  if (spaceError || !space) {
    return new NextResponse('Space not found', { status: 404 });
  }

  // 2. Fetch all confirmed internal bookings for this space
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('check_in, check_out, guests, status')
    .eq('space_id', space.id)
    .neq('status', 'cancelled');

  if (bookError) {
    return new NextResponse('Failed to fetch bookings', { status: 500 });
  }

  // 3. Fetch all external blocked dates from synced calendars
  const { data: externalDates } = await supabase
    .from('external_blocked_dates')
    .select('start_date, end_date, summary')
    .eq('space_id', space.id);

  // 4. Generate the iCal feed with BOTH internal + external dates
  const calendar = ical({
    name: `Nothingness - ${space.title}`,
    description: space.description,
    prodId: `//nothingness.asia//${space.title}//EN`,
  });

  // Add internal bookings
  bookings.forEach((booking) => {
    calendar.createEvent({
      start: new Date(booking.check_in),
      end: new Date(booking.check_out),
      summary: `Reserved - ${booking.status}`,
      description: `Guests: ${booking.guests}`,
      allDay: true,
    });
  });

  // Add external blocked dates (from Airbnb, Booking.com, etc.)
  externalDates?.forEach((blocked) => {
    calendar.createEvent({
      start: new Date(blocked.start_date),
      end: new Date(blocked.end_date),
      summary: blocked.summary || 'Blocked (External)',
      allDay: true,
    });
  });

  // 5. Return as standard iCal format
  return new NextResponse(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="nothingness-${slug}.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
