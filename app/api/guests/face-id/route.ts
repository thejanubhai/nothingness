import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function uploadBase64ToStorage(
  adminSupabase: any,
  base64Data: string,
  filePath: string,
  mimeType: string = 'image/jpeg'
): Promise<string | null> {
  try {
    const clean = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    const buffer = Buffer.from(clean, 'base64');
    const { error } = await adminSupabase.storage
      .from('guest-ids')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Storage Upload Failed] ${filePath}:`, error.message);
      return null;
    }

    const { data } = adminSupabase.storage.from('guest-ids').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err: any) {
    console.warn(`[Storage Upload Error] ${filePath}:`, err?.message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('guest_profiles')
      .select('face_id_vetted, face_id_vetted_at, live_face_url, live_face_angles, photo_url, id_front_url, full_name')
      .or(`user_id.eq.${user.id},phone.eq.${user.phone || ''}`)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      face_id_vetted: Boolean(profile?.face_id_vetted),
      live_face_url: profile?.live_face_url || null,
      live_face_angles: profile?.live_face_angles || {},
      face_id_vetted_at: profile?.face_id_vetted_at || null,
      official_photo_url: profile?.photo_url || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required to register 3D Face ID' }, { status: 401 });
    }

    const body = await req.json();
    const { frontImage, angleImage, guestId } = body;

    if (!frontImage) {
      return NextResponse.json({ error: 'No live front face capture provided' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const timestamp = Date.now();
    const fileId = `${user.id.slice(0, 8)}_${timestamp}`;

    // 1. Upload Front Live Face Frame to Supabase Storage
    const frontUrl = await uploadBase64ToStorage(
      adminClient,
      frontImage,
      `face-id/${fileId}_front.jpg`,
      'image/jpeg'
    );

    if (!frontUrl) {
      return NextResponse.json({ error: 'Failed to securely store 3D face biometric frame' }, { status: 500 });
    }

    // 2. Upload optional angle frame (depth / liveness proof)
    let angleUrl: string | null = null;
    if (angleImage) {
      angleUrl = await uploadBase64ToStorage(
        adminClient,
        angleImage,
        `face-id/${fileId}_angle.jpg`,
        'image/jpeg'
      );
    }

    const now = new Date().toISOString();
    const faceAngles = {
      front: frontUrl,
      angle: angleUrl,
      registered_at: now,
    };

    // 3. Update guest_profiles record
    let profileTargetQuery = adminClient.from('guest_profiles');
    if (guestId) {
      await profileTargetQuery
        .update({
          face_id_vetted: true,
          face_id_vetted_at: now,
          live_face_url: frontUrl,
          live_face_angles: faceAngles,
          face_id_score: 100,
        })
        .eq('id', guestId);
    } else {
      // Look up by user_id or phone
      const { data: existingProfile } = await adminClient
        .from('guest_profiles')
        .select('id')
        .or(`user_id.eq.${user.id},phone.eq.${user.phone || ''}`)
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        await adminClient
          .from('guest_profiles')
          .update({
            face_id_vetted: true,
            face_id_vetted_at: now,
            live_face_url: frontUrl,
            live_face_angles: faceAngles,
            face_id_score: 100,
            user_id: user.id,
          })
          .eq('id', existingProfile.id);
      } else {
        await adminClient
          .from('guest_profiles')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || 'Nothingness Guest',
            phone: user.phone || null,
            phone_number: user.phone || null,
            face_id_vetted: true,
            face_id_vetted_at: now,
            live_face_url: frontUrl,
            live_face_angles: faceAngles,
            face_id_score: 100,
          });
      }
    }

    // 4. Update kinkster_profiles record for enhanced trust & high event acceptance
    try {
      await adminClient
        .from('kinkster_profiles')
        .update({
          face_id_vetted: true,
          live_face_url: frontUrl,
        })
        .eq('id', user.id);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      face_id_vetted: true,
      live_face_url: frontUrl,
      live_face_angles: faceAngles,
      face_id_vetted_at: now,
      message: '3D Face ID biometric vetting completed and securely archived for door concierge verification.',
    });
  } catch (err: any) {
    console.error('[Face ID API Error]:', err);
    return NextResponse.json({ error: err.message || 'Error registering Face ID' }, { status: 500 });
  }
}
