import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: session } = await supabase
      .from('whatsapp_business_sessions')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    // Generate a fresh mock/real Baileys QR Code Data URL if disconnected
    const qrSample = session?.qr_code_data || `2@NOTHINGNESS_WA_PAIR_${Date.now()}_KEY_PAIR_HASH_789456`;

    return NextResponse.json({
      success: true,
      status: session?.status || 'disconnected',
      phoneNumber: session?.phone_number || null,
      qrCodeData: qrSample,
      lastConnectedAt: session?.last_connected_at || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phoneNumber } = body; // action: 'connect' | 'disconnect' | 'refresh'

    const supabase = await createClient();

    let newStatus = 'disconnected';
    let connectedPhone = null;
    let connectedAt = null;

    if (action === 'connect') {
      newStatus = 'connected';
      connectedPhone = phoneNumber || '+91 98765 43210';
      connectedAt = new Date().toISOString();
    } else if (action === 'disconnect') {
      newStatus = 'disconnected';
    }

    const { data: updated, error } = await supabase
      .from('whatsapp_business_sessions')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        status: newStatus,
        phone_number: connectedPhone,
        last_connected_at: connectedAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
