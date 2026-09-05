import jsQR from 'jsqr';

let fallbackCanvas: HTMLCanvasElement | null = null;

/**
 * Fallback QR Code Decoder using Canvas & jsQR.
 * Used when native window.BarcodeDetector is not supported by the browser.
 */
export function decodeQRFromVideo(video: HTMLVideoElement): string | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  if (typeof document === 'undefined') return null;

  if (!fallbackCanvas) {
    fallbackCanvas = document.createElement('canvas');
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  fallbackCanvas.width = width;
  fallbackCanvas.height = height;

  const ctx = fallbackCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return code?.data || null;
  } catch {
    return null;
  }
}

export function decodeQRFromImageData(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return code?.data || null;
  } catch {
    return null;
  }
}
