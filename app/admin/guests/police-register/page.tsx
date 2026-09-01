import { createClient } from "@/lib/supabase/server";
import AdminPoliceRegisterClient from "@/components/admin/AdminPoliceRegisterClient";

export const dynamic = 'force-dynamic';

export default async function PoliceRegisterPage() {
  const supabase = await createClient();

  const { data: guests } = await supabase
    .from('guest_profiles')
    .select(`
      *,
      booking_guests (
        bookings (id, check_in, check_out, spaces(title))
      )
    `)
    .order('verification_timestamp', { ascending: false });

  return <AdminPoliceRegisterClient initialGuests={(guests as any) || []} />;
}
