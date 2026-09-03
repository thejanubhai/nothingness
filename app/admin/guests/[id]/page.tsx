import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminGuestProfileClient from "@/components/admin/AdminGuestProfileClient";

export const dynamic = 'force-dynamic';

export default async function GuestProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: guest } = await supabase
    .from('guest_profiles')
    .select(`
      *,
      booking_guests (
        bookings (id, check_in, check_out, total_price, status, spaces(title))
      )
    `)
    .eq('id', id)
    .single();

  if (!guest) {
    notFound();
  }

  const effectiveUserId = guest.user_id || guest.id;

  // Fetch Sanctuary Pass
  const { data: sanctuaryPass } = await supabase
    .from('sanctuary_passes')
    .select('*')
    .or(`guest_profile_id.eq.${id},user_id.eq.${effectiveUserId},user_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch Kinkster Profile
  const { data: kinksterProfile } = await supabase
    .from('kinkster_profiles')
    .select('*')
    .or(`id.eq.${effectiveUserId},guest_profile_id.eq.${id},id.eq.${id}`)
    .limit(1)
    .maybeSingle();

  return (
    <AdminGuestProfileClient 
      initialGuest={guest as any} 
      initialSanctuaryPass={sanctuaryPass}
      initialKinksterProfile={kinksterProfile}
    />
  );
}
