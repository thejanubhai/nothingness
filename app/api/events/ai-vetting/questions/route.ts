import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateConciergeQuestions } from '@/lib/events/ai-vetting';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, category } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Fetch Event Details
    const { data: event, error: eventError } = await supabase
      .from('sanctuary_events')
      .select('id, title, tagline, tier, dress_code')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch User Alias
    const { data: profile } = await supabase
      .from('kinkster_profiles')
      .select('alias')
      .eq('id', user.id)
      .single();

    const alias = profile?.alias || 'guest_' + user.id.slice(0, 5);

    const questions = await generateConciergeQuestions(
      {
        title: event.title,
        tagline: event.tagline,
        tier: event.tier,
        dress_code: event.dress_code,
      },
      {
        alias,
        category: category || 'couple',
      }
    );

    return NextResponse.json({ success: true, questions, alias });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
