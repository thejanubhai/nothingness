import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cms_content_blocks')
      .select('*')
      .order('block_key', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, blocks: data || [] });
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
    const { block_key, title, subtitle, body: contentBody, cta_text, cta_link, is_active } = body;

    if (!block_key) {
      return NextResponse.json({ error: 'block_key is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cms_content_blocks')
      .upsert({
        block_key,
        title,
        subtitle,
        body: contentBody,
        cta_text,
        cta_link,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: 'block_key' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, block: data });
  } catch (err: any) {
    console.error('CMS update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
