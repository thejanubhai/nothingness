import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { alias, bio, avatar_url, interests, confidentiality_agreed } = await req.json();

    if (!confidentiality_agreed) {
      return NextResponse.json(
        { error: 'You must accept the Confidentiality & Mutual Privacy Agreement to activate Kinkster Mode.' },
        { status: 400 }
      );
    }

    if (!alias || alias.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please choose a valid unique alias (at least 3 characters).' },
        { status: 400 }
      );
    }

    // Format alias cleanly (lowercase, alphanumeric + underscores)
    const formattedAlias = alias.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // 1. Verify Guest ID status in guest_profiles by phone or user_id
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

    if (!isIdVerified) {
      return NextResponse.json(
        { error: 'ID Verification Required. You must upload Aadhaar or Passport to activate Kinkster Mode.' },
        { status: 403 }
      );
    }

    // 2. Check if alias is already taken by another user
    const { data: existingAlias } = await supabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', formattedAlias)
      .neq('id', user.id)
      .single();

    if (existingAlias) {
      return NextResponse.json(
        { error: `The alias @${formattedAlias} is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // 3. Upsert kinkster_profile record
    const { data: profile, error: upsertError } = await supabase
      .from('kinkster_profiles')
      .upsert({
        id: user.id,
        alias: formattedAlias,
        bio: bio || 'Passionate about luxury stays & discretion.',
        avatar_url: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        is_activated: true,
        confidentiality_agreed: true,
        confidentiality_agreed_at: new Date().toISOString(),
        interests: interests || ['Luxury Stays', 'Discretion'],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error activating kinkster profile:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error('Kinkster activation exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
