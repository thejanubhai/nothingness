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
 * Parses XML, JSON, or key-value text extracted from Indian Aadhaar Card QR Codes.
 * Handles standard UIDAI PrintLetterBarcodeData, Secure QR structures, and JSON QR codes.
 */
export function parseAadhaarQrData(qrText: string): ParsedIdDetails | null {
  if (!qrText || typeof qrText !== 'string') return null;

  const trimmed = qrText.trim();

  // 1. JSON Format Check
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const name = parsed.name || parsed.fullName || parsed.full_name || '';
      const uid = parsed.uid || parsed.aadhaar || parsed.document_number || '';
      const dob = parsed.dob || parsed.dateOfBirth || parsed.yob || '';
      const address = parsed.address || parsed.permanent_address || '';

      if (name || uid) {
        let formattedNumber = '';
        if (uid) {
          const cleanDigits = String(uid).replace(/\D/g, '').slice(0, 12);
          formattedNumber =
            cleanDigits.length === 12
              ? `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)} ${cleanDigits.slice(8, 12)}`
              : cleanDigits;
        }

        return {
          name: name || undefined,
          document_number: formattedNumber || undefined,
          document_type: 'Aadhaar',
          dob: dob || undefined,
          permanent_address: address || undefined,
          above18: true,
        };
      }
    } catch {}
  }

  // 2. Standard UIDAI XML Format (<PrintLetterBarcodeData ... />)
  const extractAttr = (attr: string) => {
    const match = qrText.match(new RegExp(`${attr}="([^"]+)"`, 'i'));
    return match ? match[1].trim() : '';
  };

  const uid = extractAttr('uid');
  const name = extractAttr('name');
  const dob = extractAttr('dob') || extractAttr('yob');

  if (name || uid) {
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
      name: name || undefined,
      document_number: formattedNumber || undefined,
      document_type: 'Aadhaar',
      dob: dob || undefined,
      permanent_address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
      above18: true,
    };
  }

  // 3. Delimited / Key-Value Text Parsing (e.g. Name: John Doe, DOB: 01/01/1990)
  const nameMatch = qrText.match(/(?:Name|Full Name)[\s:]*([A-Za-z\s]{3,40})/i);
  const uidMatch = qrText.match(/(?:Aadhaar|UID|Number)[\s:]*([2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})/i);
  const dobMatch = qrText.match(/(?:DOB|Date of Birth|YOB)[\s:]*([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:19|20)\d{2}|(?:19|20)\d{2})/i);

  if (nameMatch || uidMatch) {
    let cleanNumber = '';
    if (uidMatch) {
      const digits = uidMatch[1].replace(/\D/g, '').slice(0, 12);
      cleanNumber = digits.length === 12
        ? `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`
        : digits;
    }

    return {
      name: nameMatch ? nameMatch[1].trim() : undefined,
      document_number: cleanNumber || undefined,
      document_type: 'Aadhaar',
      dob: dobMatch ? dobMatch[1].replace(/[-.]/g, '/') : undefined,
      above18: true,
    };
  }

  return null;
}

/**
 * Universal Client-Side QR Decoder.
 * Automatically tries modern BarcodeDetector, falling back to jsQR for iOS Safari & PWA.
 */
export async function detectAndDecodeQrClient(imgUrl: string): Promise<ParsedIdDetails | null> {
  if (typeof window === 'undefined') return null;

  return new Promise(async (resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;

      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });

      if (!img.width || !img.height) {
        return resolve(null);
      }

      // A. Try native BarcodeDetector if available (Chrome, Android, Edge)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(img);
          for (const barcode of barcodes) {
            if (barcode?.rawValue) {
              const parsed = parseAadhaarQrData(barcode.rawValue);
              if (parsed && (parsed.name || parsed.document_number)) {
                return resolve(parsed);
              }
            }
          }
        } catch (_) {}
      }

      // B. Universal Fallback: Canvas + jsQR (Works on iOS Safari, macOS Safari, PWA)
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      try {
        const jsQRModule = await import('jsqr');
        const jsQR = jsQRModule.default || jsQRModule;
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code?.data) {
          const parsed = parseAadhaarQrData(code.data);
          if (parsed && (parsed.name || parsed.document_number)) {
            return resolve(parsed);
          }
        }
      } catch (jsqrErr) {
        console.warn('[QR Scan] jsQR fallback notice:', jsqrErr);
      }

      resolve(null);
    } catch {
      resolve(null);
    }
  });
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
