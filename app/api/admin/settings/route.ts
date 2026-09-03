import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, updated_at, updated_by, ...rawUpdateData } = body;

    const allowedColumns = [
      'maintenance_mode',
      'admin_contact_email',
      'default_check_in_time',
      'default_check_out_time',
      'min_advance_booking_days',
      'max_advance_booking_days',
      'cancellation_policy_text',
      'base_tax_rate_percent',
      'default_security_deposit',
      'ai_system_prompt',
      'frontend_banner_text',
      'frontend_banner_active',
      'whatsapp_api_key',
      'resend_api_key',
      'gemini_api_key',
      'nvidia_api_key',
      'fee_id_verification',
      'fee_kinkster_activation',
      'fee_partner_onboarding',
      'payu_key',
      'payu_salt',
      'payu_client_id',
      'payu_client_secret',
      'payu_env',
    ];

    const cleanUpdateData: Record<string, any> = {};
    for (const key of allowedColumns) {
      if (key in rawUpdateData) {
        cleanUpdateData[key] = rawUpdateData[key];
      }
    }

    // Check if platform_settings record already exists
    const { data: existing } = await supabase
      .from('platform_settings')
      .select('id')
      .maybeSingle();

    let result;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('platform_settings')
        .update({
          ...cleanUpdateData,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('platform_settings')
        .insert({
          ...cleanUpdateData,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (err: any) {
    console.error('Save platform settings error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
