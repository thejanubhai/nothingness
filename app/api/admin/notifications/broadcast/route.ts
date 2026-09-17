import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { broadcastPushNotificationToAllSubscribers } from '@/lib/webpush';
import { logAdminAction } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, message, url } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title and message body are required for push broadcast.' },
        { status: 400 }
      );
    }

    const broadcastResult = await broadcastPushNotificationToAllSubscribers({
      title: title.trim(),
      body: message.trim(),
      url: url?.trim() || '/',
      tag: `admin-broadcast-${Date.now()}`,
    });

    if (!broadcastResult.success) {
      return NextResponse.json(
        { success: false, error: 'Broadcast failed to execute on server.' },
        { status: 500 }
      );
    }

    // Log to admin audit ledger
    await logAdminAction(
      'push_broadcast_dispatched',
      'web_push',
      null,
      {
        title: title.trim(),
        totalSent: broadcastResult.totalSent,
        totalFailed: broadcastResult.totalFailed,
      }
    );

    return NextResponse.json({
      success: true,
      totalSent: broadcastResult.totalSent,
      totalFailed: broadcastResult.totalFailed,
      message: `Push broadcast delivered to ${broadcastResult.totalSent} active device(s).`,
    });
  } catch (err: any) {
    console.error('[Admin Push Broadcast Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
