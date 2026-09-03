'use server';

import { createClient } from '@/lib/supabase/server';
import { parseIcalRawText } from '@/lib/calendar-sync';

export async function getBlockedIntervals(spaceId: string, iCalUrl?: string | null) {
  const supabase = await createClient();
  const intervals: { start: string, end: string }[] = [];

  // 1. Fetch internal bookings (exclude cancelled and unpaid abandoned checkouts)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out, status, payment_status, created_at')
    .eq('space_id', spaceId)
    .neq('status', 'cancelled');

  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  if (bookings) {
    bookings.forEach(b => {
      if (b.status === 'pending') {
        const isPaid = b.payment_status === 'completed';
        const isRecentCheckout = b.created_at && b.created_at >= thirtyMinsAgo;
        if (!isPaid && !isRecentCheckout) {
          return; // Skip abandoned checkout
        }
      }
      intervals.push({ start: b.check_in.split('T')[0], end: b.check_out.split('T')[0] });
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
      const res = await fetch(iCalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NothingnessCalendarSync/1.0',
          'Accept': 'text/calendar,text/plain,*/*',
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const icsText = await res.text();
        const events = parseIcalRawText(icsText);
        for (const event of events) {
          if (event.startDate && event.endDate) {
            intervals.push({ 
              start: event.startDate, 
              end: event.endDate 
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse iCal fallback:', e);
    }
  }

  return intervals;
}

