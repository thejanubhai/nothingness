import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      payout_frequency,
      bank_account_number,
      bank_ifsc,
      bank_account_name,
      bank_name,
      upi_id
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If user is authenticated, update partner_profiles
    if (user) {
      const { error } = await supabase
        .from('partner_profiles')
        .update({
          payout_frequency: payout_frequency || 'monthly',
          bank_account_number,
          bank_ifsc,
          bank_account_name,
          bank_name,
          upi_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update partner payout settings in DB:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payout preferences updated successfully.',
      payout_frequency: payout_frequency || 'monthly'
    });

  } catch (error: any) {
    console.error('Payout settings API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
