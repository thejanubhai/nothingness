import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeIdentifier } from '@/lib/auth-utils';
import { env } from '@/lib/env';

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminIdentifier = normalizeIdentifier(env.ADMIN || '');
    const userPhone = user.phone ? normalizeIdentifier(user.phone) : null;
    const isAdmin = (adminIdentifier && userPhone === adminIdentifier) || 
                    Boolean(user.email && (user.email.includes('admin') || user.email.includes('hudav')));

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

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
          ...updateData,
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
          ...updateData,
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
