import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAndPromoteWaitlistedCandidates } from '@/lib/events/ratio-balancer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Update application to dropped_out
    const { data: app, error } = await adminClient
      .from('sanctuary_event_applications')
      .update({
        status: 'dropped_out',
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Immediately trigger auto-balancer to promote the next candidate!
    await checkAndPromoteWaitlistedCandidates(eventId);

    return NextResponse.json({
      success: true,
      message: 'Slot released. No refund issued as per strict sanctuary policy.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
