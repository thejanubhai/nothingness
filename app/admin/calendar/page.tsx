import { createClient } from "@/lib/supabase/server";
import UnifiedCalendarClient from "@/components/admin/UnifiedCalendarClient";

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  const supabase = await createClient();

  // 1. Fetch active spaces
  const { data: spaces } = await supabase
    .from('spaces')
    .select('id, title, slug, nightly_price, featured_image')
    .order('created_at', { ascending: false });

  // 2. Fetch all bookings with spaces and guests
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, space_id, check_in, check_out, status, payment_status, total_price, guests, user_id,
      spaces (id, title, slug),
      booking_guests (
        name,
        guest_profiles (full_name, phone_number, document_number)
      )
    `)
    .order('check_in', { ascending: true });

  // 3. Fetch all external/internal blocked dates
  const { data: blockedDates } = await supabase
    .from('external_blocked_dates')
    .select(`
      id, space_id, start_date, end_date, summary,
      spaces (id, title, slug)
    `)
    .order('start_date', { ascending: true });

  // 4. Fetch all calendar sync sources
  const { data: syncSources } = await supabase
    .from('calendar_sync_sources')
    .select(`
      id, space_id, platform, inbound_ical_url, is_active, last_synced_at, sync_status, sync_error,
      spaces (id, title, slug)
    `)
    .order('created_at', { ascending: false });

  return (
    <UnifiedCalendarClient
      initialSpaces={spaces || []}
      initialBookings={(bookings as any) || []}
      initialBlockedDates={(blockedDates as any) || []}
      initialSyncSources={(syncSources as any) || []}
    />
  );
}
