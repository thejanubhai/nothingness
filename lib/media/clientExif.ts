/**
 * Client-Side EXIF & Geolocation Metadata Scrubber
 *
 * Smartphone cameras automatically embed sensitive EXIF tags:
 * - GPS Latitude, Longitude, Altitude
 * - Device Make, Model, and Serial Number
 * - Capture Timestamp & Location Name
 *
 * This utility draws the image onto an in-memory Canvas and re-encodes
 * pure pixel data to Blob/File. The Canvas standard naturally strips 100%
 * of EXIF/GPS/XMP metadata segments before the file leaves the device.
 */

export async function stripClientExif(file: File): Promise<File> {
  if (typeof window === 'undefined' || !file || !file.type.startsWith('image/')) {
    return file;
  }

  // Preserve animated GIFs and SVGs as-is without raster re-encoding
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  try {
    let bitmap: ImageBitmap | null = null;

    if ('createImageBitmap' in window) {
      try {
        // Modern standard: preserves proper camera orientation while stripping EXIF
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        bitmap = await createImageBitmap(file);
      }
    }

    const canvas = document.createElement('canvas');

    if (bitmap) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    } else {
      // Fallback for older WebViews
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(image);
        };
        image.onerror = (e) => {
          URL.revokeObjectURL(objectUrl);
          reject(e);
        };
        image.src = objectUrl;
      });

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0);
    }

    const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = 0.94;

    const scrubbedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, targetMime, quality);
    });

    if (!scrubbedBlob) {
      return file;
    }

    // Preserve original filename while replacing content with scrubbed bytes
    return new File([scrubbedBlob], file.name, {
      type: targetMime,
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('[stripClientExif] Canvas scrub fallback to original file:', err);
    return file;
  }
}
