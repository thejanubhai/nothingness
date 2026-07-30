import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { alias, bio, avatar_url, kinks, onboarding_answers, confidentiality_agreed } = await req.json();

    if (!confidentiality_agreed) {
      return NextResponse.json(
        { error: 'You must accept the Confidentiality & Mutual Privacy Agreement.' },
        { status: 400 }
      );
    }

    if (!alias || alias.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please choose a valid unique alias (at least 3 characters).' },
        { status: 400 }
      );
    }

    const formattedAlias = alias.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    // 1. Check ID verification status
    const { data: guestProfile } = await supabase
      .from('guest_profiles')
      .select('is_verified')
      .eq('user_id', user.id)
      .single();

    const isIdVerified = guestProfile?.is_verified ?? false;

    if (!isIdVerified) {
      return NextResponse.json(
        { error: 'ID Verification Required. Please upload Aadhaar or Passport before onboarding.' },
        { status: 403 }
      );
    }

    // 2. Check alias uniqueness
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

    // Extract tags from kinks array for quick display
    const interestTags = (kinks || []).map((k: any) => k.name || k.id);

    // 3. Upsert kinkster_profile
    const { data: profile, error: upsertError } = await supabase
      .from('kinkster_profiles')
      .upsert({
        id: user.id,
        alias: formattedAlias,
        bio: bio || 'Passionate about luxury stays, aesthetics, and high discretion.',
        avatar_url: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        is_activated: true,
        confidentiality_agreed: true,
        confidentiality_agreed_at: new Date().toISOString(),
        interests: interestTags,
        onboarding_answers: onboarding_answers || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // 4. Save kink preferences with 1-5 star intensities into kinkster_preferences
    if (kinks && Array.isArray(kinks)) {
      for (const item of kinks) {
        if (item.id && item.intensity) {
          await supabase
            .from('kinkster_preferences')
            .upsert({
              kinkster_id: user.id,
              kink_id: item.id,
              intensity: item.intensity
            }, { onConflict: 'kinkster_id,kink_id' });
        }
      }
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    console.error('Onboarding exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
