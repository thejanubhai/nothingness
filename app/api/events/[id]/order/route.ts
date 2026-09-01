import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayUPaymentRequest } from '@/lib/payu';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch Event
    const { data: event, error: eventErr } = await adminClient
      .from('sanctuary_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Gathering not found' }, { status: 404 });
    }

    // 2. Fetch User Application
    const { data: app, error: appErr } = await adminClient
      .from('sanctuary_event_applications')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (appErr || !app) {
      return NextResponse.json({ error: 'No application found for this event' }, { status: 404 });
    }

    if (!['approved_payment_pending', 'confirmed'].includes(app.status)) {
      return NextResponse.json(
        { error: `Application is currently ${app.status}. Pass can only be purchased once approved.` },
        { status: 403 }
      );
    }

    // Calculate price by category
    let ticketPrice = event.price_couples || 3999;
    if (app.category === 'single_female') ticketPrice = event.price_females || 1499;
    else if (app.category === 'single_male') ticketPrice = event.price_males || 4999;
    else if (app.category === 'non_binary') ticketPrice = event.price_nonbinary || 1999;

    const txnid = `evtticket_${Date.now()}_${user.id.slice(0, 4)}`;

    const { data: guestProfile } = await adminClient
      .from('guest_profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSyntheticEmail = Boolean(user.email && user.email.includes('@auth.nothingness'));
    const rawPhone = user.phone
      ? user.phone.replace(/[^0-9]/g, '')
      : guestProfile?.phone
      ? guestProfile.phone.replace(/[^0-9]/g, '')
      : '9999999999';
    const customerPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';
    const customerName = guestProfile?.full_name || user.user_metadata?.full_name || 'Sanctuary Member';
    const customerEmail = isSyntheticEmail ? 'hospitality@nothingness.asia' : user.email || 'hospitality@nothingness.asia';

    const { paymentUrl, params: payuParams } = createPayUPaymentRequest({
      txnid,
      amount: ticketPrice,
      productinfo: `Private Hospitality Pass #${event.id.slice(0, 8)}`,
      firstname: customerName,
      email: customerEmail,
      phone: customerPhone,
      udf1: app.id,
      udf2: 'event_ticket_fee',
      udf3: event.id,
      udf4: String(ticketPrice),
      udf5: user.id,
    });

    return NextResponse.json({
      success: true,
      orderId: txnid,
      amount: ticketPrice,
      paymentUrl,
      params: payuParams,
    });
  } catch (err: any) {
    console.error('Event Ticket Order Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
