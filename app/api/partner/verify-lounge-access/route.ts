import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { memberToken } = await req.json();

    if (!memberToken) {
      return NextResponse.json({ error: 'Member pass token is required.' }, { status: 400 });
    }

    const token = memberToken.toUpperCase();

    // Check for walk-in / unverified simulation token
    if (token.includes('WALKIN') || token.includes('UNVERIFIED') || token === 'WALK-IN') {
      return NextResponse.json({
        allowed: false,
        memberName: 'Unverified Guest',
        pastStaysCount: 0,
        reason: 'Direct entry or walk-ins are strictly prohibited. The guest has 0 recorded stays in the nothingness. network.'
      });
    }

    // Check database or simulate verified member with stay history
    const supabase = await createClient();

    // Try finding guest by phone or profile if real DB entry
    const cleanToken = token.replace(/[^0-9+]/g, '');
    let staysCount = 2;
    let guestName = 'Karan Malhotra';
    let lastProperty = 'The Void Pavilion';
    let lastCity = 'South Delhi';

    if (cleanToken.length >= 10) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, spaces(title, city)')
        .eq('status', 'confirmed')
        .limit(5);

      if (bookings && bookings.length > 0) {
        staysCount = bookings.length;
        guestName = bookings[0].guest_name || 'Verified Member';
        lastProperty = bookings[0].spaces?.title || 'The Void Pavilion';
        lastCity = bookings[0].spaces?.city || 'New Delhi';
      }
    }

    // If verified with >= 1 stay, grant access
    if (staysCount >= 1) {
      return NextResponse.json({
        allowed: true,
        memberName: guestName,
        memberId: `NTH-VET-${Math.floor(1000 + Math.random() * 9000)}`,
        pastStaysCount: staysCount,
        lastStayProperty: lastProperty,
        lastStayCity: lastCity,
        accessGrantedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      allowed: false,
      memberName: guestName,
      pastStaysCount: 0,
      reason: 'No completed stay found across any nothingness. sanctuary in India. Minimum 1 verified stay required.'
    });

  } catch (error: any) {
    console.error('Lounge verify API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
