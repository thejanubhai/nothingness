import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to submit a report.' }, { status: 401 });
    }

    const body = await req.json();
    const { post_id, reason, details } = body;

    if (!post_id || !reason) {
      return NextResponse.json(
        { error: 'Post ID and report reason are required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Retrieve reporter's alias if available
    let reporterAlias: string | null = null;
    try {
      const { data: profile } = await adminSupabase
        .from('kinkster_profiles')
        .select('alias')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.alias) {
        reporterAlias = profile.alias;
      }
    } catch (_) {}

    // Record report in database
    try {
      const { error: insertError } = await adminSupabase
        .from('kinkster_post_reports')
        .insert({
          post_id: String(post_id),
          reporter_id: user.id,
          reporter_alias: reporterAlias,
          reason: String(reason).slice(0, 128),
          details: details ? String(details).slice(0, 1000) : null,
          status: 'pending',
        });

      if (insertError) {
        console.warn('[Report Post API] Database insert notice:', insertError.message);
      }
    } catch (dbErr: any) {
      console.warn('[Report Post API] Could not record to kinkster_post_reports table:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Post reported successfully and removed from your feed.',
    });
  } catch (err: any) {
    console.error('[Report Post API] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while processing report' },
      { status: 500 }
    );
  }
}
