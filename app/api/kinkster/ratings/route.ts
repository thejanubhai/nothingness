import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const targetAlias = searchParams.get('alias');

    if (!targetAlias) {
      return NextResponse.json({ error: 'Target alias is required.' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', targetAlias.toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Alias not found' }, { status: 404 });
    }

    const { data: ratings, error } = await supabase
      .from('kinkster_ratings')
      .select('discretion_score, respect_score, communication_score')
      .eq('target_id', profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({
        total_ratings: 0,
        avg_discretion: 5.0,
        avg_respect: 5.0,
        avg_overall: 5.0
      });
    }

    const total = ratings.length;
    const sumDiscretion = ratings.reduce((acc, r) => acc + (r.discretion_score || 5), 0);
    const sumRespect = ratings.reduce((acc, r) => acc + (r.respect_score || 5), 0);

    const avgDiscretion = (sumDiscretion / total).toFixed(1);
    const avgRespect = (sumRespect / total).toFixed(1);
    const avgOverall = (((sumDiscretion + sumRespect) / (total * 2))).toFixed(1);

    return NextResponse.json({
      total_ratings: total,
      avg_discretion: parseFloat(avgDiscretion),
      avg_respect: parseFloat(avgRespect),
      avg_overall: parseFloat(avgOverall)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_alias, discretion_score, respect_score, communication_score, feedback_text } = await req.json();

    if (!target_alias) {
      return NextResponse.json({ error: 'Target alias is required.' }, { status: 400 });
    }

    const { data: targetProfile } = await supabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', target_alias.toLowerCase())
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'Target alias not found.' }, { status: 404 });
    }

    const { data: rating, error: insertError } = await supabase
      .from('kinkster_ratings')
      .upsert({
        rater_id: user.id,
        target_id: targetProfile.id,
        discretion_score: discretion_score || 5,
        respect_score: respect_score || 5,
        communication_score: communication_score || 5,
        feedback_text: feedback_text || ''
      }, { onConflict: 'rater_id,target_id' })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, rating });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
