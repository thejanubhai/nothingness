import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPayUPaymentRequestAsync } from '@/lib/payu';
import { isUserAdminAsync } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminSupabase = createAdminClient();

    // Fetch booking details
    const { data: booking, error: bookingError } = await adminSupabase
      .from('bookings')
      .select('*, spaces(id, title, nightly_price, cleaning_fee)')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Verify permission: logged in owner OR admin OR phone match
    if (user) {
      const isAdmin = await isUserAdminAsync(user);
      if (!isAdmin && booking.user_id && booking.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized to retry payment for this reservation' }, { status: 403 });
      }
    }

    if (booking.payment_status === 'paid') {
      return NextResponse.json({
        error: 'This reservation is already paid and confirmed.',
        alreadyPaid: true,
      }, { status: 400 });
    }

    // Check if dates are still available or blocked in the calendar by another reservation
    const checkInDate = new Date(booking.check_in);
    const checkOutDate = new Date(booking.check_out);
    const reqStart = checkInDate.getTime();
    const reqEnd = checkOutDate.getTime();

    const { getBlockedIntervals } = await import('@/app/actions/calendar');
    const blockedIntervals = await getBlockedIntervals(booking.space_id);

    // Overlap check excluding this current booking
    const isOverlap = blockedIntervals.some((interval: any) => {
      if (interval.bookingId === booking.id) return false;
      const bStart = new Date(interval.start).getTime();
      const bEnd = new Date(interval.end).getTime();
      return reqStart < bEnd && reqEnd > bStart;
    });

    if (isOverlap) {
      return NextResponse.json({
        error: 'The requested stay dates are no longer available. Please select another date range.',
        datesUnavailable: true,
      }, { status: 409 });
    }

    // Generate fresh PayU order ID
    const newOrderId = `order_${Date.now()}`;
    const payableAmount = Number(booking.total_price);
    const spaceTitle = (booking.spaces as any)?.title || 'Sanctuary';

    const cleanPhone = (booking.guest_phone || '9999999999').replace(/[^0-9]/g, '');
    const customerPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '9999999999';
    const customerName = (booking.guest_name || 'Nothingness Guest').trim();
    const customerEmail = booking.guest_email || 'concierge@nothingness.asia';

    // Generate PayU payment request
    const { paymentUrl, params: payuParams } = await createPayUPaymentRequestAsync({
      txnid: newOrderId,
      amount: payableAmount,
      productinfo: `Sanctuary Stay - ${spaceTitle}`,
      firstname: customerName,
      email: customerEmail,
      phone: customerPhone,
      udf1: booking.id,
      udf2: 'primary_stay',
      udf3: booking.user_id || '',
      udf4: spaceTitle,
    });

    // Reset booking state to pending with new order ID
    await adminSupabase
      .from('bookings')
      .update({
        payment_order_id: newOrderId,
        payment_status: 'pending',
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    return NextResponse.json({
      success: true,
      orderId: newOrderId,
      paymentUrl,
      params: payuParams,
      bookingId: booking.id,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Booking Retry Payment Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to retry payment' }, { status: 500 });
  }
}
