import ical from 'node-ical'
import { createClient } from '@/lib/supabase/server'

export async function syncIcal(listingId: string, icalUrl: string, platform: 'airbnb' | 'booking.com' | 'direct') {
  try {
    const supabase = await createClient()

    // 1. Fetch and parse the remote iCal URL
    const events = await ical.async.fromURL(icalUrl)

    // 2. Process each event
    const bookingsToUpsert = []
    
    for (const key in events) {
      if (Object.prototype.hasOwnProperty.call(events, key)) {
        const event = events[key]
        
        // We only care about VEVENT types
        if (event && event.type === 'VEVENT') {
          const vEvent = event as any // Cast to any to bypass strict type checking for node-ical's varied types
          const externalIcalId = vEvent.uid
          
          if (!externalIcalId || !vEvent.start || !vEvent.end) {
            continue
          }

          // In iCal, the end date is exclusive. For booking systems,
          // check-out date is usually the end date.
          const checkIn = (vEvent.start as Date).toISOString().split('T')[0]
          const checkOut = (vEvent.end as Date).toISOString().split('T')[0]
          
          bookingsToUpsert.push({
            listing_id: listingId,
            platform,
            check_in: checkIn,
            check_out: checkOut,
            status: 'blocked', // Assume external calendar events are blocks/confirmed bookings
            external_ical_id: externalIcalId
          })
        }
      }
    }

    if (bookingsToUpsert.length === 0) return { success: true, count: 0 }

    // 3. Upsert into database
    // We use external_ical_id to prevent duplicates
    for (const booking of bookingsToUpsert) {
      // Supabase standard JS client upsert with onConflict requires a unique constraint
      // Our schema has external_ical_id UNIQUE, so we can use onConflict.
      const { error } = await supabase
        .from('bookings')
        .upsert(booking, { onConflict: 'external_ical_id' })

      if (error) {
        console.error(`Error upserting booking ${booking.external_ical_id}:`, error)
      }
    }

    return { success: true, count: bookingsToUpsert.length }

  } catch (error: any) {
    console.error(`Error syncing iCal from ${icalUrl}:`, error)
    return { success: false, error: error.message }
  }
}
