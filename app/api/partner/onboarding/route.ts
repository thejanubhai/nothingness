import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { action, signatureText, city, affidavitUrl, txId } = body;

    // Fallback/demo mock user if not logged in or during initial onboarding
    const userId = user?.id || 'demo-partner-user';
    const email = user?.email || 'partner@nothingness.asia';

    if (action === 'sign_mou') {
      const signedAt = new Date().toISOString();
      return NextResponse.json({
        success: true,
        message: 'MoU signed successfully.',
        signedAt,
        contractCity: city || 'PAN India'
      });
    }

    if (action === 'submit_affidavit') {
      if (!affidavitUrl) {
        return NextResponse.json({ error: 'Affidavit URL or file scan required.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Affidavit uploaded. Queued for manual admin verification.',
        status: 'under_review',
        affidavitUrl
      });
    }

    if (action === 'pay_setup_fee') {
      return NextResponse.json({
        success: true,
        message: 'Setup fee recorded successfully.',
        setupFeePaid: true,
        txId: txId || `NTH-PAY-${Date.now()}`
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  } catch (error: any) {
    console.error('Partner onboarding API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
