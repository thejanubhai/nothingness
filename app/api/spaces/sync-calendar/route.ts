import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import ical from 'node-ical';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { space_id } = body;

    const supabase = await createClient();

    // 1. Fetch active sync sources
    let query = supabase
      .from('calendar_sync_sources')
      .select('*')
      .eq('is_active', true);
      
    if (space_id) {
      query = query.eq('space_id', space_id);
    }

    const { data: sources, error: sourcesError } = await query;

    if (sourcesError) {
      throw new Error(`Failed to fetch sync sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({ success: true, synced: 0, errors: 0, message: 'No active sync sources found' });
    }

    let syncedCount = 0;
    let errorCount = 0;

    // 2. Process each source
    for (const source of sources) {
      try {
        const events = await ical.async.fromURL(source.inbound_ical_url);
        
        const blockedDates = [];
        for (const event of Object.values(events)) {
          if (event && event.type === 'VEVENT' && event.start && event.end) {
            blockedDates.push({
              space_id: source.space_id,
              source_id: source.id,
              start_date: event.start.toISOString(),
              end_date: event.end.toISOString(),
              summary: event.summary || 'External Booking',
              external_uid: event.uid || crypto.randomUUID(), // Use uid if available, otherwise generate
            });
          }
        }

        // 3. Upsert blocked dates
        if (blockedDates.length > 0) {
          const { error: upsertError } = await supabase
            .from('external_blocked_dates')
            .upsert(blockedDates, { 
              onConflict: 'source_id,external_uid',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            console.error(`Upsert error for source ${source.id}:`, upsertError);
            throw upsertError;
          }
        }

        // 4. Update status
        await supabase
          .from('calendar_sync_sources')
          .update({ 
            last_synced_at: new Date().toISOString(), 
            sync_status: 'synced',
            sync_error: null 
          })
          .eq('id', source.id);
          
        syncedCount++;
      } catch (err: any) {
        console.error(`Sync error for source ${source.id}:`, err);
        errorCount++;
        
        // Update error status
        await supabase
          .from('calendar_sync_sources')
          .update({ 
            sync_status: 'error',
            sync_error: err.message || 'Unknown error during iCal fetch' 
          })
          .eq('id', source.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      synced: syncedCount, 
      errors: errorCount 
    });

  } catch (error: any) {
    console.error('Calendar Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
