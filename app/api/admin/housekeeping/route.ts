import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { space_id, scheduled_date, description, assigned_to } = body;

    if (!space_id || !scheduled_date) {
      return NextResponse.json({ success: false, error: 'Space and date are required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('housekeeping_tasks')
      .insert({
        space_id,
        scheduled_date,
        description: description || 'Scheduled Sanctuary Cleaning',
        assigned_to: assigned_to || 'Housekeeping Team',
        status: 'pending',
        task_type: 'turnover'
      })
      .select('*, spaces(title, cleaner_name, cleaner_phone)')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { id, status, ai_cleanliness_score } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Task ID and status are required' }, { status: 400 });
    }

    const updatePayload: any = { status };
    if (ai_cleanliness_score !== undefined) {
      updatePayload.ai_cleanliness_score = ai_cleanliness_score;
    }

    const { data: task, error } = await supabase
      .from('housekeeping_tasks')
      .update(updatePayload)
      .eq('id', id)
      .select('*, spaces(title, cleaner_name, cleaner_phone)')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
