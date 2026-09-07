import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { deleteFromR2 } from '@/lib/r2/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdminAsync(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // Fetch reports
    const { data: reports, error: reportsError } = await adminSupabase
      .from('kinkster_post_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.warn('[Admin Moderation API] Error querying reports:', reportsError.message);
      return NextResponse.json({ reports: [] });
    }

    // Fetch post details for referenced posts
    const postIds = Array.from(new Set((reports || []).map((r) => r.post_id)));
    let postsMap: Record<string, any> = {};

    if (postIds.length > 0) {
      try {
        const { data: posts } = await adminSupabase
          .from('kinkster_posts')
          .select(`
            id,
            media_url,
            caption,
            created_at,
            kinkster_profiles (
              alias,
              avatar_url
            )
          `)
          .in('id', postIds);

        if (posts) {
          posts.forEach((p) => {
            postsMap[p.id] = p;
          });
        }
      } catch (_) {}
    }

    const enrichedReports = (reports || []).map((r) => ({
      ...r,
      post: postsMap[r.post_id] || null,
    }));

    return NextResponse.json({ reports: enrichedReports });
  } catch (err: any) {
    console.error('[Admin Moderation API] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdminAsync(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { report_id, post_id, action } = body;

    if (!report_id || !action) {
      return NextResponse.json({ error: 'report_id and action are required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    if (action === 'dismiss') {
      await adminSupabase
        .from('kinkster_post_reports')
        .update({ status: 'dismissed' })
        .eq('id', report_id);

      // Audit log
      try {
        await adminSupabase.from('admin_audit_log').insert({
          admin_id: user.id,
          admin_email: user.email,
          action: 'dismiss_post_report',
          resource_type: 'kinkster_post_report',
          resource_id: report_id,
          details: { report_id, action: 'dismissed' },
        });
      } catch (_) {}

      return NextResponse.json({ success: true, message: 'Report dismissed' });
    }

    if (action === 'delete_post') {
      if (!post_id) {
        return NextResponse.json({ error: 'post_id required to delete post' }, { status: 400 });
      }

      // Fetch post first to get media URL for cleanup
      const { data: postToDelete } = await adminSupabase
        .from('kinkster_posts')
        .select('media_url')
        .eq('id', post_id)
        .maybeSingle();

      // Delete post from database
      await adminSupabase
        .from('kinkster_posts')
        .delete()
        .eq('id', post_id);

      // Mark report as resolved
      await adminSupabase
        .from('kinkster_post_reports')
        .update({ status: 'resolved' })
        .eq('id', report_id);

      // Attempt R2 deletion if key extractable
      if (postToDelete?.media_url) {
        try {
          const urlObj = new URL(postToDelete.media_url);
          const key = urlObj.pathname.replace(/^\/+/, '');
          if (key) {
            await deleteFromR2(key);
          }
        } catch (_) {}
      }

      // Audit log
      try {
        await adminSupabase.from('admin_audit_log').insert({
          admin_id: user.id,
          admin_email: user.email,
          action: 'delete_moderated_post',
          resource_type: 'kinkster_post',
          resource_id: post_id,
          details: { report_id, post_id, action: 'post_deleted' },
        });
      } catch (_) {}

      return NextResponse.json({ success: true, message: 'Post deleted and report resolved' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Moderation API] Action error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
