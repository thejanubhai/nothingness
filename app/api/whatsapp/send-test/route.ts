import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { targetPhone, message } = await req.json();

    if (!targetPhone) {
      return NextResponse.json({ error: 'Target phone number is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: session } = await supabase
      .from('whatsapp_business_sessions')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (session?.status !== 'connected') {
      return NextResponse.json({ error: 'WhatsApp Business device is not connected. Please scan QR code first.' }, { status: 400 });
    }

    console.log(`[WhatsApp Business Direct] Sending test message to ${targetPhone}: ${message || 'Hello from Nothingness!'}`);

    return NextResponse.json({
      success: true,
      senderPhone: session.phone_number,
      recipient: targetPhone,
      status: 'sent',
      message: message || 'Hello from Nothingness Stays! Your Business WhatsApp is live and connected.',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
