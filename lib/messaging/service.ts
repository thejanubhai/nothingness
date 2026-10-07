import { SupabaseClient } from '@/lib/supabase/client';
import { canUserMessage } from './permissions';
import { resolveConversationContext, ContextType } from './context';

export interface SendMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: 'text' | 'photo' | 'video' | 'voice' | 'burn_photo' | 'share_post' | 'share_event' | 'share_profile' | 'system';
  mediaUrl?: string | null;
  mediaMetadata?: Record<string, any>;
  isViewOnce?: boolean;
  burnCountdownSeconds?: number;
  idempotencyKey?: string | null;
  contextType?: ContextType | string | null;
  contextId?: string | null;
  contextData?: Record<string, any>;
}

export interface GetOrCreateDirectOptions {
  senderId: string;
  recipientId: string;
  contextType?: ContextType | string | null;
  contextId?: string | null;
  contextData?: Record<string, any>;
  isEphemeral?: boolean;
  retentionHours?: number;
}

/**
 * Core Canonical Messaging Service
 */
export class MessagingService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Finds existing 1:1 conversation or creates a new normalized conversation.
   * Prevents duplicate 1:1 conversations between the same pair of participants.
   */
  async getOrCreateDirectConversation(options: GetOrCreateDirectOptions) {
    const {
      senderId,
      recipientId,
      contextType,
      contextId,
      contextData = {},
      isEphemeral = false,
      retentionHours = 24,
    } = options;

    // 1. Permission check
    const perm = await canUserMessage(this.supabase, senderId, recipientId);
    if (!perm.canMessage && !perm.requiresRequest) {
      throw new Error(perm.reason || 'Cannot initiate conversation with this member.');
    }

    const conversationType = perm.requiresRequest ? 'MESSAGE_REQUEST' : (isEphemeral ? 'EPHEMERAL' : 'DIRECT');

    // 2. Check for an existing conversation between these two users
    const { data: senderParts } = await this.supabase
      .from('kinkster_conversation_participants')
      .select('conversation_id, status')
      .eq('user_id', senderId);

    if (senderParts && senderParts.length > 0) {
      const convoIds = senderParts.map((p) => p.conversation_id);

      const { data: recipParts } = await this.supabase
        .from('kinkster_conversation_participants')
        .select('conversation_id, status')
        .eq('user_id', recipientId)
        .in('conversation_id', convoIds);

      if (recipParts && recipParts.length > 0) {
        // Find existing conversation record that is DIRECT or MESSAGE_REQUEST or matching EPHEMERAL
        const matchingIds = recipParts.map((r) => r.conversation_id);
        const { data: existingConvo } = await this.supabase
          .from('kinkster_conversations')
          .select('*')
          .in('id', matchingIds)
          .in('type', isEphemeral ? ['EPHEMERAL', 'RESONANCE'] : ['DIRECT', 'MESSAGE_REQUEST'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingConvo) {
          // If a new context is provided, update conversation context if not set
          if (contextType && (!existingConvo.context_type || existingConvo.context_id !== contextId)) {
            await this.supabase
              .from('kinkster_conversations')
              .update({
                context_type: contextType,
                context_id: contextId,
                context_data: contextData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingConvo.id);
          }
          return { conversation: existingConvo, isNew: false, requiresRequest: perm.requiresRequest };
        }
      }
    }

    // 3. Create new conversation
    const expiresAt = isEphemeral ? new Date(Date.now() + retentionHours * 3600000).toISOString() : null;

    const { data: newConvo, error: convoErr } = await this.supabase
      .from('kinkster_conversations')
      .insert({
        type: conversationType,
        context_type: contextType || null,
        context_id: contextId || null,
        context_data: contextData,
        created_by: senderId,
        retention_policy: isEphemeral ? `ephemeral_${retentionHours}h` : 'permanent',
        expires_at: expiresAt,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convoErr) throw convoErr;

    // 4. Add both participants
    const senderStatus = 'active';
    const recipientStatus = perm.requiresRequest ? 'pending_request' : 'active';

    const { error: partErr } = await this.supabase
      .from('kinkster_conversation_participants')
      .insert([
        {
          conversation_id: newConvo.id,
          user_id: senderId,
          role: 'owner',
          status: senderStatus,
          last_read_at: new Date().toISOString(),
          unread_count: 0,
        },
        {
          conversation_id: newConvo.id,
          user_id: recipientId,
          role: 'member',
          status: recipientStatus,
          last_read_at: new Date(0).toISOString(),
          unread_count: 0,
        },
      ]);

    if (partErr) throw partErr;

    return { conversation: newConvo, isNew: true, requiresRequest: perm.requiresRequest };
  }

  /**
   * Provisions or fetches a canonical 48h ephemeral chamber conversation for a mutual Resonance match
   */
  async getOrCreateResonanceConversation(userAId: string, userBId: string, tags: string[] = []) {
    // Check if resonance conversation already exists
    const { data: senderParts } = await this.supabase
      .from('kinkster_conversation_participants')
      .select('conversation_id')
      .eq('user_id', userAId);

    if (senderParts && senderParts.length > 0) {
      const convoIds = senderParts.map((p) => p.conversation_id);
      const { data: recipParts } = await this.supabase
        .from('kinkster_conversation_participants')
        .select('conversation_id')
        .eq('user_id', userBId)
        .in('conversation_id', convoIds);

      if (recipParts && recipParts.length > 0) {
        const { data: existingResConvo } = await this.supabase
          .from('kinkster_conversations')
          .select('*')
          .in('id', recipParts.map((r) => r.conversation_id))
          .eq('type', 'RESONANCE')
          .limit(1)
          .maybeSingle();

        if (existingResConvo) {
          return existingResConvo;
        }
      }
    }

    const expiresAt = new Date(Date.now() + 48 * 3600000).toISOString();

    const { data: newConvo, error: cErr } = await this.supabase
      .from('kinkster_conversations')
      .insert({
        type: 'RESONANCE',
        context_type: 'resonance',
        context_id: `res_${[userAId, userBId].sort().join('_')}`,
        context_data: { tags, matchedAt: new Date().toISOString() },
        created_by: userAId,
        retention_policy: 'ephemeral_48h',
        expires_at: expiresAt,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (cErr) throw cErr;

    await this.supabase
      .from('kinkster_conversation_participants')
      .insert([
        { conversation_id: newConvo.id, user_id: userAId, role: 'member', status: 'active', unread_count: 0 },
        { conversation_id: newConvo.id, user_id: userBId, role: 'member', status: 'active', unread_count: 0 },
      ]);

    return newConvo;
  }

  /**
   * Sends a message within a conversation with idempotency protection and read receipt tracking
   */
  async sendMessage(params: SendMessageParams) {
    const {
      conversationId,
      senderId,
      content,
      messageType = 'text',
      mediaUrl = null,
      mediaMetadata = {},
      isViewOnce = false,
      burnCountdownSeconds = 5,
      idempotencyKey = null,
      contextType = null,
      contextId = null,
      contextData = {},
    } = params;

    // 1. Check idempotency key: prevent duplicate sends from double-taps/retries
    if (idempotencyKey) {
      const { data: existingMsg } = await this.supabase
        .from('kinkster_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingMsg) {
        return { message: existingMsg, isDuplicate: true };
      }
    }

    // 2. Validate sender is an active participant in this conversation
    const { data: participant } = await this.supabase
      .from('kinkster_conversation_participants')
      .select('id, status')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();

    if (!participant || (participant.status !== 'active' && participant.status !== 'pending_request')) {
      throw new Error('You do not have permission to post in this conversation.');
    }

    // 3. Inspect conversation retention policy
    const { data: convo } = await this.supabase
      .from('kinkster_conversations')
      .select('retention_policy, expires_at')
      .eq('id', conversationId)
      .single();

    let msgExpiresAt: string | null = null;
    if (convo?.expires_at) {
      msgExpiresAt = convo.expires_at;
    } else if (messageType === 'burn_photo' || isViewOnce) {
      // Burn on read: 24h default maximum shelf-life if unopened
      msgExpiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    }

    const resolvedMessageType = isViewOnce ? 'burn_photo' : messageType;

    // 4. Insert message
    const { data: newMessage, error: msgErr } = await this.supabase
      .from('kinkster_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_type: resolvedMessageType,
        content: content || (resolvedMessageType === 'burn_photo' ? '🔥 [Burn on Read Photo]' : resolvedMessageType === 'voice' ? '🎙️ [Voice Whisper]' : ''),
        media_url: mediaUrl,
        media_metadata: mediaMetadata,
        is_view_once: isViewOnce || resolvedMessageType === 'burn_photo',
        is_burnt: false,
        burn_countdown_seconds: burnCountdownSeconds,
        status: 'sent',
        idempotency_key: idempotencyKey,
        context_type: contextType,
        context_id: contextId,
        context_data: contextData,
        expires_at: msgExpiresAt,
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // 5. Update conversation timestamp & last message preview
    const previewText = resolvedMessageType === 'burn_photo'
      ? '🔥 Burn-on-Read Photo'
      : resolvedMessageType === 'voice'
      ? '🎙️ Voice Whisper'
      : content.length > 80 ? content.slice(0, 80) + '...' : content;

    const now = new Date().toISOString();
    await this.supabase
      .from('kinkster_conversations')
      .update({
        last_message_id: newMessage.id,
        last_message_at: now,
        last_message_preview: previewText,
        updated_at: now,
      })
      .eq('id', conversationId);

    // 6. Update unread count for other participants
    const { data: otherParticipants } = await this.supabase
      .from('kinkster_conversation_participants')
      .select('id, user_id, unread_count')
      .eq('conversation_id', conversationId)
      .neq('user_id', senderId);

    if (otherParticipants && otherParticipants.length > 0) {
      for (const op of otherParticipants) {
        await this.supabase
          .from('kinkster_conversation_participants')
          .update({
            unread_count: (op.unread_count || 0) + 1,
            updated_at: now,
          })
          .eq('id', op.id);
      }
    }

    return { message: newMessage, isDuplicate: false };
  }

  /**
   * Marks all messages in a conversation as read for a specific user
   */
  async markConversationAsRead(conversationId: string, userId: string) {
    const now = new Date().toISOString();

    const { error } = await this.supabase
      .from('kinkster_conversation_participants')
      .update({
        last_read_at: now,
        unread_count: 0,
        updated_at: now,
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Handles message request decisions: accept, decline, block
   */
  async handleMessageRequest(conversationId: string, recipientId: string, action: 'accept' | 'decline' | 'block') {
    const { data: convo } = await this.supabase
      .from('kinkster_conversations')
      .select('id, type, created_by')
      .eq('id', conversationId)
      .single();

    if (!convo) throw new Error('Conversation not found');

    if (action === 'accept') {
      // 1. Update participant status to active
      await this.supabase
        .from('kinkster_conversation_participants')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', recipientId);

      // 2. Elevate conversation type from MESSAGE_REQUEST to DIRECT
      await this.supabase
        .from('kinkster_conversations')
        .update({ type: 'DIRECT', updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, status: 'active' };
    }

    if (action === 'decline') {
      // Decline without creating an embarrassing rejection signal to the sender
      await this.supabase
        .from('kinkster_conversation_participants')
        .update({ status: 'declined', is_hidden: true, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', recipientId);

      return { success: true, status: 'declined' };
    }

    if (action === 'block') {
      // Block the sender
      if (convo.created_by && convo.created_by !== recipientId) {
        await this.supabase
          .from('kinkster_blocks')
          .upsert({ blocker_id: recipientId, blocked_id: convo.created_by }, { onConflict: 'blocker_id,blocked_id' });
      }

      await this.supabase
        .from('kinkster_conversation_participants')
        .update({ status: 'blocked', is_hidden: true, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', recipientId);

      return { success: true, status: 'blocked' };
    }

    throw new Error('Invalid message request action');
  }

  /**
   * Server-side burn-on-read shredder: destroys media URL from database
   */
  async burnEphemeralMessage(messageId: string, userId: string) {
    const now = new Date().toISOString();

    const { data: msg } = await this.supabase
      .from('kinkster_messages')
      .select('id, conversation_id, media_url, is_burnt')
      .eq('id', messageId)
      .single();

    if (!msg) throw new Error('Message not found');
    if (msg.is_burnt) return { success: true, alreadyBurnt: true };

    const { error } = await this.supabase
      .from('kinkster_messages')
      .update({
        is_burnt: true,
        burnt_at: now,
        content: '[Burned Photo • Shredded]',
        media_url: null, // Clear private media storage URL completely
        updated_at: now,
      })
      .eq('id', messageId);

    if (error) throw error;
    return { success: true, burnt: true };
  }
}
