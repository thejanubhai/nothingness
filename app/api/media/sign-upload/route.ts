import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature, isCloudinaryConfigured } from '@/lib/cloudinary/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check configuration
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudinary server credentials (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME) are not configured.',
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { folder = 'nothingness/spaces', tags = ['nothingness'] } = body;

    const signatureData = generateUploadSignature({
      folder,
      tags: Array.isArray(tags) ? tags : [tags],
    });

    return NextResponse.json({
      success: true,
      ...signatureData,
    });
  } catch (error: any) {
    console.error('[Sign Upload API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sign upload request' },
      { status: 500 }
    );
  }
}
