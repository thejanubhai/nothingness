import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CURATED_FLAGSHIP_PROFILES = [
  {
    id: 'persona-velvet-nocturne',
    alias: 'velvet_nocturne',
    bio: 'Drawn to the quiet tension of Japanese Shibari before release. Frequent guest at The Void suite for unhurried weekend evenings.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    interests: ['Shibari Aesthetics', 'Sensory Play', 'Deep Aftercare'],
    kink_tags: ['Rope & Shibari', 'Power Exchange', 'Sensory Deprivation'],
    match_score: 97,
    is_trusted_host: true,
    audio_vibe_url: null,
    health_badges: [{ badge_name: 'Verified Guest Screening', status: 'verified', verified_at: '2026-08-15' }]
  },
  {
    id: 'persona-obsidian-duo',
    alias: 'obsidian_silk_duo',
    bio: 'Aesthetic lifestyle couple in Gurgaon & South Delhi. We host private wine tastings, attend masked soirées, and appreciate absolute consent.',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    interests: ['Couple Dynamic', 'Jacuzzi Soaks', 'Noir Masquerades'],
    kink_tags: ['Couples Lifestyle', 'Atmospheric Luxury', 'Sensory Immersion'],
    match_score: 94,
    is_trusted_host: true,
    audio_vibe_url: null,
    health_badges: [{ badge_name: 'Verified Guest Screening', status: 'verified', verified_at: '2026-08-10' }]
  },
  {
    id: 'persona-aria-shibari',
    alias: 'aria_shibari',
    bio: 'Rigger and tactile explorer. Precision floor ties, suspension lines, and restorative grounding aftercare in secluded sanctuaries.',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    interests: ['Floor Rope', 'Suspension', 'Mindfulness'],
    kink_tags: ['Shibari', 'Anatomy Safety', 'Meditation'],
    match_score: 91,
    is_trusted_host: false,
    audio_vibe_url: null,
    health_badges: [{ badge_name: 'Verified Guest Screening', status: 'verified', verified_at: '2026-08-20' }]
  },
  {
    id: 'persona-kinkster-architect',
    alias: 'kinkster_architect',
    bio: 'Architect fascinated by structured restraint, brutalist geometry, and sensory isolation. Environment dictates intimacy.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    interests: ['Dominance', 'Brutalist Suites', 'Heavy Rigging'],
    kink_tags: ['Power Dynamics', 'Architectural Stays', 'Restraint'],
    match_score: 88,
    is_trusted_host: true,
    audio_vibe_url: null,
    health_badges: []
  },
  {
    id: 'persona-aurora-sub',
    alias: 'aurora_sub',
    bio: 'Consensual surrender, candlelit silence, and deep emotional aftercare in secluded suites.',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    interests: ['Surrender', 'Aftercare', 'Aromatherapy'],
    kink_tags: ['Submission', 'Candlelight Bath Soaks', 'Silk Blindfolds'],
    match_score: 85,
    is_trusted_host: false,
    audio_vibe_url: null,
    health_badges: []
  },
  {
    id: 'persona-nocturnal-switch',
    alias: 'nocturnal_switch',
    bio: 'Sound designer exploring sensory deprivation, dark ambient frequencies, and quiet midnight conversations over champagne.',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    interests: ['Switch Polarity', 'Dark Vinyl', 'Sensory Immersion'],
    kink_tags: ['Sensory Play', 'Dark Techno', 'Switch Dynamics'],
    match_score: 82,
    is_trusted_host: false,
    audio_vibe_url: null,
    health_badges: []
  }
];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch current user's preferences
    const { data: userPrefs } = await supabase
      .from('kinkster_preferences')
      .select('kink_id, intensity')
      .eq('kinkster_id', user.id);

    const userKinkMap = new Map<string, number>();
    (userPrefs || []).forEach(p => userKinkMap.set(p.kink_id, p.intensity));

    // 2. Fetch all other active vetted Kinksters
    const { data: profiles, error: profileError } = await supabase
      .from('kinkster_profiles')
      .select(`
        id,
        alias,
        bio,
        avatar_url,
        interests,
        health_badges,
        audio_vibe_url,
        is_trusted_host,
        created_at,
        kinkster_preferences (
          kink_id,
          intensity,
          kinkster_kinks (
            name,
            category
          )
        )
      `)
      .eq('is_activated', true)
      .neq('id', user.id);

    if (profileError) {
      console.error('Profile query error:', profileError);
    }

    // 3. Compute Vibe Match Score (%) for each DB profile
    let matchedProfiles = (profiles || []).map((prof: any) => {
      const otherPrefs: any[] = prof.kinkster_preferences || [];
      let totalOverlapPoints = 0;
      let maxPossiblePoints = Math.max(1, userKinkMap.size * 5);

      const kinkTags: string[] = [];

      otherPrefs.forEach(op => {
        kinkTags.push(op.kinkster_kinks?.name || op.kink_id);
        if (userKinkMap.has(op.kink_id)) {
          const userIntensity = userKinkMap.get(op.kink_id)!;
          const diff = Math.abs(userIntensity - op.intensity);
          totalOverlapPoints += (5 - diff);
        }
      });

      let matchScore = 65;
      if (userKinkMap.size > 0 && otherPrefs.length > 0) {
        const rawScore = Math.round((totalOverlapPoints / maxPossiblePoints) * 35);
        matchScore = Math.min(99, 65 + rawScore);
      } else if (otherPrefs.length > 0) {
        matchScore = 78;
      }

      return {
        id: prof.id,
        alias: prof.alias,
        bio: prof.bio,
        avatar_url: prof.avatar_url,
        interests: prof.interests || [],
        kink_tags: kinkTags,
        match_score: matchScore,
        health_badges: prof.health_badges || [],
        audio_vibe_url: prof.audio_vibe_url || null,
        is_trusted_host: prof.is_trusted_host || false
      };
    });

    // If no profiles in database yet, fall back to our curated flagship personas so members always have vetted peers to browse
    if (matchedProfiles.length === 0) {
      matchedProfiles = CURATED_FLAGSHIP_PROFILES;
    }

    // Sort by highest match score
    matchedProfiles.sort((a, b) => b.match_score - a.match_score);

    return NextResponse.json({ matches: matchedProfiles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
