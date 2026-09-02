import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || !isUserAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { target_alias, is_trusted_host } = await req.json();

    if (!target_alias) {
      return NextResponse.json({ error: 'Target alias is required.' }, { status: 400 });
    }

    const { data: profile, error: updateError } = await supabase
      .from('kinkster_profiles')
      .update({ is_trusted_host: !!is_trusted_host })
      .eq('alias', target_alias.toLowerCase())
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: `Updated @${target_alias} Trusted Host status to ${is_trusted_host}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
