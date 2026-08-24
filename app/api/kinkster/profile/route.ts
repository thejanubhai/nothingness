import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const aliasParam = searchParams.get('alias');

    if (aliasParam) {
      // Fetch specific profile by alias
      const { data: profile, error } = await supabase
        .from('kinkster_profiles')
        .select('*')
        .eq('alias', aliasParam.toLowerCase())
        .eq('is_activated', true)
        .single();

      if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json({ profile });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user ID verification status by phone or user_id
    let isIdVerified = false;
    if (user.phone) {
      const cleanPhone = user.phone.replace(/[^0-9+]/g, '');
      const { data: gpByPhone } = await supabase
        .from('guest_profiles')
        .select('is_verified')
        .eq('phone', cleanPhone)
        .eq('is_verified', true)
        .maybeSingle();
      if (gpByPhone?.is_verified) isIdVerified = true;
    }

    if (!isIdVerified) {
      const { data: gpByUserId } = await supabase
        .from('guest_profiles')
        .select('is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();
      if (gpByUserId?.is_verified) isIdVerified = true;
    }

    // Fetch user's active kinkster profile
    const { data: kinksterProfile } = await supabase
      .from('kinkster_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      is_id_verified: isIdVerified,
      profile: kinksterProfile || null,
      is_activated: kinksterProfile?.is_activated ?? false
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
