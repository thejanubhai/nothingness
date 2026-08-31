import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudinaryWebhook } from '@/lib/cloudinary/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-cld-signature') || req.headers.get('x-cloudinary-signature') || '';
    const timestamp = req.headers.get('x-cld-timestamp') || req.headers.get('x-cloudinary-timestamp') || '';

    // Signature verification (if secret configured)
    const isValid = verifyCloudinaryWebhook(rawBody, timestamp, signature);

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      notification_type,
      public_id,
      secure_url,
      format,
      bytes,
      width,
      height,
      resource_type,
      moderation_status,
      moderation_kind,
      etag,
    } = payload;

    const supabase = createAdminClient();

    // 1. Log webhook event for audit trail
    console.log(`[Cloudinary Webhook] Received notification: type=${notification_type}, public_id=${public_id}`);

    // 2. Handle specific notification types
    if (notification_type === 'upload' || notification_type === 'create') {
      if (public_id && secure_url) {
        await supabase.from('media_assets').upsert(
          {
            public_id,
            secure_url,
            format: format || null,
            resource_type: resource_type || 'image',
            bytes: bytes || null,
            width: width || null,
            height: height || null,
            metadata: {
              webhook_received_at: new Date().toISOString(),
              moderation_status,
              etag,
              verified_signature: isValid,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'public_id' }
        );
      }
    } else if (notification_type === 'delete') {
      if (public_id) {
        await supabase.from('media_assets').delete().eq('public_id', public_id);
      }
    } else if (notification_type === 'moderation') {
      if (public_id) {
        await supabase
          .from('media_assets')
          .update({
            metadata: {
              moderation_status,
              moderation_kind,
              updated_at: new Date().toISOString(),
            },
          })
          .eq('public_id', public_id);
      }
    }

    return NextResponse.json({
      success: true,
      received: true,
      signatureVerified: isValid,
    });
  } catch (error: any) {
    console.error('[Cloudinary Webhook] Handler error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
