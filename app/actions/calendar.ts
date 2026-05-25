'use server';

import ical from 'node-ical';
import { createClient } from '@/lib/supabase/server';

export async function getBlockedIntervals(propertyId: string, iCalUrl?: string | null) {
  const supabase = await createClient();
  const intervals: { start: string, end: string }[] = [];

  // 1. Fetch internal bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .neq('booking_status', 'cancelled');

  if (bookings) {
    bookings.forEach(b => {
      intervals.push({ start: b.check_in, end: b.check_out });
    });
  }

  // 2. Fetch external Airbnb iCal if URL is provided
  if (iCalUrl) {
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
