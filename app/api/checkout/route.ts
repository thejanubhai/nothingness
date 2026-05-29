import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { propertyId, checkIn, checkOut, amount } = body;

    if (!propertyId || !checkIn || !checkOut || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify property exists and get actual price to prevent tampering
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('nightly_price')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Amount should be calculated server-side normally, but for now we trust the amount passed
    // Or we recalculate:
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    
    // Base price + 2500 cleaning + 18% GST
    const baseTotal = (property.nightly_price * nights) + 2500;
    const finalAmount = Math.round(baseTotal * 1.18); // Including GST

    // Create Razorpay Order
    const options = {
      amount: finalAmount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save preliminary booking to Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        property_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        total_price: finalAmount,
        status: 'pending',
        payment_order_id: order.id
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking Error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking record' }, { status: 500 });
    }

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      bookingId: booking.id 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
