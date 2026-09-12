import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function handlePurge(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';

    if (process.env.CRON_SECRET && !isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Purge burnt or expired messages from kinkster_ephemeral_messages
    // PostgREST syntax for OR condition with delete
    const { data: deletedMessages, error: msgErr } = await adminClient
      .from('kinkster_ephemeral_messages')
      .delete()
      .or(`is_burnt.eq.true,expires_at.lt.${nowIso}`)
      .select('id');

    if (msgErr) {
      console.error('Failed to purge ephemeral messages:', msgErr);
    }

    // 2. Clean up un-reciprocated or expired desire resonances older than their expiry
    const { data: expiredResonances, error: resErr } = await adminClient
      .from('kinkster_resonances')
      .delete()
      .lt('expires_at', nowIso)
      .eq('is_mutual', false)
      .select('id');

    if (resErr) {
      console.error('Failed to purge expired resonances:', resErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      purged_ephemeral_messages_count: deletedMessages?.length || 0,
      purged_expired_resonances_count: expiredResonances?.length || 0,
    });
  } catch (err: any) {
    console.error('Purge ephemeral cron error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handlePurge(request);
}

export async function POST(request: NextRequest) {
  return handlePurge(request);
}
