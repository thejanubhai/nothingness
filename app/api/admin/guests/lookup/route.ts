import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone || rawPhone.trim().length < 4) {
      return NextResponse.json({ success: true, found: false, message: 'Phone number too short' });
    }

    const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    const supabase = await createClient();

    // 1. Search in guest_profiles
    const { data: profiles, error: profileErr } = await supabase
      .from('guest_profiles')
      .select(`
        id, full_name, phone_number, phone, id_document_type, document_number,
        permanent_address, dob, is_foreign_national, nationality, visa_number,
        is_verified, verification_timestamp, verification_expires_at, police_register_status,
        id_front_url, id_back_url, created_at,
        booking_guests (id, booking_id)
      `)
      .or(`phone.ilike.%${last10}%,phone_number.ilike.%${last10}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (profileErr) {
      console.error('Error querying guest_profiles:', profileErr);
    }

    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      const now = new Date();
      const isExpValid = profile.verification_expires_at 
        ? new Date(profile.verification_expires_at) > now 
        : false;

      const staysCount = profile.booking_guests?.length || 0;

      return NextResponse.json({
        success: true,
        found: true,
        source: 'guest_profiles',
        guest: {
          id: profile.id,
          full_name: profile.full_name,
          phone_number: profile.phone_number || profile.phone,
          id_document_type: profile.id_document_type || 'Aadhaar',
          document_number: profile.document_number || '',
          permanent_address: profile.permanent_address || '',
          dob: profile.dob || '',
          is_foreign_national: !!profile.is_foreign_national,
          nationality: profile.nationality || 'Indian',
          visa_number: profile.visa_number || '',
          is_verified: profile.is_verified || isExpValid,
          is_180_day_valid: isExpValid,
          verification_expires_at: profile.verification_expires_at,
          police_register_status: profile.police_register_status || (profile.is_verified ? 'verified_compliant' : 'action_required'),
          stays_count: staysCount,
          created_at: profile.created_at
        }
      });
    }

    // 2. Fallback: Search in bookings table if profile doesn't exist yet
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, guest_name, guest_email, guest_phone, created_at')
      .ilike('guest_phone', `%${last10}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (bookings && bookings.length > 0) {
      const b = bookings[0];
      return NextResponse.json({
        success: true,
        found: true,
        source: 'bookings_history',
        guest: {
          full_name: b.guest_name || '',
          phone_number: b.guest_phone || rawPhone,
          id_document_type: 'Aadhaar',
          document_number: '',
          permanent_address: '',
          dob: '',
          is_foreign_national: false,
          nationality: 'Indian',
          is_verified: false,
          is_180_day_valid: false,
          stays_count: 1,
        }
      });
    }

    return NextResponse.json({ success: true, found: false });

  } catch (error: any) {
    console.error('Guest lookup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
