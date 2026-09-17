import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdmin } from '@/lib/auth-utils';
import { sendPushNotificationToUser } from '@/lib/webpush';
import { checkAndPromoteWaitlistedCandidates } from '@/lib/events/ratio-balancer';
import { logAdminAction } from '@/lib/audit-logger';

async function checkAdminAuth(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return isUserAdmin(user);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdminAuth(supabase))) {
      return NextResponse.json({ error: 'Unauthorized. Admin required.' }, { status: 403 });
    }

    const { applicationId, newStatus, customDeadlineHours } = await req.json();

    if (!applicationId || !newStatus) {
      return NextResponse.json({ error: 'applicationId and newStatus are required.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    let deadline = null;
    if (newStatus === 'approved_payment_pending') {
      const hours = customDeadlineHours || 4;
      deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }

    const { data: updatedApp, error } = await adminClient
      .from('sanctuary_event_applications')
      .update({
        status: newStatus,
        payment_deadline: deadline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select('*, sanctuary_events(title)')
      .single();

    if (error || !updatedApp) {
      return NextResponse.json({ error: error?.message || 'Application not found' }, { status: 500 });
    }

    // Re-balance ratios if status changed
    await checkAndPromoteWaitlistedCandidates(updatedApp.event_id).catch(console.error);

    // Dispatch WebPush
    if (newStatus === 'approved_payment_pending') {
      await sendPushNotificationToUser(updatedApp.user_id, {
        title: '✨ Sanctuary Pass Approved!',
        body: `Your pass for "${updatedApp.sanctuary_events?.title || 'Sanctuary Gathering'}" has been approved. Complete checkout to lock your spot.`,
        url: `/sanctuary-pass?eventId=${updatedApp.event_id}`,
      });
    } else if (newStatus === 'rejected') {
      await sendPushNotificationToUser(updatedApp.user_id, {
        title: 'Application Update',
        body: `Your application for "${updatedApp.sanctuary_events?.title || 'Sanctuary Gathering'}" could not be accommodated at this time.`,
        url: '/sanctuary-pass',
      });
    }

    await logAdminAction(
      `event_curation_${newStatus}`,
      'sanctuary_event_applications',
      applicationId,
      { event_id: updatedApp.event_id, new_status: newStatus }
    );

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
