import { createClient } from "@/lib/supabase/server";
import ICalSyncMonitor from "@/components/admin/ICalSyncMonitor";

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  const supabase = await createClient();

  // Initial SSR fetch of sync sources & stats
  const { data: sources } = await supabase
    .from('calendar_sync_sources')
    .select(`
      *,
      spaces (id, title, slug)
    `)
    .order('updated_at', { ascending: false });

  const { count: totalBlockedDates } = await supabase
    .from('external_blocked_dates')
    .select('*', { count: 'exact', head: true });

  const totalSources = sources?.length || 0;
  const activeSources = sources?.filter(s => s.is_active)?.length || 0;
  const errorSources = sources?.filter(s => s.sync_status === 'error')?.length || 0;
  const successSources = sources?.filter(s => s.sync_status === 'success')?.length || 0;

  const initialData = {
    stats: {
      totalSources,
      activeSources,
      successSources,
      errorSources,
      totalBlockedDates: totalBlockedDates || 0,
      lastCronCheck: new Date().toISOString(),
    },
    sources: sources || [],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Calendar Sync Monitoring</h1>
        <p className="text-white/50 text-sm tracking-wide">
          Manage and monitor external iCal feeds (Airbnb, Vrbo, Booking.com, Google) to prevent double bookings.
        </p>
      </div>

      <ICalSyncMonitor initialData={initialData} />
    </div>
  );
}
