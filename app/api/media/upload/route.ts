import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudinary server credentials (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME) are not configured.',
        },
        { status: 503 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Case A: Multipart Form Data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'nothingness/spaces';
      const entityType = (formData.get('entityType') as any) || 'space';
      const entityId = (formData.get('entityId') as string) || undefined;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadToCloudinary(buffer, {
        folder,
        entityType,
        entityId,
        uploadedBy: user?.id,
        filename_override: file.name,
      });

      return NextResponse.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      });
    }

    // Case B: JSON Body (remote URL or Base64 string)
    const body = await req.json();
    const {
      url,
      base64,
      folder = 'nothingness/spaces',
      entityType = 'space',
      entityId,
    } = body;

    const source = base64 || url;
    if (!source) {
      return NextResponse.json({ success: false, error: 'Missing url or base64 data' }, { status: 400 });
    }

    const result = await uploadToCloudinary(source, {
      folder,
      entityType,
      entityId,
      uploadedBy: user?.id,
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error('[Media Upload API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Media upload failed' },
      { status: 500 }
    );
  }
}
