import { SupabaseClient } from '@supabase/supabase-js';

export interface ParsedIcalEvent {
  uid: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  summary: string;
  description?: string;
}

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

/**
 * Extracts a strict YYYY-MM-DD date string from any iCal date value.
 * Avoids any timezone shift / JavaScript Date local-offset corruption.
 */
export function parseIcalDateString(str: string): string {
  if (!str) return '';
  const clean = str.trim();
  
  // Match YYYYMMDD directly from string (e.g. "20260825" or "20260825T140000Z")
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // If formatted as YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return '';
}

/**
 * Parses raw RFC 5545 iCalendar text into structured events without timezone shifting.
 */
export function parseIcalRawText(icsContent: string, platform: string = 'external'): ParsedIcalEvent[] {
  // Normalize RFC 5545 line folding (lines beginning with space or tab are continuations)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const events: ParsedIcalEvent[] = [];
  let currentEvent: Partial<ParsedIcalEvent> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (currentEvent && currentEvent.startDate && currentEvent.endDate) {
        const uid = currentEvent.uid || `event-${currentEvent.startDate}-${currentEvent.endDate}-${Math.random().toString(36).slice(2, 8)}`;
        
        let summary = currentEvent.summary || 'Reserved';
        const description = currentEvent.description || '';

        // Extract Airbnb reservation code and guest phone if present
        const resCodeMatch = description.match(/reservations\/details\/([A-Z0-9]+)/i);
        const phoneMatch = description.match(/Phone Number[^\n]*?:\s*(\d+)/i) || description.match(/(\d{4})\s*$/);
        const resCode = resCodeMatch ? resCodeMatch[1] : null;
        const phone = phoneMatch ? phoneMatch[1] : null;

        if (platform.toLowerCase().includes('airbnb')) {
          if (resCode && phone) {
            summary = `Airbnb: #${resCode} (..${phone})`;
          } else if (resCode) {
            summary = `Airbnb: #${resCode}`;
          } else if (summary.toLowerCase().includes('reserved')) {
            summary = 'Airbnb: Reserved';
          }
        } else if (platform.toLowerCase().includes('booking') || platform.toLowerCase().includes('vrbo')) {
          summary = `${platform.toUpperCase()}: ${summary}`;
        } else if (platform.toLowerCase().includes('goibibo') || platform.toLowerCase().includes('mmt')) {
          summary = `MMT: ${summary}`;
        }

        events.push({
          uid,
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate,
          summary,
          description,
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const keyPart = trimmed.slice(0, colonIdx).toUpperCase();
        const value = trimmed.slice(colonIdx + 1);

        if (keyPart.startsWith('DTSTART')) {
          currentEvent.startDate = parseIcalDateString(value);
        } else if (keyPart.startsWith('DTEND')) {
          currentEvent.endDate = parseIcalDateString(value);
        } else if (keyPart === 'SUMMARY') {
          currentEvent.summary = value.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
        } else if (keyPart === 'UID') {
          currentEvent.uid = value.trim();
        } else if (keyPart === 'DESCRIPTION') {
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim();
        }
      }
    }
  }

  return events;
}

export function formatIcalEventDate(dateObj: any): string {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') {
    return parseIcalDateString(dateObj);
  }
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

/**
 * Sync external iCal feeds for all or a specific space.
 * Fetches each active calendar_sync_source, parses the iCal data,
 * upserts active events, and prunes cancelled/deleted FUTURE events while preserving history.
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

  const todayStr = new Date().toISOString().split('T')[0];

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
      const events = parseIcalRawText(icsText, source.platform);

      // Process each parsed event
      for (const event of events) {
        if (!event.startDate || !event.endDate) continue;

        const externalUid = event.uid || `${source.id}-${event.startDate}-${event.endDate}`;
        activeUids.add(externalUid);

        // Upsert into external_blocked_dates using source_id + external_uid for deduplication
        const { error: upsertError } = await supabase
          .from('external_blocked_dates')
          .upsert(
            {
              space_id: source.space_id,
              source_id: source.id,
              start_date: event.startDate,
              end_date: event.endDate,
              summary: event.summary,
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

      // Prune ONLY future/active stale events (e.g. cancelled bookings)
      // NEVER delete past events (end_date < today) so historical records are kept
      const { data: existingDates } = await supabase
        .from('external_blocked_dates')
        .select('id, external_uid, end_date')
        .eq('source_id', source.id);

      if (existingDates && existingDates.length > 0) {
        const staleFutureIds = existingDates
          .filter(d => d.end_date >= todayStr && !activeUids.has(d.external_uid))
          .map(d => d.id);

        if (staleFutureIds.length > 0) {
          await supabase
            .from('external_blocked_dates')
            .delete()
            .in('id', staleFutureIds);
        }
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

  // Prune abandoned checkouts (> 2 hours old without payment) to keep calendar & DB clean
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .lt('created_at', twoHoursAgo);
  } catch (cleanupErr) {
    console.warn('[Calendar Sync] Abandoned checkouts cleanup error:', cleanupErr);
  }

  return result;
}

