import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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

    // Verify attendee has a confirmed application for this event
    const { data: app, error: appErr } = await adminClient
      .from('sanctuary_event_applications')
      .select('id, category, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (appErr || !app) {
      return NextResponse.json(
        { error: 'Forbidden. SOS assistance is restricted to confirmed attendees of this gathering.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { alertType, notes, locationHint } = body;

    const alertTypeLabels: Record<string, string> = {
      marshall_assist: 'Discreet Floor Marshall Check-In',
      boundary_alert: 'Consent Boundary Alert',
      escort_request: 'Discreet Escort to Quiet Zone or Exit',
      medical_water: 'Comfort & Hydration Support',
    };

    const typeLabel = alertTypeLabels[alertType] || 'Urgent Marshall Support';

    // Retrieve user alias
    const { data: kp } = await adminClient
      .from('kinkster_profiles')
      .select('alias')
      .eq('id', user.id)
      .maybeSingle();

    const userAlias = kp?.alias || 'Confirmed Guest';

    // Insert alert into gathering_vettings audit trail for on-duty marshalls
    const { error: insertErr } = await adminClient
      .from('gathering_vettings')
      .insert({
        event_id: eventId,
        attendee_id: user.id,
        marshall_id: 'SYSTEM_ALERT',
        marshall_alias: 'Floor Lead Alert Dispatch',
        verification_method: 'sos_alert',
        notes: `[SOS TRIGGERED - ${typeLabel.toUpperCase()}] Alias: @${userAlias} | Category: ${app.category} | Hint: ${locationHint || 'General Floor'} | Notes: ${notes || 'Immediate assistance requested'}`,
      });

    if (insertErr) {
      console.error('Failed to log SOS alert:', insertErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Floor Marshall notified discreetly. A sanctuary safety team member is on their way.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
