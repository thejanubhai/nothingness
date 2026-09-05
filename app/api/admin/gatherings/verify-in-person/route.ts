import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export interface MarshallVerifyRequest {
  token: string;
  marshallPin?: string;
  eventId?: string;
}

export interface MarshallVerifyResponse {
  success: boolean;
  userAlias: string;
  userId: string;
  eventTitle: string;
  isIdVerified: boolean;
  isInPersonVetted: boolean;
  checkedInAt: string;
  certifiedBy: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, marshallPin, eventId } = body;

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });
    }

    // 1. Marshall Security Authorization
    // Authorized either via authenticated Admin user session OR via 4-digit Marshall Security PIN
    let isAuthorized = false;
    let marshallAlias = 'Consent Marshall (Floor Lead)';

    const expectedPin = process.env.MARSHALL_SECURITY_PIN || '1991';
    if (marshallPin && String(marshallPin).trim() === expectedPin) {
      isAuthorized = true;
      marshallAlias = 'Consent Marshall (PIN 1991)';
    } else {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (
            user.email?.includes('admin') ||
            user.app_metadata?.role === 'admin' ||
            user.user_metadata?.role === 'admin'
          ) {
            isAuthorized = true;
            marshallAlias = user.email || 'Admin Marshall';
          } else {
            // Check kinkster_profiles for admin/marshall status
            const adminClient = createAdminClient();
            const { data: kp } = await adminClient
              .from('kinkster_profiles')
              .select('alias, admin_notes')
              .eq('id', user.id)
              .maybeSingle();

            if (
              kp?.admin_notes?.toLowerCase().includes('admin') ||
              kp?.alias?.toLowerCase().includes('marshall') ||
              kp?.alias?.toLowerCase().includes('admin')
            ) {
              isAuthorized = true;
              marshallAlias = kp.alias || user.email || 'Admin Marshall';
            }
          }
        }
      } catch {}
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Invalid Marshall Security PIN',
          message: 'Unauthorized. Invalid Marshall Security PIN or Admin session.',
        },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // 2. Resolve Token to a Sanctuary Attendee / Kinkster Member
    let cleanToken = String(token).trim();
    let targetUserId: string | null = null;
    let targetAppId: string | null = null;
    let targetEventId: string | null = null;
    let eventTitle = 'Sanctuary Gathering';

    // Check if token is JSON-encoded QR payload
    try {
      if (cleanToken.startsWith('{') && cleanToken.endsWith('}')) {
        const parsed = JSON.parse(cleanToken);
        cleanToken = parsed.token || parsed.qr_secret_token || parsed.userId || cleanToken;
        if (parsed.userId) targetUserId = parsed.userId;
        if (parsed.appId) targetAppId = parsed.appId;
      }
    } catch {}

    const cleanTokenWithoutAt = cleanToken.startsWith('@') ? cleanToken.slice(1) : cleanToken;
    const isTokenUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);

    // A. Search in sanctuary_event_applications by qr_secret_token or id
    let appQuery = adminClient
      .from('sanctuary_event_applications')
      .select('id, user_id, event_id, status, sanctuary_events(title)');

    if (isTokenUuid) {
      appQuery = appQuery.or(`qr_secret_token.eq.${cleanToken},id.eq.${cleanToken}`);
    } else {
      appQuery = appQuery.eq('qr_secret_token', cleanToken);
    }

    const { data: appMatch } = await appQuery.maybeSingle();

    if (appMatch) {
      targetUserId = appMatch.user_id;
      targetAppId = appMatch.id;
      targetEventId = appMatch.event_id;
      if (appMatch.sanctuary_events && (appMatch.sanctuary_events as any).title) {
        eventTitle = (appMatch.sanctuary_events as any).title;
      }
    }

    // B. If not found, search kinkster_profiles by alias or id
    if (!targetUserId) {
      let kpQuery = adminClient
        .from('kinkster_profiles')
        .select('id, alias');

      if (isTokenUuid) {
        kpQuery = kpQuery.or(`id.eq.${cleanToken},alias.ilike.${cleanToken},alias.ilike.${cleanTokenWithoutAt}`);
      } else {
        kpQuery = kpQuery.or(`alias.ilike.${cleanToken},alias.ilike.${cleanTokenWithoutAt}`);
      }

      const { data: profileByAlias } = await kpQuery.maybeSingle();

      if (profileByAlias) {
        targetUserId = profileByAlias.id;
      }
    }

    // C. Search guest_profiles by phone, document_number, user_id, or id
    if (!targetUserId) {
      let guestQuery = adminClient
        .from('guest_profiles')
        .select('id, user_id, phone, phone_number, full_name');

      if (isTokenUuid) {
        guestQuery = guestQuery.or(`user_id.eq.${cleanToken},id.eq.${cleanToken}`);
      } else {
        guestQuery = guestQuery.or(`phone.eq.${cleanToken},phone_number.eq.${cleanToken},document_number.eq.${cleanToken}`);
      }

      const { data: guestMatch } = await guestQuery.limit(1).maybeSingle();

      if (guestMatch) {
        targetUserId = guestMatch.user_id || guestMatch.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Sanctuary pass QR token not recognized. Verify guest profile in system.' },
        { status: 404 }
      );
    }

    // 3. Confirm Identity on File & Certify Level 2 In-Person Vetting
    const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);

    let kinksterProfile: any = null;
    let guestProfile: any = null;

    if (isTargetUuid) {
      const { data: kp } = await adminClient
        .from('kinkster_profiles')
        .select('id, alias, in_person_vetted, is_in_person_vetted, is_id_verified, avatar_url, face_id_vetted, live_face_url')
        .eq('id', targetUserId)
        .maybeSingle();
      kinksterProfile = kp;

      const { data: gp } = await adminClient
        .from('guest_profiles')
        .select('id, full_name, is_verified, in_person_vetted, is_in_person_vetted, face_id_vetted, live_face_url, photo_url')
        .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
        .limit(1)
        .maybeSingle();
      guestProfile = gp;
    }

    // Verify Level 1 Govt ID status & 3D Face ID status
    const isIdVerified = Boolean(guestProfile?.is_verified || kinksterProfile?.is_id_verified);
    const isFaceIdVetted = Boolean(guestProfile?.face_id_vetted || kinksterProfile?.face_id_vetted);
    const facePhotoUrl = guestProfile?.live_face_url || kinksterProfile?.live_face_url || guestProfile?.photo_url || kinksterProfile?.avatar_url || null;
    const userAlias = kinksterProfile?.alias || guestProfile?.full_name || `member_${targetUserId.slice(0, 6)}`;

    // Update guest_profiles & kinkster_profiles to certified in_person_vetted = true and is_in_person_vetted = true
    const now = new Date().toISOString();

    if (guestProfile?.id) {
      await adminClient
        .from('guest_profiles')
        .update({
          in_person_vetted: true,
          is_in_person_vetted: true,
          in_person_vetted_at: now,
        })
        .eq('id', guestProfile.id);
    }

    if (kinksterProfile?.id) {
      await adminClient
        .from('kinkster_profiles')
        .update({
          in_person_vetted: true,
          is_in_person_vetted: true,
          in_person_vetted_at: now,
          updated_at: now,
        })
        .eq('id', kinksterProfile.id);
    }

    // If matching application found, mark as checked in
    if (targetAppId) {
      await adminClient
        .from('sanctuary_event_applications')
        .update({
          status: 'checked_in',
          checked_in_at: now,
          checked_in_by: marshallAlias,
          updated_at: now,
        })
        .eq('id', targetAppId);
    }

    // 4. Insert Audit Record into gathering_vettings
    const resolvedEventId = targetEventId || (eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId) ? eventId : null);

    if (isTargetUuid) {
      await adminClient
        .from('gathering_vettings')
        .insert({
          event_id: resolvedEventId,
          attendee_id: targetUserId,
          marshall_id: marshallAlias,
          marshall_alias: marshallAlias,
          verified_at: now,
          verification_method: 'qr_scan',
          notes: `Physical L2 Vetting certified by ${marshallAlias}. Level 1 ID: ${isIdVerified ? 'Verified' : 'Pending Physical Check'}`,
          created_at: now,
        });
    }

    return NextResponse.json({
      success: true,
      alias: userAlias,
      userAlias,
      fullName: guestProfile?.full_name || kinksterProfile?.alias || userAlias,
      userId: targetUserId,
      eventTitle,
      isIdVerified,
      isFaceIdVetted,
      facePhotoUrl,
      isInPersonVetted: true,
      checkedInAt: now,
      certifiedBy: marshallAlias,
      message: `Level 2 Physical Vetting Confirmed for @${userAlias}`,
    });
  } catch (err: any) {
    console.error('In-Person Vetting Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during in-person vetting' },
      { status: 500 }
    );
  }
}
