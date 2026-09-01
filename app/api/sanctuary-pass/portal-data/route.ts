import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // 1. Check ID verification
    const { data: guestProfile } = await adminClient
      .from('guest_profiles')
      .select('is_verified')
      .eq('user_id', user.id)
      .maybeSingle();

    // 2. Check Sanctuary Pass status
    const { data: pass } = await adminClient
      .from('sanctuary_passes')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    // 3. Get Pass Price from settings
    const { data: settings } = await adminClient
      .from('sanctuary_pass_settings')
      .select('one_time_pass_price')
      .maybeSingle();

    // 4. Get User Alias
    const { data: profile } = await adminClient
      .from('kinkster_profiles')
      .select('alias')
      .eq('id', user.id)
      .maybeSingle();

    const userAlias = profile?.alias || 'guest_' + user.id.slice(0, 5);

    // 5. Fetch Published Events
    const { data: events, error: eventsErr } = await adminClient
      .from('sanctuary_events')
      .select(`
        *,
        spaces (
          title,
          city,
          images
        )
      `)
      .neq('status', 'draft')
      .order('event_date', { ascending: true });

    // 6. Fetch User Applications
    const { data: applications } = await adminClient
      .from('sanctuary_event_applications')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      isIdVerified: !!guestProfile?.is_verified,
      hasSanctuaryPass: pass?.status === 'active',
      passPrice: settings?.one_time_pass_price || 1499,
      userAlias,
      events: events || [],
      applications: applications || [],
    });
  } catch (err: any) {
    console.error('Portal Data Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
