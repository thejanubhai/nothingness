import { createClient } from "@/lib/supabase/server";
import AdminFinancialsClient from "@/components/admin/AdminFinancialsClient";

export const dynamic = 'force-dynamic';

export default async function AdminFinancials() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, space_id, total_price, status, payment_status, check_in, check_out, created_at,
      spaces (id, title),
      booking_guests (
        name,
        guest_profiles (full_name)
      )
    `)
    .order('created_at', { ascending: false });

  const normalizedBookings = (bookings || []).map((b: any) => {
    const mainGuest = b.booking_guests?.[0];
    const guestName = mainGuest?.guest_profiles?.full_name || mainGuest?.name || 'Direct Guest';
    return {
      ...b,
      guest_name: guestName
    };
  });

  return <AdminFinancialsClient initialBookings={normalizedBookings as any} />;
}
