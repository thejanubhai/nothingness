import { SupabaseClient } from '@/lib/supabase/client';

export interface CanMessageResult {
  canMessage: boolean;
  requiresRequest: boolean;
  reason?: string;
}

/**
 * Server-side Permission Resolver for Social Messaging
 * Strictly evaluates actual backend state to determine if senderId can message recipientId.
 */
export async function canUserMessage(
  supabase: SupabaseClient<any, any, any>,
  senderId: string,
  recipientId: string
): Promise<CanMessageResult> {
  // 1. Cannot message self
  if (senderId === recipientId) {
    return { canMessage: false, requiresRequest: false, reason: 'Cannot message yourself.' };
  }

  // 2. Check blocks in either direction
  const { data: blockRecords } = await supabase
    .from('kinkster_blocks')
    .select('blocker_id, blocked_id')
    .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${senderId})`)
    .limit(1);

  if (blockRecords && blockRecords.length > 0) {
    return { canMessage: false, requiresRequest: false, reason: 'Messaging is unavailable between these profiles.' };
  }

  // 3. Check if recipient profile exists and is activated
  const { data: recipientProfile } = await supabase
    .from('kinkster_profiles')
    .select('id, alias, is_activated, messaging_privacy')
    .eq('id', recipientId)
    .single();

  if (!recipientProfile || !recipientProfile.is_activated) {
    return { canMessage: false, requiresRequest: false, reason: 'Recipient profile is inactive or unavailable.' };
  }

  const privacySetting = recipientProfile.messaging_privacy || 'broader';

  // If recipient has closed messaging completely
  if (privacySetting === 'nobody') {
    return { canMessage: false, requiresRequest: false, reason: 'This member has disabled incoming messages.' };
  }

  // 4. Check if an existing direct conversation already exists between them with active status
  const { data: existingParticipant } = await supabase
    .from('kinkster_conversation_participants')
    .select('conversation_id, status')
    .eq('user_id', senderId);

  if (existingParticipant && existingParticipant.length > 0) {
    const convoIds = existingParticipant.map((p) => p.conversation_id);
    const { data: matchingRecip } = await supabase
      .from('kinkster_conversation_participants')
      .select('conversation_id, status')
      .eq('user_id', recipientId)
      .in('conversation_id', convoIds);

    if (matchingRecip && matchingRecip.length > 0) {
      // Find 1:1 conversation
      const { data: directConvo } = await supabase
        .from('kinkster_conversations')
        .select('id, type')
        .in('id', matchingRecip.map((r) => r.conversation_id))
        .eq('type', 'DIRECT')
        .limit(1)
        .maybeSingle();

      if (directConvo) {
        const recipStatus = matchingRecip.find((r) => r.conversation_id === directConvo.id)?.status;
        if (recipStatus === 'active') {
          return { canMessage: true, requiresRequest: false };
        }
        if (recipStatus === 'declined' || recipStatus === 'blocked') {
          return { canMessage: false, requiresRequest: false, reason: 'Message request was previously closed.' };
        }
        if (recipStatus === 'pending_request') {
          return { canMessage: true, requiresRequest: true, reason: 'Message request is pending acceptance.' };
        }
      }
    }
  }

  // 5. Check mutual Resonance match
  const { data: mutualResonance } = await supabase
    .from('kinkster_resonances')
    .select('id, is_mutual')
    .or(`and(sender_id.eq.${senderId},target_id.eq.${recipientId}),and(sender_id.eq.${recipientId},target_id.eq.${senderId})`)
    .eq('is_mutual', true)
    .limit(1)
    .maybeSingle();

  const hasMutualResonance = !!mutualResonance;

  if (privacySetting === 'resonance_matches') {
    if (hasMutualResonance) {
      return { canMessage: true, requiresRequest: false };
    }
    return { canMessage: false, requiresRequest: false, reason: 'This member only accepts messages from mutual Resonance matches.' };
  }

  // 6. Check follow / connection state
  const { data: followRecords } = await supabase
    .from('kinkster_follows')
    .select('follower_id, following_id')
    .or(`and(follower_id.eq.${senderId},following_id.eq.${recipientId}),and(follower_id.eq.${recipientId},following_id.eq.${senderId})`);

  const senderFollowsRecip = (followRecords || []).some((f) => f.follower_id === senderId && f.following_id === recipientId);
  const recipFollowsSender = (followRecords || []).some((f) => f.follower_id === recipientId && f.following_id === senderId);
  const isMutualConnection = senderFollowsRecip && recipFollowsSender;

  if (privacySetting === 'connections') {
    if (isMutualConnection || hasMutualResonance) {
      return { canMessage: true, requiresRequest: false };
    }
    return { canMessage: false, requiresRequest: true, reason: 'Requires mutual connection or message request.' };
  }

  // 7. Check shared Community / Group membership
  const { data: senderGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('kinkster_id', senderId)
    .eq('status', 'active');

  let hasSharedCommunity = false;
  if (senderGroups && senderGroups.length > 0) {
    const groupIds = senderGroups.map((g) => g.group_id);
    const { data: sharedGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('kinkster_id', recipientId)
      .eq('status', 'active')
      .in('group_id', groupIds)
      .limit(1);

    hasSharedCommunity = !!(sharedGroups && sharedGroups.length > 0);
  }

  if (privacySetting === 'community_members') {
    if (hasSharedCommunity || isMutualConnection || hasMutualResonance) {
      return { canMessage: true, requiresRequest: false };
    }
    return { canMessage: false, requiresRequest: true, reason: 'Requires shared community membership or message request.' };
  }

  // 8. Check shared Event attendance
  const { data: senderEvents } = await supabase
    .from('sanctuary_event_applications')
    .select('event_id')
    .eq('user_id', senderId)
    .eq('status', 'approved');

  let hasSharedEvent = false;
  if (senderEvents && senderEvents.length > 0) {
    const eventIds = senderEvents.map((e) => e.event_id);
    const { data: sharedEvents } = await supabase
      .from('sanctuary_event_applications')
      .select('event_id')
      .eq('user_id', recipientId)
      .eq('status', 'approved')
      .in('event_id', eventIds)
      .limit(1);

    hasSharedEvent = !!(sharedEvents && sharedEvents.length > 0);
  }

  if (privacySetting === 'event_participants') {
    if (hasSharedEvent || isMutualConnection || hasMutualResonance) {
      return { canMessage: true, requiresRequest: false };
    }
    return { canMessage: false, requiresRequest: true, reason: 'Requires shared event attendance or message request.' };
  }

  // 9. 'broader' (default) or 'everyone':
  // If they have any shared context (mutual connection, mutual resonance, shared group, shared event), direct message is allowed.
  // Otherwise, route as a Message Request.
  if (isMutualConnection || hasMutualResonance || hasSharedCommunity || hasSharedEvent) {
    return { canMessage: true, requiresRequest: false };
  }

  return { canMessage: true, requiresRequest: true, reason: 'New contact: requires Message Request.' };
}
