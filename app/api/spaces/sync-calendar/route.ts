import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncCalendars } from '@/lib/calendar-sync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { space_id } = body;

    const supabase = await createClient();
    const result = await syncCalendars(supabase, space_id);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      details: result.details
    });
  } catch (error: any) {
    console.error('Calendar Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
