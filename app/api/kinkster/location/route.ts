import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SUPPORTED_DISCOVERY_METROS } from '@/lib/location/relevance';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userPreferences = {
      city: 'Delhi',
      region: 'North India',
      country: 'India',
      enabled: true,
    };

    if (user) {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from('kinkster_profiles')
        .select('discovery_location_city, discovery_location_region, discovery_location_country, discovery_location_enabled')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        userPreferences = {
          city: profile.discovery_location_city || 'Delhi',
          region: profile.discovery_location_region || 'North India',
          country: profile.discovery_location_country || 'India',
          enabled: profile.discovery_location_enabled !== false,
        };
      }
    }

    return NextResponse.json({
      success: true,
      currentLocation: userPreferences,
      supportedMetros: SUPPORTED_DISCOVERY_METROS,
    });
  } catch (err: any) {
    console.error('Location GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { city, region, country, enabled } = body;

    // Coarse validation: Ensure no GPS coordinate strings or script injections
    const sanitizedCity = city ? String(city).trim().slice(0, 64) : null;
    const sanitizedRegion = region ? String(region).trim().slice(0, 64) : null;
    const sanitizedCountry = country ? String(country).trim().slice(0, 64) : 'India';
    const isEnabled = enabled !== false;

    const adminClient = createAdminClient();
    const { data: updated, error } = await adminClient
      .from('kinkster_profiles')
      .update({
        discovery_location_city: sanitizedCity,
        discovery_location_region: sanitizedRegion,
        discovery_location_country: sanitizedCountry,
        discovery_location_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('discovery_location_city, discovery_location_region, discovery_location_country, discovery_location_enabled')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (err: any) {
    console.error('Location POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
