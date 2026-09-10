import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ unread_count: 0, requests_count: 0, has_unread: false });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch unread counts across all active participant conversations
    const { data: participants, error: pError } = await adminSupabase
      .from('kinkster_conversation_participants')
      .select('unread_count, status')
      .eq('user_id', user.id)
      .eq('is_hidden', false);

    if (pError) {
      console.error('Error fetching unread messages count:', pError);
    }

    let totalUnread = 0;
    let totalRequests = 0;

    for (const p of participants || []) {
      if (p.status === 'active' || p.status === 'muted') {
        totalUnread += (p.unread_count || 0);
      } else if (p.status === 'pending_request') {
        totalRequests += 1;
      }
    }

    const grandTotal = totalUnread + totalRequests;

    return NextResponse.json({
      unread_count: grandTotal,
      messages_unread: totalUnread,
      requests_count: totalRequests,
      has_unread: grandTotal > 0,
    });
  } catch (err: any) {
    console.error('Unread API error:', err);
    return NextResponse.json({ unread_count: 0, requests_count: 0, has_unread: false }, { status: 200 });
  }
}
