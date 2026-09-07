import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

/**
 * Checks if Cloudflare R2 credentials are configured in environment variables.
 */
export function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  return Boolean(accountId && accessKeyId && secretAccessKey);
}

/**
 * Returns an authenticated S3Client configured for Cloudflare R2.
 */
export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are missing in environment variables.'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export interface R2UploadOptions {
  folder?: string;
  key?: string;
  contentType?: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  filenameOverride?: string;
}

export interface R2UploadResult {
  success: boolean;
  url: string;
  public_id: string;
  format: string;
  bytes: number;
}

/**
 * Uploads an image buffer directly to Cloudflare R2 and links metadata in Supabase media_assets.
 */
export async function uploadToR2(
  buffer: Buffer,
  options: R2UploadOptions = {}
): Promise<R2UploadResult> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME || 'nothingness';
  const publicDomain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');

  const folder = options.folder || 'kinkster_posts';
  const cleanExt = (
    options.filenameOverride?.split('.').pop() ||
    options.contentType?.split('/')[1]?.replace('jpeg', 'jpg') ||
    'jpg'
  ).toLowerCase();

  const mimeType =
    options.contentType ||
    (cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg');
  const key = options.key || `${folder}/${Date.now()}_${crypto.randomUUID()}.${cleanExt}`;

  // Upload to Cloudflare R2
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await client.send(command);

  // Construct public delivery URL
  let publicUrl = '';
  if (publicDomain) {
    publicUrl = publicDomain.startsWith('http')
      ? `${publicDomain}/${key}`
      : `https://${publicDomain}/${key}`;
  } else {
    publicUrl = `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
  }

  // Record asset in Supabase media_assets table for complete relational linkage
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();

    await supabase.from('media_assets').upsert(
      {
        public_id: key,
        secure_url: publicUrl,
        original_filename: options.filenameOverride || null,
        format: cleanExt,
        resource_type: 'image',
        bytes: buffer.length,
        folder,
        entity_type: options.entityType || 'post',
        entity_id: options.entityId || null,
        uploaded_by: options.uploadedBy || null,
        metadata: {
          provider: 'cloudflare_r2',
          bucket: bucketName,
          created_at: new Date().toISOString(),
        },
      },
      { onConflict: 'public_id' }
    );
  } catch (dbErr) {
    console.warn('[R2 Server] Could not record media asset in Supabase:', dbErr);
  }

  return {
    success: true,
    url: publicUrl,
    public_id: key,
    format: cleanExt,
    bytes: buffer.length,
  };
}

/**
 * Deletes an object from Cloudflare R2 and removes record from Supabase media_assets.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || 'nothingness';

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      await supabase.from('media_assets').delete().eq('public_id', key);
    } catch (_) {}

    return true;
  } catch (err) {
    console.error('[R2 Server] Error deleting object from R2:', err);
    return false;
  }
}