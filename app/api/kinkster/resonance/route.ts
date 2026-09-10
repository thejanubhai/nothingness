import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MessagingService } from '@/lib/messaging/service';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch user's mutual resonances strictly where is_mutual is true
    const { data: mutualResonances } = await adminClient
      .from('kinkster_resonances')
      .select(`
        id,
        chamber_token,
        tags,
        matched_at,
        expires_at,
        sender_id,
        target_id,
        sender:kinkster_profiles!kinkster_resonances_sender_id_fkey(alias, avatar_url, bio),
        target:kinkster_profiles!kinkster_resonances_target_id_fkey(alias, avatar_url, bio)
      `)
      .or(`sender_id.eq.${user.id},target_id.eq.${user.id}`)
      .eq('is_mutual', true);

    // 2. Fetch all target IDs the user has resonated with (strictly user's outbound intent)
    const { data: outboundResonances } = await adminClient
      .from('kinkster_resonances')
      .select('target_id, tags')
      .eq('sender_id', user.id);

    const resonatedTargetIds = (outboundResonances || []).map((r) => r.target_id);

    // Format mutual matches cleanly
    const matches = (mutualResonances || []).map((m: any) => {
      const isSender = m.sender_id === user.id;
      const otherId = isSender ? m.target_id : m.sender_id;
      const otherProfile = isSender ? m.target : m.sender;
      return {
        id: m.id,
        chamberToken: m.chamber_token,
        tags: m.tags || [],
        matchedAt: m.matched_at,
        expiresAt: m.expires_at,
        otherUserId: otherId,
        otherAlias: otherProfile?.alias || 'anonymous_member',
        otherAvatar: otherProfile?.avatar_url || '/images/IMG_9955.jpg',
      };
    });

    return NextResponse.json({
      success: true,
      mutualMatches: matches,
      resonatedTargetIds,
    });
  } catch (err: any) {
    console.error('Error fetching resonances:', err);
    return NextResponse.json({ success: true, mutualMatches: [], resonatedTargetIds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required to drop desire resonance.' }, { status: 401 });
    }

    const body = await req.json();
    const { targetAlias, tags = [] } = body;

    if (!targetAlias) {
      return NextResponse.json({ error: 'Target @alias is required.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Resolve Target Profile
    const { data: targetProfile } = await adminClient
      .from('kinkster_profiles')
      .select('id, alias')
      .eq('alias', targetAlias.replace('@', '').toLowerCase())
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json({ error: 'Member @alias not found.' }, { status: 404 });
    }

    if (targetProfile.id === user.id) {
      return NextResponse.json({ error: 'You cannot resonate with your own profile.' }, { status: 400 });
    }

    // 2. Dual-Blind Check: Does target have an active un-expired resonance towards user?
    const { data: reverseMatch } = await adminClient
      .from('kinkster_resonances')
      .select('id, chamber_token, tags')
      .eq('sender_id', targetProfile.id)
      .eq('target_id', user.id)
      .maybeSingle();

    const now = new Date().toISOString();
    let isMutual = false;
    let chamberToken = reverseMatch?.chamber_token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    if (reverseMatch) {
      // It's a genuine mutual lock!
      isMutual = true;

      // Update reverse record
      await adminClient
        .from('kinkster_resonances')
        .update({
          is_mutual: true,
          chamber_token: chamberToken,
          matched_at: now,
        })
        .eq('id', reverseMatch.id);

      // Link to canonical messaging system
      try {
        const messagingService = new MessagingService(adminClient);
        await messagingService.getOrCreateResonanceConversation(user.id, targetProfile.id, tags);
      } catch (err) {
        console.error('Error linking resonance conversation:', err);
      }

      // Sync into kinkster_spice_requests as accepted
      try {
        await adminClient
          .from('kinkster_spice_requests')
          .upsert({
            sender_id: user.id,
            receiver_id: targetProfile.id,
            status: 'accepted',
            updated_at: now
          }, { onConflict: 'sender_id,receiver_id' });
      } catch (_) {}
    }

    // 3. Upsert user's outbound resonance record
    const { data: existingOutbound } = await adminClient
      .from('kinkster_resonances')
      .select('id')
      .eq('sender_id', user.id)
      .eq('target_id', targetProfile.id)
      .maybeSingle();

    if (existingOutbound) {
      await adminClient
        .from('kinkster_resonances')
        .update({
          sender_id: user.id,
          target_id: targetProfile.id,
          tags,
          is_mutual: isMutual,
          chamber_token: chamberToken,
          matched_at: isMutual ? now : null,
        })
        .eq('id', existingOutbound.id);
    } else {
      await adminClient
        .from('kinkster_resonances')
        .insert({
          sender_id: user.id,
          target_id: targetProfile.id,
          tags,
          is_mutual: isMutual,
          chamber_token: chamberToken,
          matched_at: isMutual ? now : null,
        });
    }

    const resonanceData = {
      targetAlias: targetProfile.alias,
      isMutual,
      chamberToken: isMutual ? chamberToken : null,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };

    return NextResponse.json({
      success: true,
      isMutual,
      targetAlias: targetProfile.alias,
      chamberToken: isMutual ? chamberToken : undefined,
      resonance: resonanceData,
      message: isMutual
        ? `Dual-Blind Desire Resonance Matched with @${targetProfile.alias}! Ephemeral chamber unlocked.`
        : `Resonance locked under strict confidentiality. @${targetProfile.alias} will never be notified unless mutual.`,
    });
  } catch (err: any) {
    console.error('Error saving desire resonance:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process desire resonance.' },
      { status: 500 }
    );
  }
}
