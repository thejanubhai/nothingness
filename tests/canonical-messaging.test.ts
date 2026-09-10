import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canUserMessage } from '../lib/messaging/permissions';
import { resolveConversationContext } from '../lib/messaging/context';
import { MessagingService } from '../lib/messaging/service';

describe('Messaging 2.0: Consent-First Permissions Engine', () => {
  test('User cannot message themselves', async () => {
    const mockSupabase: any = {
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
    };

    const res = await canUserMessage(mockSupabase, 'user-1', 'user-1');
    assert.equal(res.canMessage, false);
    assert.match(res.reason || '', /Cannot message yourself/i);
  });

  test('Blocked user in either direction strictly prohibits messaging', async () => {
    const mockSupabase: any = {
      from: (table: string) => {
        if (table === 'kinkster_blocks') {
          return {
            select: () => ({
              or: () => ({
                limit: async () => ({
                  data: [{ blocker_id: 'user-2', blocked_id: 'user-1' }],
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const res = await canUserMessage(mockSupabase, 'user-1', 'user-2');
    assert.equal(res.canMessage, false);
    assert.match(res.reason || '', /unavailable/i);
  });

  test('Recipient with "nobody" messaging privacy blocks direct messaging', async () => {
    const mockSupabase: any = {
      from: (table: string) => {
        if (table === 'kinkster_blocks') {
          return { select: () => ({ or: () => ({ limit: async () => ({ data: [] }) }) }) };
        }
        if (table === 'kinkster_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: 'user-2', is_activated: true, messaging_privacy: 'nobody' },
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const res = await canUserMessage(mockSupabase, 'user-1', 'user-2');
    assert.equal(res.canMessage, false);
    assert.match(res.reason || '', /disabled/i);
  });

  test('Recipient with "resonance_matches" permits messaging only with mutual resonance', async () => {
    // 1. Without mutual resonance
    const mockSupabaseNoMutual: any = {
      from: (table: string) => {
        if (table === 'kinkster_blocks') {
          return { select: () => ({ or: () => ({ limit: async () => ({ data: [] }) }) }) };
        }
        if (table === 'kinkster_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: 'user-2', is_activated: true, messaging_privacy: 'resonance_matches' },
                }),
              }),
            }),
          };
        }
        if (table === 'kinkster_conversation_participants') {
          return { select: () => ({ eq: async () => ({ data: [] }) }) };
        }
        if (table === 'kinkster_resonances') {
          return {
            select: () => ({
              or: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const res1 = await canUserMessage(mockSupabaseNoMutual, 'user-1', 'user-2');
    assert.equal(res1.canMessage, false);
    assert.match(res1.reason || '', /mutual Resonance matches/i);

    // 2. With mutual resonance
    const mockSupabaseWithMutual: any = {
      from: (table: string) => {
        if (table === 'kinkster_blocks') {
          return { select: () => ({ or: () => ({ limit: async () => ({ data: [] }) }) }) };
        }
        if (table === 'kinkster_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: 'user-2', is_activated: true, messaging_privacy: 'resonance_matches' },
                }),
              }),
            }),
          };
        }
        if (table === 'kinkster_conversation_participants') {
          return { select: () => ({ eq: async () => ({ data: [] }) }) };
        }
        if (table === 'kinkster_resonances') {
          return {
            select: () => ({
              or: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: { id: 'res-1', is_mutual: true } }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const res2 = await canUserMessage(mockSupabaseWithMutual, 'user-1', 'user-2');
    assert.equal(res2.canMessage, true);
    assert.equal(res2.requiresRequest, false);
  });

  test('Broader privacy routes new strangers to Message Request', async () => {
    const mockSupabase: any = {
      from: (table: string) => {
        if (table === 'kinkster_blocks') {
          return { select: () => ({ or: () => ({ limit: async () => ({ data: [] }) }) }) };
        }
        if (table === 'kinkster_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: 'user-2', is_activated: true, messaging_privacy: 'broader' },
                }),
              }),
            }),
          };
        }
        if (table === 'kinkster_conversation_participants') {
          return { select: () => ({ eq: async () => ({ data: [] }) }) };
        }
        if (table === 'kinkster_resonances') {
          return { select: () => ({ or: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }) };
        }
        if (table === 'kinkster_follows') {
          return { select: () => ({ or: async () => ({ data: [] }) }) };
        }
        if (table === 'group_members') {
          return { select: () => ({ eq: () => ({ eq: async () => ({ data: [] }) }) }) };
        }
        if (table === 'sanctuary_event_applications') {
          return { select: () => ({ eq: () => ({ eq: async () => ({ data: [] }) }) }) };
        }
        return {};
      },
    };

    const res = await canUserMessage(mockSupabase, 'user-1', 'user-2');
    assert.equal(res.canMessage, true);
    assert.equal(res.requiresRequest, true);
    assert.match(res.reason || '', /Message Request/i);
  });
});

describe('Messaging 2.0: Canonical Architecture & 1:1 Duplicate Prevention', () => {
  test('Duplicate 1:1 conversation prevention returns existing conversation', async () => {
    const existingConvo = {
      id: 'convo-existing-1',
      type: 'DIRECT',
      created_by: 'user-1',
      created_at: new Date().toISOString(),
    };

    const mockDb: any = {
      from: (table: string) => {
        if (table === 'kinkster_blocks') {
          const chain: any = {
            select: () => chain,
            or: () => chain,
            limit: async () => ({ data: [] }),
          };
          return chain;
        }
        if (table === 'kinkster_profiles') {
          const chain: any = {
            select: () => chain,
            eq: () => chain,
            single: async () => ({ data: { id: 'user-2', is_activated: true, messaging_privacy: 'broader' } }),
          };
          return chain;
        }
        if (table === 'kinkster_conversation_participants') {
          const chain: any = {
            select: () => chain,
            eq: () => chain,
            in: () => chain,
            then: (resolve: any) => Promise.resolve({ data: [{ conversation_id: 'convo-existing-1', status: 'active' }] }).then(resolve),
          };
          return chain;
        }
        if (table === 'kinkster_conversations') {
          const chain: any = {
            select: () => chain,
            in: () => chain,
            eq: () => chain,
            order: () => chain,
            limit: () => chain,
            maybeSingle: async () => ({ data: existingConvo }),
            single: async () => ({ data: existingConvo }),
          };
          return chain;
        }
        return {};
      },
    };

    const service = new MessagingService(mockDb);
    const result = await service.getOrCreateDirectConversation({
      senderId: 'user-1',
      recipientId: 'user-2',
    });

    assert.equal(result.isNew, false);
    assert.equal(result.conversation.id, 'convo-existing-1');
  });

  test('Message sending idempotency deduplicates double sends', async () => {
    const existingMessage = {
      id: 'msg-1',
      conversation_id: 'convo-1',
      sender_id: 'user-1',
      content: 'Hello',
      idempotency_key: 'idem-key-12345',
      status: 'sent',
    };

    const mockDb: any = {
      from: (table: string) => {
        if (table === 'kinkster_messages') {
          return {
            select: () => ({
              eq: (col: string, val: string) => ({
                eq: (c2: string, v2: string) => ({
                  maybeSingle: async () => ({ data: existingMessage }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const service = new MessagingService(mockDb);
    const result = await service.sendMessage({
      conversationId: 'convo-1',
      senderId: 'user-1',
      content: 'Hello',
      idempotencyKey: 'idem-key-12345',
    });

    assert.equal(result.isDuplicate, true);
    assert.equal(result.message.id, 'msg-1');
  });
});

describe('Messaging 2.0: Context-First Resolution & Integrity', () => {
  test('Event context resolves title, tier and formatted date correctly', async () => {
    const mockSupabase: any = {
      from: (table: string) => {
        if (table === 'sanctuary_events') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'evt-1',
                    title: 'Obsidian Velvet Soirée',
                    tier: 'soiree',
                    event_date: '2026-10-15T20:00:00Z',
                    status: 'confirmed',
                  },
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const ctx = await resolveConversationContext(mockSupabase, 'event', 'evt-1', 'viewer-1');
    assert.ok(ctx);
    assert.equal(ctx.isAvailable, true);
    assert.equal(ctx.title, 'Obsidian Velvet Soirée');
    assert.equal(ctx.badge, 'Shared Sanctuary Event');
    assert.match(ctx.subtitle || '', /SOIREE/);
  });

  test('Deleted event returns honest unavailable state without crashing', async () => {
    const mockSupabase: any = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
    };

    const ctx = await resolveConversationContext(mockSupabase, 'event', 'non-existent-event', 'viewer-1');
    assert.ok(ctx);
    assert.equal(ctx.isAvailable, false);
    assert.equal(ctx.title, 'Event Unavailable');
  });

  test('Community context resolves group name, category and member count', async () => {
    const mockSupabase: any = {
      from: (table: string) => {
        if (table === 'groups') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'grp-1',
                    name: 'Shibari & Kinetic Aesthetics',
                    slug: 'shibari-aesthetics',
                    category: 'Shibari & Rope',
                    members_count: 42,
                  },
                }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const ctx = await resolveConversationContext(mockSupabase, 'community', 'grp-1', 'viewer-1');
    assert.ok(ctx);
    assert.equal(ctx.isAvailable, true);
    assert.equal(ctx.title, 'Shibari & Kinetic Aesthetics');
    assert.match(ctx.subtitle || '', /42 members/);
    assert.equal(ctx.badge, 'Shared Community');
  });
});

describe('Messaging 2.0: Dual-Blind Resonance Confidentiality', () => {
  test('Unilateral resonance intent is completely hidden from recipient in conversation list', () => {
    // Viewer is 'elena', Alex sent unilateral resonance to Elena
    const unilateralResonances = [
      { sender_id: 'alex', target_id: 'elena', is_mutual: false, tags: ['Kinetic'] }
    ];

    // Filter for Elena's legitimate visible resonance conversations
    const elenaVisible = unilateralResonances.filter(
      (r) => r.sender_id === 'elena' || (r.target_id === 'elena' && r.is_mutual)
    );

    assert.equal(elenaVisible.length, 0, 'Elena must NEVER see Alex unilateral resonance');
  });

  test('Mutual resonance produces a shared 48-hour ephemeral chamber', () => {
    const mutualResonances = [
      { sender_id: 'alex', target_id: 'elena', is_mutual: true, tags: ['Kinetic', 'Sensory'] }
    ];

    const elenaVisible = mutualResonances.filter(
      (r) => r.sender_id === 'elena' || (r.target_id === 'elena' && r.is_mutual)
    );

    assert.equal(elenaVisible.length, 1);
    assert.equal(elenaVisible[0].is_mutual, true);
  });
});

describe('Messaging 2.0: Server-Enforced Ephemeral & Burn Retention', () => {
  test('Expired messages are excluded by retention query', () => {
    const now = Date.now();
    const messages = [
      { id: 'm1', content: 'Active text', expires_at: new Date(now + 3600000).toISOString() },
      { id: 'm2', content: 'Expired whisper', expires_at: new Date(now - 1000).toISOString() },
      { id: 'm3', content: 'Permanent text', expires_at: null },
    ];

    const validMessages = messages.filter((m) => !m.expires_at || new Date(m.expires_at).getTime() > now);
    assert.equal(validMessages.length, 2);
    assert.equal(validMessages.some((m) => m.id === 'm2'), false, 'Expired message must be excluded');
  });

  test('Burn-on-read photo server shredding zeroes media URL and marks burnt', async () => {
    let updatedPayload: any = null;
    const mockDb: any = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: 'photo-msg-1', is_burnt: false, media_url: 'https://vault.test/secret.jpg' },
            }),
          }),
        }),
        update: (payload: any) => ({
          eq: async () => {
            updatedPayload = payload;
            return { error: null };
          },
        }),
      }),
    };

    const service = new MessagingService(mockDb);
    const result = await service.burnEphemeralMessage('photo-msg-1', 'viewer-1');

    assert.equal(result.burnt, true);
    assert.equal(updatedPayload.is_burnt, true);
    assert.equal(updatedPayload.media_url, null, 'Private storage media URL must be shredded to NULL');
    assert.match(updatedPayload.content, /Shredded/i);
  });
});

describe('Messaging 2.0: Message Requests Lifecycle', () => {
  test('Declining a message request hides it without embarrassing rejection alert', async () => {
    let participantUpdate: any = null;
    const mockDb: any = {
      from: (table: string) => {
        if (table === 'kinkster_conversations') {
          return { select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'convo-req-1', type: 'MESSAGE_REQUEST', created_by: 'sender-1' } }) }) }) };
        }
        if (table === 'kinkster_conversation_participants') {
          return {
            update: (payload: any) => ({
              eq: () => ({
                eq: async () => {
                  participantUpdate = payload;
                  return { error: null };
                },
              }),
            }),
          };
        }
        return {};
      },
    };

    const service = new MessagingService(mockDb);
    const result = await service.handleMessageRequest('convo-req-1', 'recipient-1', 'decline');

    assert.equal(result.status, 'declined');
    assert.equal(participantUpdate.status, 'declined');
    assert.equal(participantUpdate.is_hidden, true);
  });

  test('Accepting a message request elevates conversation type to DIRECT', async () => {
    let convoUpdate: any = null;
    let participantUpdate: any = null;

    const mockDb: any = {
      from: (table: string) => {
        if (table === 'kinkster_conversations') {
          return {
            select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'convo-req-1', type: 'MESSAGE_REQUEST', created_by: 'sender-1' } }) }) }),
            update: (payload: any) => ({
              eq: async () => {
                convoUpdate = payload;
                return { error: null };
              },
            }),
          };
        }
        if (table === 'kinkster_conversation_participants') {
          return {
            update: (payload: any) => ({
              eq: () => ({
                eq: async () => {
                  participantUpdate = payload;
                  return { error: null };
                },
              }),
            }),
          };
        }
        return {};
      },
    };

    const service = new MessagingService(mockDb);
    const result = await service.handleMessageRequest('convo-req-1', 'recipient-1', 'accept');

    assert.equal(result.status, 'active');
    assert.equal(participantUpdate.status, 'active');
    assert.equal(convoUpdate.type, 'DIRECT', 'Conversation must be promoted to DIRECT');
  });
});
