import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayUPaymentRequest } from '@/lib/payu';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      guests, 
      spaceId, 
      checkIn, 
      checkOut, 
      additionalGuests = [], 
      additionalGuestPaymentMode = 'primary_pays' 
    } = body;

    if (!spaceId || !checkIn || !checkOut || !guests) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to book.' }, { status: 401 });
    }

    // Verify space exists and get actual price to prevent tampering
    const { data: space, error: propError } = await supabase
      .from('spaces')
      .select('id, title, nightly_price, default_guests, max_guests, additional_guest_fee, cleaning_fee')
      .eq('id', spaceId)
      .single();

    if (propError || !space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Verify requested dates are not blocked by direct booking or Airbnb sync
    const { getBlockedIntervals } = await import('@/app/actions/calendar');
    const blockedIntervals = await getBlockedIntervals(spaceId);
    const reqStart = checkInDate.getTime();
    const reqEnd = checkOutDate.getTime();

    const isOverlap = blockedIntervals.some((interval) => {
      const bStart = new Date(interval.start).getTime();
      const bEnd = new Date(interval.end).getTime();
      return reqStart < bEnd && reqEnd > bStart;
    });

    if (isOverlap) {
      return NextResponse.json(
        { error: 'These stay dates are no longer available. Please select another date range.' },
        { status: 409 }
      );
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    
    // Space guest policy calculations
    const defaultGuests = space.default_guests || 2;
    const additionalGuestFeePerNight = space.additional_guest_fee || 500;
    const cleaningFee = space.cleaning_fee || 2500;
    
    const extraGuestCount = Math.max(0, guests - defaultGuests);
    const extraGuestTotal = extraGuestCount * additionalGuestFeePerNight * nights;
    const baseStayTotal = (space.nightly_price * nights) + cleaningFee;

    // Per extra guest share
    const perGuestFeeWithTax = extraGuestCount > 0 
      ? Math.round((additionalGuestFeePerNight * nights) * 1.18) 
      : 0;

    // Primary payable amount depends on whether primary pays for extra guests or guests pay themselves
    let primaryPayableAmount = 0;
    if (additionalGuestPaymentMode === 'primary_pays') {
      primaryPayableAmount = Math.round((baseStayTotal + extraGuestTotal) * 1.18);
    } else {
      // Split self-pay: Primary only pays base stay + cleaning + GST
      primaryPayableAmount = Math.round(baseStayTotal * 1.18);
    }

    const orderId = `order_${Date.now()}`;
    const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : "9999999999";
    const customerPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : "9999999999";
    const primaryName = user.user_metadata?.full_name || "Nothingness Guest";

    // Save preliminary booking to Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        space_id: spaceId,
        user_id: user.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        default_guests: defaultGuests,
        additional_guests_count: extraGuestCount,
        additional_guest_fee_per_night: additionalGuestFeePerNight,
        additional_guest_total_amount: extraGuestTotal,
        additional_guest_payment_mode: additionalGuestPaymentMode,
        base_price: space.nightly_price,
        total_price: primaryPayableAmount,
        guest_name: primaryName,
        guest_phone: customerPhone,
        guest_email: user.email || null,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'PayU',
        payment_order_id: orderId
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking Error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 });
    }

    // Generate PayU payment parameters & cryptographic hash
    const { paymentUrl, params } = createPayUPaymentRequest({
      txnid: orderId,
      amount: primaryPayableAmount,
      productinfo: `Sanctuary Stay - ${space.title}`,
      firstname: primaryName,
      email: user.email || 'concierge@nothingness.asia',
      phone: customerPhone,
      udf1: booking.id,
      udf2: 'primary_stay',
      udf3: user.id,
      udf4: space.title,
    });

    // Create booking_guests entries (Guest 0 = Primary, Guest 1..N = Additional)
    const guestEntries = [];
    
    // Primary guest entry
    guestEntries.push({
      booking_id: booking.id,
      guest_index: 0,
      name: primaryName,
      phone: customerPhone,
      is_primary: true,
      verification_status: 'pending',
      payment_status: 'not_required',
      payment_amount: 0
    });

    // Additional guests entries
    for (let i = 0; i < extraGuestCount; i++) {
      const extraGuestInfo = additionalGuests[i] || {};
      const isSelfPay = additionalGuestPaymentMode === 'split_self_pay';
      
      guestEntries.push({
        booking_id: booking.id,
        guest_index: i + 1,
        name: extraGuestInfo.name || `Guest ${i + 2}`,
        phone: extraGuestInfo.phone || '',
        is_primary: false,
        verification_status: 'pending',
        payment_status: isSelfPay ? 'pending' : 'not_required',
        payment_amount: isSelfPay ? perGuestFeeWithTax : 0
      });
    }

    const { error: guestsError } = await supabase
      .from('booking_guests')
      .insert(guestEntries);

    if (guestsError) {
      console.error('Booking Guests Error:', guestsError);
    }

    return NextResponse.json({ 
      success: true,
      orderId: orderId, 
      paymentUrl: paymentUrl,
      params: params,
      bookingId: booking.id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
