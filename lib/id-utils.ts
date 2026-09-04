/**
 * Shared Client & Server utilities for Government ID parsing, formatting, and validation.
 * Safe for both browser and Node.js environments (zero native dependencies).
 */

export interface ParsedIdDetails {
  name?: string;
  document_number?: string;
  document_type?: 'Aadhaar' | 'Passport';
  dob?: string;
  permanent_address?: string;
  above18?: boolean;
}

/**
 * Parses XML/text extracted from Indian Aadhaar Card QR Codes.
 * Typical Aadhaar QR string starts with <?xml or contains <PrintLetterBarcodeData ... />
 */
export function parseAadhaarQrData(qrText: string): ParsedIdDetails | null {
  if (!qrText || typeof qrText !== 'string') return null;

  const extractAttr = (attr: string) => {
    const match = qrText.match(new RegExp(`${attr}="([^"]+)"`, 'i'));
    return match ? match[1].trim() : '';
  };

  const uid = extractAttr('uid');
  const name = extractAttr('name');
  const dob = extractAttr('dob') || extractAttr('yob');

  if (!name && !uid) return null;

  const addressParts = [
    extractAttr('co'),
    extractAttr('house'),
    extractAttr('street'),
    extractAttr('lm'),
    extractAttr('loc'),
    extractAttr('vtc'),
    extractAttr('dist'),
    extractAttr('state'),
    extractAttr('pc'),
  ].filter(Boolean);

  let formattedNumber = '';
  if (uid) {
    const cleanDigits = uid.replace(/\D/g, '').slice(0, 12);
    formattedNumber =
      cleanDigits.length === 12
        ? `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)} ${cleanDigits.slice(8, 12)}`
        : cleanDigits;
  }

  return {
    name,
    document_number: formattedNumber,
    document_type: 'Aadhaar',
    dob,
    permanent_address: addressParts.join(', '),
    above18: true,
  };
}

/**
 * Formats Aadhaar number into standard 4-digit groups (XXXX XXXX XXXX)
 */
export function formatAadhaarNumber(val: string): string {
  const clean = val.replace(/[^0-9]/g, '').slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Compresses an image data URL or File on the client to ensure it stays well under Vercel's 4.5MB limit
 * (typically down to 200KB - 400KB) while preserving high text sharpness for OCR and Multimodal AI.
 */
export async function compressIdImageForOcr(imageSource: string | File): Promise<string> {
  if (typeof window === 'undefined') {
    return typeof imageSource === 'string' ? imageSource : '';
  }

  return new Promise((resolve) => {
    let src = '';
    if (typeof imageSource === 'string') {
      src = imageSource;
    } else {
      src = URL.createObjectURL(imageSource);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (typeof imageSource !== 'string') {
        URL.revokeObjectURL(src);
      }

      const maxDimension = 1600; // Optimal for OCR reading without huge payloads
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof imageSource === 'string' ? imageSource : '');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with 0.88 quality
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      if (typeof imageSource !== 'string') {
        URL.revokeObjectURL(src);
      }
      resolve(typeof imageSource === 'string' ? imageSource : '');
    };

    img.src = src;
  });
}
