import { NextRequest, NextResponse } from 'next/server';
import ical, { ICalEventStatus, ICalEventTransparency } from 'ical-generator';
import { createClient } from '@/lib/supabase/server';

export interface SpaceRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

/**
 * Resolves a space by UUID, exact slug, sanitized slug, or fuzzy title match.
 */
export async function resolveSpace(slugOrId: string, supabase: any): Promise<SpaceRecord | null> {
  const clean = slugOrId
    .replace(/\.(ics|ical)$/i, '')
    .trim();

  // 1. Try slug exact
  const { data: bySlug } = await supabase
    .from('spaces')
    .select('id, title, slug, description')
    .eq('slug', clean)
    .maybeSingle();

  if (bySlug) return bySlug;

  // 2. Try ID if valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  if (isUuid) {
    const { data: byId } = await supabase
      .from('spaces')
      .select('id, title, slug, description')
      .eq('id', clean)
      .maybeSingle();

    if (byId) return byId;
  }

  // 3. Fallback: Query all spaces for fuzzy/prefix match
  const { data: spaces } = await supabase
    .from('spaces')
    .select('id, title, slug, description');

  if (!spaces || spaces.length === 0) return null;

  const normalized = clean.toLowerCase();
  const matched = spaces.find((s: SpaceRecord) => {
    const sSlug = s.slug.toLowerCase();
    const sTitle = s.title.toLowerCase();
    return (
      sSlug === normalized ||
      normalized.startsWith(sSlug) ||
      sSlug.startsWith(normalized) ||
      normalized.includes(sSlug) ||
      sSlug.includes(normalized) ||
      normalized.replace(/-/g, ' ').includes(sTitle) ||
      sTitle.includes(normalized.replace(/-/g, ' '))
    );
  });

  return matched || null;
}

/**
 * Generates an RFC 5545 compliant iCalendar feed and NextResponse
 */
export async function generateIcalResponse(
  slugOrId: string,
  request?: NextRequest,
  isHeadOnly: boolean = false
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const space = await resolveSpace(slugOrId, supabase);

    const siteOrigin =
      (request && new URL(request.url).origin) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://nothingness.asia';

    if (!space) {
      // Return a valid, RFC 5545 compliant empty iCal calendar feed so aggregators
      // (like Airbnb / Booking.com) immediately verify and connect without failing with 404
      const cleanSlug = slugOrId.replace(/\.(ics|ical)$/i, '');
      const cleanTitle = cleanSlug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      const fallbackCalendar = ical({
        name: `Nothingness - ${cleanTitle || 'Sanctuary'}`,
        description: `Live reservation calendar for Nothingness Sanctuary`,
        prodId: {
          company: 'Nothingness Asia',
          product: 'Sanctuary Calendar Feed',
          language: 'EN',
        },
        url: `${siteOrigin}/api/spaces/${cleanSlug}/calendar.ics`,
        timezone: 'UTC',
      });

      const responseHeaders = {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="nothingness-${cleanSlug}.ics"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (isHeadOnly) {
        return new NextResponse(null, { status: 200, headers: responseHeaders });
      }

      return new NextResponse(fallbackCalendar.toString(), {
        status: 200,
        headers: responseHeaders,
      });
    }

    // 1. Fetch confirmed / pending internal bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, guests, status')
      .eq('space_id', space.id)
      .neq('status', 'cancelled');

    // 2. Fetch external blocked dates
    const { data: externalDates } = await supabase
      .from('external_blocked_dates')
      .select('id, start_date, end_date, summary, external_uid')
      .eq('space_id', space.id);

    const calendarUrl = `${siteOrigin}/api/spaces/${space.slug}/calendar.ics`;

    // 3. Construct RFC 5545 compliant calendar
    const calendar = ical({
      name: `Nothingness - ${space.title}`,
      description: space.description || `Live reservation calendar for ${space.title}`,
      prodId: {
        company: 'Nothingness Asia',
        product: `${space.title} Sanctuary Calendar`,
        language: 'EN',
      },
      url: calendarUrl,
      timezone: 'UTC',
    });

    // 4. Add internal bookings as opaque all-day events
    bookings?.forEach((booking) => {
      calendar.createEvent({
        id: `booking-${booking.id}@nothingness.asia`,
        start: new Date(booking.check_in),
        end: new Date(booking.check_out),
        summary: 'Reserved',
        description: `Reserved via Nothingness Sanctuary (Ref: ${booking.id.slice(0, 8)})`,
        allDay: true,
        transparency: ICalEventTransparency.OPAQUE,
        status: ICalEventStatus.CONFIRMED,
        sequence: 0,
      });
    });

    // 5. Add external/manual blocks
    externalDates?.forEach((blocked) => {
      const eventUid = blocked.external_uid
        ? (blocked.external_uid.includes('@') ? blocked.external_uid : `${blocked.external_uid}@nothingness.asia`)
        : `block-${blocked.id}@nothingness.asia`;

      calendar.createEvent({
        id: eventUid,
        start: new Date(blocked.start_date),
        end: new Date(blocked.end_date),
        summary: blocked.summary || 'Reserved',
        description: 'Reserved / Blocked on Nothingness Sanctuary',
        allDay: true,
        transparency: ICalEventTransparency.OPAQUE,
        status: ICalEventStatus.CONFIRMED,
        sequence: 0,
      });
    });

    const calendarString = calendar.toString();

    const responseHeaders = {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="nothingness-${space.slug}.ics"`,
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (isHeadOnly) {
      return new NextResponse(null, {
        status: 200,
        headers: responseHeaders,
      });
    }

    return new NextResponse(calendarString, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('iCal Generation Error:', error);
    return new NextResponse('Internal Server Error generating iCalendar feed', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
