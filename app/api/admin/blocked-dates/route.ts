import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: blockedDates, error } = await supabase
      .from('external_blocked_dates')
      .select('*, spaces(id, title, slug)')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, blockedDates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { space_id, start_date, end_date, summary } = body;

    if (!space_id || !start_date || !end_date) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('external_blocked_dates')
      .insert({
        space_id,
        start_date,
        end_date,
        summary: summary || 'Maintenance / Private Stay',
        external_uid: `manual-${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, blockedDate: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('external_blocked_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
