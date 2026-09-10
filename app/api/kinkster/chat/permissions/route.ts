import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canUserMessage } from '@/lib/messaging/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetAlias = searchParams.get('alias');
    const targetUserId = searchParams.get('userId');

    const adminSupabase = createAdminClient();
    let resolvedRecipientId = targetUserId;

    if (!resolvedRecipientId && targetAlias) {
      const cleanAlias = targetAlias.replace('@', '').toLowerCase();
      const { data: profile } = await adminSupabase
        .from('kinkster_profiles')
        .select('id')
        .eq('alias', cleanAlias)
        .maybeSingle();

      if (profile) {
        resolvedRecipientId = profile.id;
      }
    }

    if (!resolvedRecipientId) {
      return NextResponse.json({ error: 'Recipient alias or user ID required.' }, { status: 400 });
    }

    const permissionResult = await canUserMessage(adminSupabase, user.id, resolvedRecipientId);

    return NextResponse.json({
      success: true,
      ...permissionResult,
    });
  } catch (err: any) {
    console.error('Permissions check error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
