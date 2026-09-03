import { createClient } from "@/lib/supabase/server";
import AdminGuestsClient from "@/components/admin/AdminGuestsClient";

export const dynamic = 'force-dynamic';

export default async function AdminGuests() {
  const supabase = await createClient();
  
  // Fetch Guest Profiles with booking history
  const { data: guests } = await supabase
    .from('guest_profiles')
    .select(`
      id, full_name, phone_number, id_document_type, document_number, is_verified, in_person_vetted,
      permanent_address, dob, is_foreign_national, verification_timestamp, created_at,
      id_front_url, id_back_url, photo_url, id_document_url, face_id_vetted, live_face_url,
      booking_guests (
        bookings (id, check_in, check_out, spaces(title))
      )
    `)
    .order('created_at', { ascending: false });

  return <AdminGuestsClient initialGuests={(guests as any) || []} />;
}
