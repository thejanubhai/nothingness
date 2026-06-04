'use server';

import ical from 'node-ical';
import { createClient } from '@/lib/supabase/server';

export async function getBlockedIntervals(spaceId: string, iCalUrl?: string | null) {
  const supabase = await createClient();
  const intervals: { start: string, end: string }[] = [];

  // 1. Fetch internal bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('space_id', spaceId)
    .neq('status', 'cancelled');

  if (bookings) {
    bookings.forEach(b => {
      intervals.push({ start: b.check_in, end: b.check_out });
    });
  }

  // 2. Fetch external blocked dates from synced calendars (from DB)
  const { data: externalDates } = await supabase
    .from('external_blocked_dates')
    .select('start_date, end_date')
    .eq('space_id', spaceId);

  if (externalDates) {
    externalDates.forEach(d => {
      intervals.push({ start: d.start_date, end: d.end_date });
    });
  }

  // 3. Fallback: live-fetch Airbnb iCal if URL is provided and no synced sources exist
  // This handles the legacy case where airbnb_ical_url is set but no sync source exists yet
  if (iCalUrl && (!externalDates || externalDates.length === 0)) {
    try {
      const events = await ical.async.fromURL(iCalUrl);
      for (const event of Object.values(events)) {
        if (event && event.type === 'VEVENT' && event.start && event.end) {
          intervals.push({ 
            start: event.start.toISOString().split('T')[0], 
            end: event.end.toISOString().split('T')[0] 
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse iCal:', e);
    }
  }

  return intervals;
}
