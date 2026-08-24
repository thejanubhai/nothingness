import { NextRequest, NextResponse } from 'next/server';
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

function formatDateToIcalDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function getUtcTimestamp(d: Date = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

/**
 * Builds a strict RFC 5545 compliant iCalendar string compatible with
 * InGo-MMT (MakeMyTrip / Goibibo), Airbnb, Booking.com, Google Calendar, and Apple iCal.
 */
export function buildRfc5545IcalString(
  spaceTitle: string,
  events: Array<{
    uid: string;
    startDate: string;
    endDate: string;
    summary?: string;
    description?: string;
  }>
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nothingness//Sanctuary Calendar 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${spaceTitle || 'Nothingness Sanctuary'}`,
    'X-WR-TIMEZONE:UTC',
  ];

  const dtStamp = getUtcTimestamp();

  events.forEach((event) => {
    const start = formatDateToIcalDate(event.startDate);
    const end = formatDateToIcalDate(event.endDate);

    if (!start || !end) return;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(`SUMMARY:${event.summary || 'Reserved'}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push(`DESCRIPTION:${event.description || 'Reserved on Nothingness Sanctuary'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
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

    const spaceTitle = space?.title || slugOrId.replace(/\.(ics|ical)$/i, '').replace(/[-_]+/g, ' ');

    const eventsList: Array<{
      uid: string;
      startDate: string;
      endDate: string;
      summary?: string;
      description?: string;
    }> = [];

    if (space) {
      // 1. Fetch confirmed / pending internal bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, check_in, check_out, guests, status')
        .eq('space_id', space.id)
        .neq('status', 'cancelled');

      bookings?.forEach((b) => {
        eventsList.push({
          uid: `booking-${b.id}@nothingness.asia`,
          startDate: b.check_in,
          endDate: b.check_out,
          summary: 'Reserved',
          description: `Reserved via Nothingness Sanctuary (Ref: ${b.id.slice(0, 8)})`,
        });
      });

      // 2. Fetch external blocked dates
      const { data: externalDates } = await supabase
        .from('external_blocked_dates')
        .select('id, start_date, end_date, summary, external_uid')
        .eq('space_id', space.id);

      externalDates?.forEach((blocked) => {
        const uid = blocked.external_uid
          ? (blocked.external_uid.includes('@') ? blocked.external_uid : `${blocked.external_uid}@nothingness.asia`)
          : `block-${blocked.id}@nothingness.asia`;

        eventsList.push({
          uid,
          startDate: blocked.start_date,
          endDate: blocked.end_date,
          summary: blocked.summary || 'Reserved',
          description: 'Reserved / Blocked on Nothingness Sanctuary',
        });
      });
    }

    const calendarString = buildRfc5545IcalString(spaceTitle, eventsList);

    const responseHeaders = {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="nothingness-${space?.slug || 'calendar'}.ics"`,
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
