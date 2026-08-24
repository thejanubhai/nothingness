import { createClient } from "@/lib/supabase/server";
import AdminFinancialsClient from "@/components/admin/AdminFinancialsClient";

export const dynamic = 'force-dynamic';

export default async function AdminFinancials() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, space_id, total_price, status, payment_status, check_in, check_out, created_at, guest_name,
      spaces (id, title),
      guest_profiles (full_name)
    `)
    .order('created_at', { ascending: false });

  return <AdminFinancialsClient initialBookings={(bookings as any) || []} />;
}
