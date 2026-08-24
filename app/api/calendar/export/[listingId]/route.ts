import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ical from 'ical-generator'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const supabase = await createClient()

    // Fetch the listing to name the calendar
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('name')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return new NextResponse('Listing Not Found', { status: 404 })
    }

    // Fetch all confirmed/blocked bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('listing_id', listingId)
      .in('status', ['confirmed', 'blocked'])

    if (bookingsError) {
      throw bookingsError
    }

    const calendar = ical({ name: `Nothingness - ${listing.name}` })

    bookings?.forEach((booking) => {
      calendar.createEvent({
        start: new Date(booking.check_in),
        end: new Date(booking.check_out),
        summary: booking.status === 'confirmed' ? 'Reserved' : 'Blocked',
        allDay: true,
        id: booking.id // Unique identifier for the event
      })
    })

    return new NextResponse(calendar.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="listing-${listingId}.ics"`,
      },
    })
  } catch (error) {
    console.error('Error generating iCal export:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
