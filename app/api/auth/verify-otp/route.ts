import { NextRequest, NextResponse } from 'next/server';
import { loginWithServerOtp } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and verification code are required' }, { status: 400 });
    }

    const result = await loginWithServerOtp(phone, otp);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, redirectUrl: result.redirectUrl });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
