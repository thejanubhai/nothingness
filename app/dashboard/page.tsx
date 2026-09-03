import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UserDashboardClient from '@/components/dashboard/UserDashboardClient';
import { normalizeIdentifier, isUserAdminAsync } from '@/lib/auth-utils';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'My Profile & Portal | Nothingness',
  description: 'Guest ID Vetting, Level 2 Choice Pathway, and Sanctuary Bookings.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth?redirect=/dashboard');
  }

  // Security Isolation: If admin lands on /dashboard, redirect them directly to /admin command center
  const isAdmin = await isUserAdminAsync(user);
  if (isAdmin) {
    redirect('/admin');
  }

  // Handle synthetic bridge emails
  const isSyntheticEmail = Boolean(user.email && user.email.includes('@auth.nothingness'));
  const effectivePhone = user.phone
    ? user.phone.replace(/[^0-9+]/g, '')
    : isSyntheticEmail && user.email
    ? user.email.split('@')[0].replace(/[^0-9+]/g, '')
    : null;

  // 1. Fetch upcoming bookings
  const today = new Date().toISOString().split('T')[0];
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      spaces ( title, city, featured_image )
    `)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .gte('check_in', today)
    .order('check_in', { ascending: true })
    .limit(3);

  // 2. Fetch Identity Profile from guest_profiles by phone or user_id
  let profile = null;
  if (effectivePhone) {
    const { data: pData } = await supabase
      .from('guest_profiles')
      .select('*')
      .eq('phone', effectivePhone)
      .limit(1)
      .maybeSingle();
    profile = pData;
  }

  if (!profile) {
    const { data: pData } = await supabase
      .from('guest_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    profile = pData;
  }

  const effectiveUserId = user.id;

  // 3. Fetch Kinkster Profile status
  const { data: kinksterProfile } = await supabase
    .from('kinkster_profiles')
    .select('*')
    .or(`id.eq.${effectiveUserId},guest_profile_id.eq.${profile?.id || effectiveUserId},id.eq.${profile?.id || effectiveUserId}`)
    .limit(1)
    .maybeSingle();

  // 4. Fetch Sanctuary Pass status
  const { data: sanctuaryPass } = await supabase
    .from('sanctuary_passes')
    .select('*')
    .or(`user_id.eq.${effectiveUserId},guest_profile_id.eq.${profile?.id || effectiveUserId},user_id.eq.${profile?.id || effectiveUserId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <UserDashboardClient
      user={{
        id: user.id,
        phone: user.phone,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
      }}
      profile={profile}
      kinksterProfile={kinksterProfile}
      sanctuaryPass={sanctuaryPass}
      upcomingBookings={upcomingBookings || []}
    />
  );
}
