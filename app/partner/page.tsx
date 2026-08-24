import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PartnerDashboardClient from '@/components/partner/PartnerDashboardClient';

export const metadata: Metadata = {
  title: 'Partner Command Center | nothingness.',
  description: 'Manage live sanctuary bookings, 70/30 revenue distribution, 1-click legal guest dossiers, inventory refills, and gated lounge access.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not logged in, provide sample partner profile for exploration or redirect to /auth
  const partnerProfile = {
    id: user?.id || 'partner-demo-01',
    user_id: user?.id || 'partner-demo-01',
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

  const partnerProperties = [
    {
      id: 'prop-1',
      title: 'The Amber Haven Sanctuary',
      city: 'New Delhi',
      locality: 'Hauz Khas Enclave',
      space_tier: 'luxury' as const,
      housekeeping_status: 'ready' as const,
      lounge_eligible: true,
      lounge_type: 'terrace'
    },
    {
      id: 'prop-2',
      title: 'The Obsidian Suite',
      city: 'New Delhi',
      locality: 'Greater Kailash 1',
      space_tier: 'luxury' as const,
      housekeeping_status: 'turnover_in_progress' as const,
      lounge_eligible: true,
      lounge_type: 'open_space'
    }
  ];

  return (
    <PartnerDashboardClient
      profile={partnerProfile}
      properties={partnerProperties}
    />
  );
}
