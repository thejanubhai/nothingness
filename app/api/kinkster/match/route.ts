import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // 2. Fetch all other active vetted Kinksters including health_badges and trusted host status
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
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Compute Vibe Match Score (%) for each profile
    const matchedProfiles = (profiles || []).map((prof: any) => {
      const otherPrefs: any[] = prof.kinkster_preferences || [];
      let totalOverlapPoints = 0;
      let maxPossiblePoints = Math.max(1, userKinkMap.size * 5);

      const kinkTags: string[] = [];

      otherPrefs.forEach(op => {
        kinkTags.push(op.kinkster_kinks?.name || op.kink_id);
        if (userKinkMap.has(op.kink_id)) {
          const userIntensity = userKinkMap.get(op.kink_id)!;
          const diff = Math.abs(userIntensity - op.intensity);
          totalOverlapPoints += (5 - diff); // 5 points max per matched kink
        }
      });

      // Calculate percentage score (minimum baseline 65% for vetted members)
      let matchScore = 65;
      if (userKinkMap.size > 0 && otherPrefs.length > 0) {
        const rawScore = Math.round((totalOverlapPoints / maxPossiblePoints) * 35);
        matchScore = Math.min(99, 65 + rawScore);
      } else if (otherPrefs.length > 0) {
        matchScore = 78; // General baseline when user has default preferences
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

    // Sort by highest match score
    matchedProfiles.sort((a, b) => b.match_score - a.match_score);

    return NextResponse.json({ matches: matchedProfiles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
