import { NextResponse } from 'next/server';
import { getPlatformActionFees } from '@/lib/payu';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { fee_kinkster_activation } = await getPlatformActionFees();

    // Fetch approximate active member count for social proof without exposing sensitive data
    let memberCount = 48; // dignified baseline
    try {
      const adminSupabase = createAdminClient();
      const { count, error } = await adminSupabase
        .from('kinkster_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_activated', true);

      if (!error && count && count > 0) {
        memberCount = count;
      }
    } catch {
      // fallback to baseline
    }

    return NextResponse.json({
      success: true,
      entry_fee: fee_kinkster_activation ?? 0,
      currency: 'INR',
      currency_symbol: '₹',
      member_count: memberCount,
      membership_type: 'lifetime',
    });
  } catch (err: any) {
    console.error('Failed to get kinkster public info:', err);
    return NextResponse.json(
      {
        success: true,
        entry_fee: 0,
        currency: 'INR',
        currency_symbol: '₹',
        member_count: 48,
        membership_type: 'lifetime',
      },
      { status: 200 }
    );
  }
}
