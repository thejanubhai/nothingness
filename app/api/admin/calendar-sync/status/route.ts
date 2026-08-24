import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch calendar sync sources
    const { data: sources, error: sourcesErr } = await supabase
      .from('calendar_sync_sources')
      .select(`
        *,
        spaces (id, title, slug)
      `)
      .order('created_at', { ascending: false });

    if (sourcesErr) {
      console.error('Error fetching calendar_sync_sources:', sourcesErr);
    }

    // 2. Fetch external blocked dates count
    const { count: totalBlockedDates, error: countErr } = await supabase
      .from('external_blocked_dates')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.error('Error counting external_blocked_dates:', countErr);
    }

    // 3. Compute stats
    const totalSources = sources?.length || 0;
    const activeSources = sources?.filter(s => s.is_active)?.length || 0;
    const errorSources = sources?.filter(s => s.sync_status === 'error')?.length || 0;
    const successSources = sources?.filter(s => s.sync_status === 'success')?.length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalSources,
        activeSources,
        successSources,
        errorSources,
        totalBlockedDates: totalBlockedDates || 0,
        lastCronCheck: new Date().toISOString(),
      },
      sources: sources || [],
    });

  } catch (error: any) {
    console.error('Failed to fetch calendar sync status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
