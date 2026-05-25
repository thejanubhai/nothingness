import { NextRequest, NextResponse } from 'next/server';
import ical from 'ical-generator';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch the property to get its ID and details
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, title, description')
    .eq('slug', slug)
    .single();

  if (propError || !property) {
    return new NextResponse('Property not found', { status: 404 });
  }

  // 2. Fetch all bookings for this property
  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('check_in, check_out, guests, booking_status')
    .eq('property_id', property.id)
    .neq('booking_status', 'cancelled');

  if (bookError) {
    return new NextResponse('Failed to fetch bookings', { status: 500 });
  }

  // 3. Generate the iCal feed
  const calendar = ical({
    name: `Nothingness - ${property.title}`,
    description: property.description,
    prodId: `//nothingness.com//${property.title}//EN`,
  });

  bookings.forEach((booking) => {
    calendar.createEvent({
      start: new Date(booking.check_in),
      end: new Date(booking.check_out),
      summary: `Reserved - ${booking.booking_status}`,
      description: `Guests: ${booking.guests}`,
      allDay: true, // Airbnb expects bookings to block full days
    });
  });

  // 4. Return as standard iCal format
  return new NextResponse(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="nothingness-${slug}.ics"`,
    },
  });
}
