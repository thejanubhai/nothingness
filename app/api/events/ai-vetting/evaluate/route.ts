import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateVettingAnswers } from '@/lib/events/ai-vetting';
import { checkAndPromoteWaitlistedCandidates } from '@/lib/events/ratio-balancer';
import { sendPushNotificationToUser } from '@/lib/webpush';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, category, qaList } = await req.json();

    if (!eventId || !qaList || !Array.isArray(qaList)) {
      return NextResponse.json({ error: 'Invalid application payload' }, { status: 400 });
    }

    // Fetch Event Details
    const { data: event, error: eventError } = await supabase
      .from('sanctuary_events')
      .select('*')
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

    // AI Evaluation
    const evaluation = await evaluateVettingAnswers(
      { title: event.title, tier: event.tier },
      { alias, category: category || 'couple' },
      qaList
    );

    const deadline =
      evaluation.recommendedStatus === 'approved_payment_pending'
        ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        : null;

    const adminClient = createAdminClient();

    const { data: application, error: appError } = await adminClient
      .from('sanctuary_event_applications')
      .upsert(
        {
          event_id: eventId,
          user_id: user.id,
          category: category || 'couple',
          ai_generated_questions: qaList.map((q) => q.question),
          ai_applicant_answers: qaList.map((q) => q.answer),
          ai_trust_score: evaluation.aiTrustScore,
          ai_evaluation_summary: evaluation.summary,
          status: evaluation.recommendedStatus,
          payment_deadline: deadline,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,user_id' }
      )
      .select()
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // Trigger auto-balancer promotions in case slots opened
    await checkAndPromoteWaitlistedCandidates(eventId);

    // Send push notification to user
    const pushMsg =
      evaluation.recommendedStatus === 'approved_payment_pending'
        ? `Your pass for "${event.title}" has been approved! Complete checkout within 4 hours to lock your spot.`
        : `Your application for "${event.title}" is in the dynamic waitlist. You will be alerted the moment a slot opens.`;

    await sendPushNotificationToUser(user.id, {
      title: evaluation.recommendedStatus === 'approved_payment_pending' ? '✨ Sanctuary Pass Approved' : '⏳ Application Queued',
      body: pushMsg,
      url: `/sanctuary-pass?eventId=${eventId}`,
    });

    return NextResponse.json({
      success: true,
      application,
      evaluation,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
