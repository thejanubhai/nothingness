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

  return <AdminGuestProfileClient initialGuest={guest as any} />;
}
