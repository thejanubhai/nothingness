import { SupabaseClient } from '@supabase/supabase-js';

export type ContextType = 'event' | 'community' | 'post' | 'profile' | 'resonance';

export interface ResolvedContext {
  contextType: ContextType;
  contextId: string;
  isAvailable: boolean;
  title: string;
  subtitle?: string;
  mediaUrl?: string | null;
  badge?: string;
  metadata?: Record<string, any>;
}

/**
 * Resolves context for a conversation or message from real backend records.
 * If the target object is deleted, private, or unauthorized, returns an honest unavailable state.
 */
export async function resolveConversationContext(
  supabase: SupabaseClient<any, any, any>,
  contextType: ContextType | string | null | undefined,
  contextId: string | null | undefined,
  viewerId: string
): Promise<ResolvedContext | null> {
  if (!contextType || !contextId) return null;

  try {
    switch (contextType) {
      case 'event': {
        const { data: event } = await supabase
          .from('sanctuary_events')
          .select('id, title, tagline, tier, event_date, status, cover_image_url')
          .eq('id', contextId)
          .maybeSingle();

        if (!event) {
          return {
            contextType: 'event',
            contextId,
            isAvailable: false,
            title: 'Event Unavailable',
            subtitle: 'This sanctuary event has concluded or is no longer listed.',
          };
        }

        const dateStr = event.event_date ? new Date(event.event_date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : '';

        return {
          contextType: 'event',
          contextId: event.id,
          isAvailable: true,
          title: event.title,
          subtitle: `${event.tier ? event.tier.toUpperCase() + ' • ' : ''}${dateStr}`,
          mediaUrl: event.cover_image_url || null,
          badge: 'Shared Sanctuary Event',
          metadata: {
            status: event.status,
            tier: event.tier,
          },
        };
      }

      case 'community': {
        const { data: group } = await supabase
          .from('groups')
          .select('id, name, slug, category, avatar_url, members_count, visibility')
          .eq('id', contextId)
          .maybeSingle();

        if (!group) {
          return {
            contextType: 'community',
            contextId,
            isAvailable: false,
            title: 'Community Unavailable',
            subtitle: 'This community has been archived or removed.',
          };
        }

        return {
          contextType: 'community',
          contextId: group.id,
          isAvailable: true,
          title: group.name,
          subtitle: `${group.category || 'Lifestyle'} • ${group.members_count || 1} members`,
          mediaUrl: group.avatar_url || null,
          badge: 'Shared Community',
          metadata: {
            slug: group.slug,
            visibility: group.visibility,
          },
        };
      }

      case 'post': {
        const { data: post } = await supabase
          .from('kinkster_posts')
          .select('id, caption, media_url, media_type, created_at, kinkster_profiles(alias)')
          .eq('id', contextId)
          .maybeSingle();

        if (!post) {
          return {
            contextType: 'post',
            contextId,
            isAvailable: false,
            title: 'Post Unavailable',
            subtitle: 'This post has been deleted or is no longer viewable.',
          };
        }

        const authorAlias = (post.kinkster_profiles as any)?.alias || 'member';

        return {
          contextType: 'post',
          contextId: post.id,
          isAvailable: true,
          title: `Reply to Post by @${authorAlias}`,
          subtitle: post.caption ? (post.caption.length > 60 ? post.caption.slice(0, 60) + '...' : post.caption) : 'Media post',
          mediaUrl: post.media_url || null,
          badge: 'Replied to Post',
          metadata: {
            authorAlias,
            mediaType: post.media_type,
          },
        };
      }

      case 'resonance': {
        // Mutual Resonance lookup: only fetch if viewer is a participant
        const { data: resRecord } = await supabase
          .from('kinkster_resonances')
          .select('id, sender_id, target_id, tags, is_mutual, chamber_token, expires_at')
          .or(`sender_id.eq.${viewerId},target_id.eq.${viewerId}`)
          .eq('is_mutual', true)
          .maybeSingle();

        if (!resRecord) {
          return {
            contextType: 'resonance',
            contextId,
            isAvailable: false,
            title: 'Resonance Expired',
            subtitle: 'Mutual resonance match has expired or is no longer active.',
          };
        }

        return {
          contextType: 'resonance',
          contextId: resRecord.id,
          isAvailable: true,
          title: 'Mutual Desire Resonance',
          subtitle: (resRecord.tags && resRecord.tags.length > 0) ? resRecord.tags.join(' • ') : 'Matched Intentions',
          badge: 'Dual-Blind Resonance Lock',
          metadata: {
            tags: resRecord.tags || [],
            expiresAt: resRecord.expires_at,
          },
        };
      }

      case 'profile': {
        const { data: profile } = await supabase
          .from('kinkster_profiles')
          .select('id, alias, avatar_url, bio, is_in_person_vetted')
          .eq('id', contextId)
          .maybeSingle();

        if (!profile) {
          return {
            contextType: 'profile',
            contextId,
            isAvailable: false,
            title: 'Profile Unavailable',
            subtitle: 'This member profile is unavailable.',
          };
        }

        return {
          contextType: 'profile',
          contextId: profile.id,
          isAvailable: true,
          title: `@${profile.alias}`,
          subtitle: profile.bio ? (profile.bio.length > 50 ? profile.bio.slice(0, 50) + '...' : profile.bio) : 'Verified Member',
          mediaUrl: profile.avatar_url || null,
          badge: 'Member Profile',
          metadata: {
            alias: profile.alias,
            isVetted: profile.is_in_person_vetted,
          },
        };
      }

      default:
        return null;
    }
  } catch (err) {
    console.error('Error resolving conversation context:', err);
    return {
      contextType: contextType as ContextType,
      contextId,
      isAvailable: false,
      title: 'Unavailable Context',
    };
  }
}
