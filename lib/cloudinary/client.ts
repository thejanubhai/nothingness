/**
 * Client-Side & Universal Cloudinary Image Optimization Utilities
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'scale' | 'fit' | 'limit' | 'pad' | 'thumb';
  gravity?: 'auto' | 'center' | 'face' | 'north' | 'south' | 'east' | 'west';
  aspectRatio?: string;
  blur?: number; // e.g. 1000 for placeholder
  dpr?: 'auto' | number;
  effects?: string[];
}

/**
 * Returns the configured cloud name from environment or fallback
 */
export function getCloudName(): string {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    'duuygdhoh' // Default cloud name
  );
}

/**
 * Checks if a string is a Cloudinary URL or a public ID
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Builds an auto-optimized, auto-formatted, high-performance Cloudinary delivery URL.
 * Automatically injects f_auto, q_auto, width, crop, and device pixel ratio parameters.
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  options: ImageTransformOptions = {}
): string {
  if (!src || typeof src !== 'string') {
    return '/images/The Void (1).png';
  }

  // If local static asset (e.g. /images/...) and not hosted on Cloudinary, return as is
  if (src.startsWith('/') && !isCloudinaryUrl(src)) {
    return src;
  }

  const cloudName = getCloudName();
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity,
    aspectRatio,
    blur,
    dpr = 'auto',
    effects = [],
  } = options;

  // Build transformation segments
  const transformParts: string[] = [];

  if (format) transformParts.push(`f_${format}`);
  if (quality) transformParts.push(`q_${quality}`);
  if (dpr) transformParts.push(`dpr_${dpr}`);
  if (width) transformParts.push(`w_${width}`);
  if (height) transformParts.push(`h_${height}`);
  if (crop && (width || height || aspectRatio)) transformParts.push(`c_${crop}`);
  if (gravity && (width || height || aspectRatio)) transformParts.push(`g_${gravity}`);
  if (aspectRatio) transformParts.push(`ar_${aspectRatio.replace(':', '_')}`);
  if (blur) transformParts.push(`e_blur:${blur}`);

  effects.forEach((eff) => transformParts.push(eff));

  const transformString = transformParts.join(',');

  // Case 1: Already a full Cloudinary URL with `/upload/`
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    // If it already has transformation string, replace or inject after `/upload/`
    const [baseUrl, afterUpload] = src.split('/upload/');
    if (!afterUpload) return src;

    // Check if afterUpload already starts with existing version or transformations
    const parts = afterUpload.split('/');
    if (parts[0].startsWith('v') && !isNaN(Number(parts[0].slice(1)))) {
      // e.g. v12345678/image.jpg -> inject transformations before version
      return `${baseUrl}/upload/${transformString}/${afterUpload}`;
    } else if (parts.length > 1 && !parts[0].startsWith('v')) {
      // It might have existing transformations -> replace them with new ones
      const rest = parts.slice(1).join('/');
      return `${baseUrl}/upload/${transformString}/${rest}`;
    }

    return `${baseUrl}/upload/${transformString}/${afterUpload}`;
  }

  // Case 2: Cloudinary Public ID (e.g. `nothingness/spaces/the-chamber`)
  if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/')) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${src}`;
  }

  // Case 3: External URL (like Airbnb muscache URL or external CDN)
  // If not Cloudinary, return the original URL safely
  return src;
}

/**
 * Returns a tiny, low-quality blurred placeholder URL for Next.js image loading states (LQIP)
 */
export function getBlurPlaceholderUrl(src: string | undefined | null): string {
  return getOptimizedImageUrl(src, {
    width: 30,
    quality: 1,
    format: 'auto',
    blur: 1000,
  });
}

export interface DirectUploadResult {
  success: boolean;
  secure_url?: string;
  public_id?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Uploads a file directly from browser to Cloudinary CDN using a secure server-signed token.
 * This completely avoids Vercel's 4.5MB serverless body limit and speeds up uploads.
 */
export async function uploadDirectToCloudinary(
  file: File | Blob,
  options: {
    folder?: string;
    tags?: string[];
    onProgress?: (progressPercent: number) => void;
  } = {}
): Promise<DirectUploadResult> {
  try {
    const folder = options.folder || 'nothingness/spaces';

    // 1. Fetch secure signature from our backend
    const signRes = await fetch('/api/media/sign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder,
        tags: options.tags,
      }),
    });

    const signData = await signRes.json();
    if (!signRes.ok || !signData.success) {
      throw new Error(signData.error || 'Failed to acquire upload signature');
    }

    const { signature, timestamp, apiKey, cloudName } = signData;

    // 2. Prepare FormData for Cloudinary Direct Upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    // 3. Upload with XMLHttpRequest for precise progress tracking or fetch
    if (options.onProgress) {
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && options.onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            options.onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                secure_url: res.secure_url,
                public_id: res.public_id,
                format: res.format,
                bytes: res.bytes,
                width: res.width,
                height: res.height,
              });
            } catch (e: any) {
              reject(new Error('Invalid JSON response from Cloudinary'));
            }
          } else {
            try {
              const errRes = JSON.parse(xhr.responseText);
              reject(new Error(errRes.error?.message || 'Upload to Cloudinary failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
        xhr.send(formData);
      });
    } else {
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const resData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(resData.error?.message || 'Direct upload to Cloudinary failed');
      }

      return {
        success: true,
        secure_url: resData.secure_url,
        public_id: resData.public_id,
        format: resData.format,
        bytes: resData.bytes,
        width: resData.width,
        height: resData.height,
      };
    }
  } catch (err: any) {
    console.error('[Cloudinary Client] Direct upload failed:', err);
    return {
      success: false,
      error: err.message || 'Direct upload failed',
    };
  }
}
