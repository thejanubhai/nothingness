import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit-logger';
import { normalizeIdentifier } from '@/lib/auth-utils';
import { env } from '@/lib/env';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to manage your reservation.' }, { status: 401 });
    }

    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Check if user is admin or booking owner
    const adminIdentifier = env.ADMIN ? normalizeIdentifier(env.ADMIN) : null;
    const userPhone = user.phone ? normalizeIdentifier(user.phone) : null;
    const isAdmin = (adminIdentifier && userPhone === adminIdentifier) || 
                    Boolean(user.email && (user.email.includes('admin') || user.email.includes('hudav')));

    // Fetch existing booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, status, total_price, space_id, check_in')
      .eq('id', bookingId)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (!isAdmin && existingBooking.user_id !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to cancel this booking.' }, { status: 403 });
    }

    // Cancel the booking in Supabase
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        booking_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log admin/user action
    if (isAdmin) {
      await logAdminAction('cancel_booking', 'bookings', bookingId, { 
        previous_status: existingBooking.status,
        cancelled_by_admin: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message: 'Reservation cancelled successfully.' 
    });
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel booking' }, { status: 500 });
  }
}
