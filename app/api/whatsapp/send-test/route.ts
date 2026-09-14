import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { sendWhatsAppMessage } from '@/lib/omnichannel/meta';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Authenticate admin caller first before parsing payload
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin privileges required to dispatch test messages.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { targetPhone, message } = body;

    if (!targetPhone || typeof targetPhone !== 'string' || !targetPhone.trim()) {
      return NextResponse.json({ error: 'Target phone number is required.' }, { status: 400 });
    }

    const testContent =
      message && typeof message === 'string' && message.trim()
        ? message.trim()
        : 'Hello from Nothingness Stays! Your Meta WhatsApp Cloud API is operational.';

    console.log(`[WhatsApp Test Sender] Dispatching test WhatsApp to ${targetPhone}`);

    const result = await sendWhatsAppMessage({
      to: targetPhone,
      text: testContent,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to dispatch WhatsApp message via Meta Cloud API',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recipient: targetPhone,
      messageId: result.messageId,
      mocked: result.mocked || false,
      message: testContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[WhatsApp Test Sender] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
