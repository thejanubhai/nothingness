import { createClient } from "@/lib/supabase/server";
import AdminBookingsClient from "@/components/admin/AdminBookingsClient";

export const dynamic = 'force-dynamic';

export default async function AdminBookings() {
  const supabase = await createClient();
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, space_id, check_in, check_out, total_price, status, payment_status, 
      guest_name, guest_email, guest_phone, guests, default_guests, 
      additional_guests_count, additional_guest_payment_mode, additional_guest_total_amount, created_at,
      spaces (title),
      booking_guests (
        id, name, phone, verification_status, guest_index, payment_status, payment_amount, paid_at, is_primary,
        guest_profiles (document_number, full_name, is_verified, phone_number)
      )
    `)
    .order('created_at', { ascending: false });

  return <AdminBookingsClient initialBookings={(bookings as any) || []} />;
}
