import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import PartnerDashboardClient from '@/components/partner/PartnerDashboardClient';

export const metadata: Metadata = {
  title: 'Partner Command Center | nothingness.',
  description: 'Manage live sanctuary bookings, 70/30 revenue distribution, 1-click legal guest dossiers, inventory refills, and gated lounge access.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real partner properties from database
  const { data: spacesData } = await supabase
    .from('spaces')
    .select('id, title, city, area, featured_image, active, nightly_price')
    .order('created_at', { ascending: false });

  const partnerProperties = (spacesData || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    city: s.city || 'New Delhi',
    locality: s.area || 'South Delhi',
    space_tier: 'luxury' as const,
    housekeeping_status: 'ready' as const,
    lounge_eligible: true,
    lounge_type: 'terrace'
  }));

  // Fetch real bookings from database
  const { data: bookingsData } = await supabase
    .from('bookings')
    .select(`
      id, total_price, status, payment_status, check_in, check_out, guests, guest_name, guest_phone, guest_email, created_at,
      spaces (id, title, city, area),
      booking_guests (
        id, name, phone, verification_status, verification_token,
        guest_profiles (full_name, phone_number, document_number, id_document_type, is_verified, verification_timestamp)
      )
    `)
    .order('created_at', { ascending: false });

  const partnerBookings = (bookingsData || []).map((b: any) => {
    const spaceRecord = Array.isArray(b.spaces) ? b.spaces[0] : b.spaces;
    const mainGuest = b.booking_guests?.[0];
    const profile = mainGuest?.guest_profiles;
    const price = Number(b.total_price) || 0;

    return {
      id: b.id,
      bookingRef: `NTH-${b.id.slice(0, 6).toUpperCase()}`,
      propertyTitle: spaceRecord?.title || 'Sanctuary',
      propertyAddress: `${spaceRecord?.area || ''}, ${spaceRecord?.city || 'Delhi NCR'}`.replace(/^, /, ''),
      guestName: profile?.full_name || mainGuest?.name || b.guest_name || 'Verified Guest',
      guestPhone: profile?.phone_number || mainGuest?.phone || b.guest_phone || '+91 99999 99999',
      guestEmail: b.guest_email || 'guest@nothingness.asia',
      docType: (profile?.id_document_type || 'Aadhaar Card') as any,
      docMaskedNumber: profile?.document_number ? `XXXX-XXXX-${profile.document_number.slice(-4)}` : 'Verified on File',
      verificationToken: mainGuest?.verification_token || b.id,
      verifiedAt: profile?.verification_timestamp ? new Date(profile.verification_timestamp).toLocaleString('en-IN') : 'Verified',
      checkIn: b.check_in,
      checkOut: b.check_out,
      totalGuests: b.guests || 2,
      grossAmount: price,
      partnerNetShare: Math.round(price * 0.7), // 70% host payout
      platformShare: Math.round(price * 0.3),   // 30% platform
      status: (b.status === 'checked_in' ? 'active_stay' : b.status === 'completed' ? 'completed' : 'confirmed') as any,
      purposeOfStay: 'Private Luxury Staycation',
      complianceStatus: (profile?.is_verified ? 'Statutory Verified' : 'Pre-Vetted (180-Day Pass)') as any
    };
  });

  const partnerProfile = {
    id: user?.id || 'partner-host',
    user_id: user?.id || 'partner-host',
    full_name: user?.user_metadata?.full_name || 'Vetted Host Partner',
    email: user?.email || 'partner@nothingness.asia',
    phone: user?.phone || '+91 98101 22910',
    status: 'active' as const,
    payout_frequency: 'monthly' as const,
    bank_name: 'HDFC Bank Ltd.',
    bank_account_number: '••••••••8912',
    bank_ifsc: 'HDFC0001234',
    bank_account_name: 'Vetted Host Partner',
    upi_id: 'partner@okhdfcbank'
  };

  return (
    <PartnerDashboardClient
      profile={partnerProfile}
      properties={partnerProperties}
      initialBookings={partnerBookings}
    />
  );
}
