import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import crypto from 'crypto';
import { env } from '@/lib/env';

/**
 * Configure server-side Cloudinary instance securely from environment variables.
 */
export function getCloudinaryServer() {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = env.CLOUDINARY_URL || process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
      secure: true,
    });
  } else if (cloudName) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  return cloudinary;
}

/**
 * Check if server-side Cloudinary credentials are fully configured.
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = env.CLOUDINARY_URL || process.env.CLOUDINARY_URL;

  return Boolean(cloudinaryUrl || (cloudName && apiKey && apiSecret));
}

export interface GenerateSignatureParams {
  folder?: string;
  tags?: string[];
  public_id?: string;
  timestamp?: number;
  upload_preset?: string;
  eager?: string;
  transformation?: string;
  [key: string]: any;
}

/**
 * Generates a signed upload payload for direct client-to-Cloudinary uploads.
 * This completely bypasses Vercel payload size limits while preventing unauthorized uploads.
 */
export function generateUploadSignature(params: GenerateSignatureParams = {}) {
  const cld = getCloudinaryServer();
  const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;
  const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary credentials (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME) are required to generate upload signatures.');
  }

  const timestamp = params.timestamp || Math.round(new Date().getTime() / 1000);

  // Clean and prepare params for signing
  const signParams: Record<string, any> = {
    timestamp,
  };

  if (params.folder) signParams.folder = params.folder;
  if (params.public_id) signParams.public_id = params.public_id;
  if (params.upload_preset) signParams.upload_preset = params.upload_preset;
  if (params.eager) signParams.eager = params.eager;
  if (params.transformation) signParams.transformation = params.transformation;
  if (params.tags && params.tags.length > 0) {
    signParams.tags = Array.isArray(params.tags) ? params.tags.join(',') : params.tags;
  }

  // Generate SHA-1 or SHA-256 signature using Cloudinary utility
  const signature = cld.utils.api_sign_request(signParams, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: params.folder,
    params: signParams,
  };
}

export interface UploadOptions extends UploadApiOptions {
  entityType?: 'space' | 'journal' | 'guest_id' | 'site' | 'misc';
  entityId?: string;
  uploadedBy?: string;
}

/**
 * Uploads a buffer, base64 string, or remote URL to Cloudinary and logs to Supabase if available.
 */
export async function uploadToCloudinary(
  source: string | Buffer,
  options: UploadOptions = {}
): Promise<UploadApiResponse> {
  const cld = getCloudinaryServer();

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not fully configured. Please set CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, and CLOUDINARY_CLOUD_NAME.');
  }

  const { entityType, entityId, uploadedBy, ...cldOptions } = options;

  // Default optimization preset
  const finalOptions: UploadApiOptions = {
    resource_type: 'auto',
    folder: cldOptions.folder || 'nothingness',
    quality: 'auto',
    fetch_format: 'auto',
    ...cldOptions,
  };

  let uploadResult: UploadApiResponse;

  if (Buffer.isBuffer(source)) {
    uploadResult = await new Promise((resolve, reject) => {
      const stream = cld.uploader.upload_stream(finalOptions, (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No response from Cloudinary'));
        resolve(result);
      });
      stream.end(source);
    });
  } else {
    uploadResult = await cld.uploader.upload(source, finalOptions);
  }

  // Asynchronously track asset in Supabase media_assets table
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();

    await supabase.from('media_assets').upsert(
      {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        original_filename: uploadResult.original_filename || null,
        format: uploadResult.format || null,
        resource_type: uploadResult.resource_type || 'image',
        bytes: uploadResult.bytes || null,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        folder: uploadResult.folder || finalOptions.folder || 'nothingness',
        entity_type: entityType || null,
        entity_id: entityId || null,
        uploaded_by: uploadedBy || null,
        metadata: {
          etag: uploadResult.etag,
          version: uploadResult.version,
          created_at: uploadResult.created_at,
          placeholder: uploadResult.placeholder,
        },
      },
      { onConflict: 'public_id' }
    );
  } catch (dbErr) {
    console.warn('[Cloudinary Server] Could not record media asset in Supabase:', dbErr);
  }

  return uploadResult;
}

/**
 * Deletes an asset from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(
  publicId: string,
  options: { resource_type?: 'image' | 'video' | 'raw'; invalidate?: boolean } = {}
) {
  const cld = getCloudinaryServer();
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured.');
  }

  const result = await cld.uploader.destroy(publicId, {
    resource_type: options.resource_type || 'image',
    invalidate: options.invalidate !== false,
  });

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    await supabase.from('media_assets').delete().eq('public_id', publicId);
  } catch (e) {
    console.warn('[Cloudinary Server] Error deleting media asset from database:', e);
  }

  return result;
}

/**
 * Mirrors a remote URL (e.g. scraped Airbnb photo) directly into Cloudinary CDN.
 */
export async function mirrorRemoteImageToCloudinary(
  remoteUrl: string,
  folder = 'nothingness/spaces',
  entityId?: string
): Promise<{ success: boolean; url: string; publicId?: string; error?: string }> {
  try {
    if (!isCloudinaryConfigured()) {
      return { success: false, url: remoteUrl, error: 'Cloudinary not configured' };
    }

    const result = await uploadToCloudinary(remoteUrl, {
      folder,
      entityType: 'space',
      entityId,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err: any) {
    console.error('[Cloudinary Server] Error mirroring remote image:', err?.message);
    return {
      success: false,
      url: remoteUrl,
      error: err?.message,
    };
  }
}

/**
 * Verifies Cloudinary Webhook HMAC signature.
 * Cloudinary sends notification signatures in X-Cld-Signature header.
 */
export function verifyCloudinaryWebhook(
  rawBody: string,
  timestamp: string | number,
  signature: string
): boolean {
  const apiSecret = env.CLOUDINARY_WEBHOOK_SECRET || env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_WEBHOOK_SECRET || process.env.CLOUDINARY_API_SECRET;

  if (!apiSecret || !signature || !timestamp) {
    return false;
  }

  try {
    // Cloudinary signature verification: SHA-1(rawBody + timestamp + apiSecret) or HMAC SHA-256
    const hashString = `${rawBody}${timestamp}${apiSecret}`;
    const expectedSha1 = crypto.createHash('sha1').update(hashString).digest('hex');

    if (expectedSha1 === signature) {
      return true;
    }

    // Also test HMAC SHA-256 if configured
    const expectedSha256 = crypto
      .createHmac('sha256', apiSecret)
      .update(`${rawBody}${timestamp}`)
      .digest('hex');

    return expectedSha256 === signature;
  } catch (err) {
    console.error('[Cloudinary Webhook] Error verifying signature:', err);
    return false;
  }
}
