import ical from 'node-ical';
import { SupabaseClient } from '@supabase/supabase-js';

interface SyncSource {
  id: string;
  space_id: string;
  platform: string;
  inbound_ical_url: string;
  is_active: boolean;
}

interface SyncResult {
  synced: number;
  errors: number;
  details: Array<{
    source_id: string;
    space_id: string;
    platform: string;
    status: 'success' | 'error';
    events_upserted: number;
    error?: string;
  }>;
}

export function formatIcalEventDate(dateObj: any): string {
  if (!dateObj) return '';
  
  if (dateObj.dateOnly || dateObj.datetype === 'date') {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    if ((dateObj as any).dateOnly) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateObj.toISOString().split('T')[0];
  }

  if (typeof dateObj === 'string') {
    const clean = dateObj.replace(/[^0-9]/g, '');
    if (clean.length >= 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
    }
  }

  return '';
}

/**
 * Sync external iCal feeds for all or a specific space.
 * Fetches each active calendar_sync_source, parses the iCal data,
 * upserts active events, and prunes cancelled/deleted events.
 */
export async function syncCalendars(
  supabase: SupabaseClient,
  spaceId?: string
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, errors: 0, details: [] };

  // 1. Fetch active sync sources
  let query = supabase
    .from('calendar_sync_sources')
    .select('id, space_id, platform, inbound_ical_url, is_active')
    .eq('is_active', true);

  if (spaceId) {
    query = query.eq('space_id', spaceId);
  }

  const { data: sources, error: sourcesError } = await query;

  if (sourcesError) {
    throw new Error(`Failed to fetch sync sources: ${sourcesError.message}`);
  }

  if (!sources || sources.length === 0) {
    return result;
  }

  // 2. Process each source
  for (const source of sources as SyncSource[]) {
    let eventsUpserted = 0;
    const activeUids = new Set<string>();

    try {
      if (!source.inbound_ical_url || source.inbound_ical_url.includes('YOUR_HASH_HERE')) {
        throw new Error('Please configure a valid .ics URL (replace placeholder with your real Airbnb export link)');
      }

      // Fetch iCal feed with proper headers
      const res = await fetch(source.inbound_ical_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NothingnessCalendarSync/1.0',
          'Accept': 'text/calendar,text/plain,*/*',
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error(`Remote calendar returned status ${res.status}: ${res.statusText}`);
      }

      const icsText = await res.text();
      const events = ical.sync.parseICS(icsText);

      // Process each VEVENT
      for (const [, event] of Object.entries(events)) {
        if (!event || event.type !== 'VEVENT') continue;

        const vevent = event as ical.VEvent;
        if (!vevent.start || !vevent.end) continue;

        const startDate = formatIcalEventDate(vevent.start);
        const endDate = formatIcalEventDate(vevent.end);
        if (!startDate || !endDate) continue;

        const externalUid = vevent.uid || `${source.id}-${startDate}-${endDate}`;
        const summary = vevent.summary || 'Reserved (External)';

        activeUids.add(externalUid);

        // Upsert into external_blocked_dates using source_id + external_uid for deduplication
        const { error: upsertError } = await supabase
          .from('external_blocked_dates')
          .upsert(
            {
              space_id: source.space_id,
              source_id: source.id,
              start_date: startDate,
              end_date: endDate,
              summary,
              external_uid: externalUid,
            },
            {
              onConflict: 'source_id,external_uid',
            }
          );

        if (upsertError) {
          console.error(
            `Failed to upsert event ${externalUid} for source ${source.id}:`,
            upsertError.message
          );
          continue;
        }

        eventsUpserted++;
      }

      // Prune stale / cancelled events for this source
      if (activeUids.size > 0) {
        // Fetch all existing external_blocked_dates for this source
        const { data: existingDates } = await supabase
          .from('external_blocked_dates')
          .select('id, external_uid')
          .eq('source_id', source.id);

        if (existingDates) {
          const staleIds = existingDates
            .filter(d => !activeUids.has(d.external_uid))
            .map(d => d.id);

          if (staleIds.length > 0) {
            await supabase
              .from('external_blocked_dates')
              .delete()
              .in('id', staleIds);
          }
        }
      } else {
        // If feed returned 0 events, clean up all previous external blocked dates for this source
        await supabase
          .from('external_blocked_dates')
          .delete()
          .eq('source_id', source.id);
      }

      // Update source status to synced
      await supabase
        .from('calendar_sync_sources')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
          sync_error: null,
        })
        .eq('id', source.id);

      result.synced++;
      result.details.push({
        source_id: source.id,
        space_id: source.space_id,
        platform: source.platform,
        status: 'success',
        events_upserted: eventsUpserted,
      });
    } catch (syncError: unknown) {
      const errorMessage =
        syncError instanceof Error ? syncError.message : 'Unknown sync error';

      // Update source status to error
      await supabase
        .from('calendar_sync_sources')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: 'error',
          sync_error: errorMessage,
        })
        .eq('id', source.id);

      result.errors++;
      result.details.push({
        source_id: source.id,
        space_id: source.space_id,
        platform: source.platform,
        status: 'error',
        events_upserted: eventsUpserted,
        error: errorMessage,
      });

      console.error(
        `Calendar sync error for source ${source.id} (${source.platform}):`,
        errorMessage
      );
    }
  }

  return result;
}
