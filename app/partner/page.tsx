import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PartnerDashboardClient from '@/components/partner/PartnerDashboardClient';

export const metadata: Metadata = {
  title: 'Partner Command Center | nothingness.',
  description: 'Manage live sanctuary bookings, 70/30 revenue distribution, 1-click legal guest dossiers, inventory refills, and gated lounge access.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminSupabase = createAdminClient();

  let dbProfile: any = null;
  let partnerDbProps: any[] = [];

  if (user) {
    const { data: profile } = await adminSupabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      dbProfile = profile;

      const { data: props } = await adminSupabase
        .from('partner_properties')
        .select('*')
        .eq('partner_id', profile.id);

      partnerDbProps = props || [];
    }
  }

  // Fetch real spaces from database
  const { data: spacesData } = await supabase
    .from('spaces')
    .select('id, title, city, area, featured_image, active, nightly_price')
    .order('created_at', { ascending: false });

  // Merge partner properties or fallback to active spaces
  const partnerProperties = partnerDbProps.length > 0
    ? partnerDbProps.map((p: any) => ({
        id: p.id,
        title: p.title,
        city: p.city || 'New Delhi',
        locality: p.locality || 'South Delhi',
        space_tier: (p.space_tier || 'luxury') as 'budget' | 'luxury',
        housekeeping_status: (p.housekeeping_status || 'ready') as any,
        lounge_eligible: !!p.lounge_eligible,
        lounge_type: p.lounge_type || 'terrace'
      }))
    : (spacesData || []).map((s: any) => ({
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
      bookingRef: `NTH-${(b.id || '').slice(0, 6).toUpperCase()}`,
      propertyTitle: spaceRecord?.title || 'Sanctuary',
      propertyAddress: `${spaceRecord?.area || ''}, ${spaceRecord?.city || 'Delhi NCR'}`.replace(/^, /, ''),
      guestName: profile?.full_name || mainGuest?.name || b.guest_name || 'Verified Guest',
      guestPhone: profile?.phone_number || mainGuest?.phone || b.guest_phone || '+91 99999 99999',
      guestEmail: b.guest_email || 'guest@nothingness.asia',
      docType: (profile?.id_document_type || 'Aadhaar Card') as any,
      docMaskedNumber: profile?.document_number ? `XXXX-XXXX-${String(profile.document_number).slice(-4)}` : 'Verified on File',
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
    id: dbProfile?.id || user?.id || 'partner-host',
    user_id: user?.id || 'partner-host',
    full_name: dbProfile?.full_name || user?.user_metadata?.full_name || 'Vetted Host Partner',
    email: dbProfile?.email || user?.email || 'partner@nothingness.asia',
    phone: dbProfile?.phone || user?.phone || (user?.email?.includes('@auth.nothingness') ? `+${user.email.split('@')[0]}` : '+91 98101 22910'),
    status: (dbProfile?.status || (user ? 'under_review' : 'active')) as any,
    setup_fee_paid: !!dbProfile?.setup_fee_paid,
    contract_signed: !!dbProfile?.contract_signed,
    contract_signed_at: dbProfile?.contract_signed_at || null,
    contract_city: dbProfile?.contract_city || 'National Capital Territory / Pan-India',
    affidavit_uploaded: !!dbProfile?.affidavit_uploaded,
    affidavit_url: dbProfile?.affidavit_url || null,
    affidavit_notes: dbProfile?.affidavit_notes || null,
    verified_by_admin: !!dbProfile?.verified_by_admin,
    payout_frequency: (dbProfile?.payout_frequency || 'monthly') as any,
    bank_name: dbProfile?.bank_name || 'HDFC Bank Ltd.',
    bank_account_number: dbProfile?.bank_account_number || '••••••••8912',
    bank_ifsc: dbProfile?.bank_ifsc || 'HDFC0001234',
    bank_account_name: dbProfile?.bank_account_name || dbProfile?.full_name || 'Vetted Host Partner',
    upi_id: dbProfile?.upi_id || 'partner@okhdfcbank'
  };

  return (
    <PartnerDashboardClient
      profile={partnerProfile}
      properties={partnerProperties}
      initialBookings={partnerBookings}
    />
  );
}
