import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, uploadToR2 } from '@/lib/r2/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary/server';
import { createClient } from '@/lib/supabase/server';
import { stripServerExif } from '@/lib/media/serverExif';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function uploadToSupabaseStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  bucket: string = 'guest-ids'
): Promise<{ url: string; public_id: string; format: string; bytes: number }> {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = adminSupabase.storage.from(bucket).getPublicUrl(fileName);
  const ext = fileName.split('.').pop() || 'bin';

  return {
    url: data.publicUrl,
    public_id: fileName,
    format: ext,
    bytes: buffer.length,
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Case A: Multipart Form Data (file upload from gallery/picker)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'kinkster_posts';
      const entityType = (formData.get('entityType') as any) || 'post';
      const entityId = (formData.get('entityId') as string) || undefined;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      // Enforce image-only uploads
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'Only image files (JPG, PNG, WEBP, HEIC) are supported.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const mimeType = file.type || 'image/jpeg';
      // Strip EXIF / GPS / device metadata before persisting to any cloud storage
      const buffer = stripServerExif(Buffer.from(arrayBuffer), mimeType);
      const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase();

      // 1. PRIMARY STORAGE: Cloudflare R2 (0 egress fee, adult-content friendly, links to Supabase media_assets)
      if (isR2Configured()) {
        try {
          const r2Result = await uploadToR2(buffer, {
            folder,
            contentType: mimeType,
            entityType,
            entityId,
            uploadedBy: user?.id,
            filenameOverride: file.name,
          });

          return NextResponse.json({
            success: true,
            url: r2Result.url,
            public_id: r2Result.public_id,
            format: r2Result.format,
            bytes: r2Result.bytes,
            provider: 'cloudflare_r2',
          });
        } catch (r2Error: any) {
          console.error('[Media Upload API] Cloudflare R2 primary upload failed, attempting fallback:', r2Error);
        }
      }

      // 2. SECONDARY STORAGE: Cloudinary
      if (isCloudinaryConfigured()) {
        try {
          const result = await uploadToCloudinary(buffer, {
            folder: `nothingness/${folder}`,
            entityType,
            entityId,
            uploadedBy: user?.id,
            filename_override: file.name,
            resource_type: 'image',
          });

          return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            provider: 'cloudinary',
          });
        } catch (cldError: any) {
          console.error('[Media Upload API] Cloudinary upload failed, attempting fallback:', cldError);
        }
      }

      // 3. TERTIARY FALLBACK: Supabase Storage (guest-ids bucket)
      const fileName = `${folder}/${Date.now()}_${crypto.randomUUID()}.${cleanExt}`;
      const storageResult = await uploadToSupabaseStorage(buffer, fileName, mimeType, 'guest-ids');

      return NextResponse.json({
        success: true,
        url: storageResult.url,
        public_id: storageResult.public_id,
        format: storageResult.format,
        bytes: storageResult.bytes,
        provider: 'supabase',
      });
    }

    // Case B: JSON Body (remote URL or Base64 string)
    const body = await req.json();
    const {
      url,
      base64,
      folder = 'kinkster_posts',
      entityType = 'post',
      entityId,
    } = body;

    const source = base64 || url;
    if (!source) {
      return NextResponse.json({ success: false, error: 'Missing url or base64 data' }, { status: 400 });
    }

    // Handle Base64 Upload
    if (base64) {
      const clean = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
      const mimeMatch = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : (clean.startsWith('/9j/') ? 'image/jpeg' : 'image/png');
      const cleanExt = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const rawBuffer = Buffer.from(clean, 'base64');
      // Strip EXIF / GPS / device metadata before persisting to any cloud storage
      const buffer = stripServerExif(rawBuffer, mimeType);

      // Primary R2
      if (isR2Configured()) {
        try {
          const r2Result = await uploadToR2(buffer, {
            folder,
            contentType: mimeType,
            entityType,
            entityId,
            uploadedBy: user?.id,
          });

          return NextResponse.json({
            success: true,
            url: r2Result.url,
            public_id: r2Result.public_id,
            format: r2Result.format,
            bytes: r2Result.bytes,
            provider: 'cloudflare_r2',
          });
        } catch (r2Error: any) {
          console.error('[Media Upload API] Base64 R2 upload failed:', r2Error);
        }
      }

      // Secondary Cloudinary
      if (isCloudinaryConfigured()) {
        try {
          const result = await uploadToCloudinary(source, {
            folder: `nothingness/${folder}`,
            entityType,
            entityId,
            uploadedBy: user?.id,
            resource_type: 'image',
          });

          return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            provider: 'cloudinary',
          });
        } catch (cldError) {
          console.warn('[Media Upload API] Cloudinary failed, falling back to Supabase Storage:', cldError);
        }
      }

      // Tertiary Supabase Storage
      const fileName = `${folder}/${Date.now()}_${crypto.randomUUID()}.${cleanExt}`;
      const storageResult = await uploadToSupabaseStorage(buffer, fileName, mimeType, 'guest-ids');

      return NextResponse.json({
        success: true,
        url: storageResult.url,
        public_id: storageResult.public_id,
        format: storageResult.format,
        bytes: storageResult.bytes,
        provider: 'supabase',
      });
    }

    // If remote URL, return URL directly
    return NextResponse.json({
      success: true,
      url,
      public_id: url,
    });
  } catch (error: any) {
    console.error('[Media Upload API] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Media upload failed' },
      { status: 500 }
    );
  }
}