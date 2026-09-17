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

  // 4. Fallback to generic text extraction
  return extractDetailsFromText(trimmed);
}

/**
 * Robust Client & Server Text Extractor for Government IDs (Aadhaar Card & Passport).
 * Extracts Name, Number, DOB, and Address from any OCR text or barcode payload.
 */
export function extractDetailsFromText(rawText: string): ParsedIdDetails | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (text.length < 5) return null;

  const isPassport =
    /PASSPORT|REPUBLIC OF INDIA|P<IND/i.test(text) &&
    !/AADHAAR|UNIQUE IDENTIFICATION|UIDAI/i.test(text);

  const docType: 'Aadhaar' | 'Passport' = isPassport ? 'Passport' : 'Aadhaar';

  // 1. Extract Document Number
  let docNumber: string | undefined;
  if (isPassport) {
    const keyMatch = text.match(/(?:Passport\s*(?:No|Number|#)?)[\s:]*([A-Za-z][0-9]{7,8})\b/i);
    if (keyMatch) {
      docNumber = keyMatch[1].toUpperCase();
    } else {
      const passMatch = text.match(/\b([A-Za-z][1-9]\d{6,7})\b/);
      if (passMatch) {
        docNumber = passMatch[1].toUpperCase();
      }
    }
  } else {
    // 12-digit Aadhaar (e.g. 1234 5678 9012 or 123456789012)
    const aadhMatch = text.match(/\b([2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/);
    if (aadhMatch) {
      const cleanDigits = aadhMatch[1].replace(/\D/g, '');
      if (cleanDigits.length === 12) {
        docNumber = `${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)} ${cleanDigits.slice(8, 12)}`;
      }
    } else {
      const anyTwelve = text.match(/\b(\d{12})\b/);
      if (anyTwelve) {
        const d = anyTwelve[1];
        docNumber = `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)}`;
      }
    }
  }

  // 2. Extract Date of Birth
  let dob: string | undefined;
  const dobMatch = text.match(
    /(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth|D\.O\.B)[\s:]*([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:19|20)\d{2}|(?:19|20)\d{2})/i
  );
  if (dobMatch) {
    dob = dobMatch[1].replace(/[-.]/g, '/');
  }

  // 3. Extract Full Legal Name
  let name: string | undefined;
  if (isPassport) {
    const givenMatch = text.match(/Given\s*Name[s\(\)]*[\s:]*([^\n\r]+)/i);
    const surMatch = text.match(/Surname[\s:]*([^\n\r]+)/i);
    if (givenMatch || surMatch) {
      const given = givenMatch ? givenMatch[1].trim() : '';
      const sur = surMatch ? surMatch[1].trim() : '';
      name = [given, sur].filter(Boolean).join(' ');
    }
  }

  if (!name) {
    const nameKeyMatch = text.match(/(?:Name|Full Name|Holder)[\s:]*([A-Za-z\s]{3,40})/i);
    if (nameKeyMatch && !/Government|India|Aadhaar|Authority|Unique/i.test(nameKeyMatch[1])) {
      name = nameKeyMatch[1].trim();
    }
  }

  // If name not found by keyword, inspect lines before DOB
  if (!name) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 3);
    const dobIdx = lines.findIndex((l) => /(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth)/i.test(l));

    if (dobIdx > 0) {
      for (let i = dobIdx - 1; i >= 0; i--) {
        const line = lines[i];
        if (
          !/(?:Government|Bharat|Sarkar|Authority|India|UIDAI|Unique|Identification|Republic|Card|Father|Husband|Mother|Male|Female|Enrolment|Help|Download)/i.test(
            line
          ) &&
          !/\d/.test(line) &&
          line.split(/\s+/).length >= 1 &&
          line.split(/\s+/).length <= 4
        ) {
          name = line.replace(/[^A-Za-z\s]/g, '').trim();
          break;
        }
      }
    }
  }

  // 4. Extract Permanent Address
  let address: string | undefined;
  const addrMatch = text.match(/(?:Address|To|C\/O|S\/O|W\/O|D\/O)[\s:]*([\s\S]+?(?:\b[1-9][0-9]{5}\b))/i);
  if (addrMatch) {
    address = addrMatch[1].replace(/\s+/g, ' ').replace(/^[:\s-]+/, '').trim();
  }

  if (!name && !docNumber && !dob && !address) {
    return null;
  }

  return {
    name: name || undefined,
    document_number: docNumber || undefined,
    document_type: docType,
    dob: dob || undefined,
    permanent_address: address || undefined,
    above18: true,
  };
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

// Verhoeff algorithm tables (UIDAI Standard for Indian Aadhaar validation)
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a numeric string using the Verhoeff checksum algorithm (UIDAI standard).
 */
export function validateVerhoeff(numStr: string): boolean {
  if (!numStr || typeof numStr !== 'string') return false;
  const clean = numStr.replace(/\D/g, '');
  if (clean.length === 0) return false;

  let c = 0;
  const reversedDigits = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversedDigits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversedDigits[i]]];
  }
  return c === 0;
}

/**
 * Generates the Verhoeff check digit for a given 11-digit prefix.
 */
export function generateVerhoeffCheckDigit(numStr: string): number {
  const clean = numStr.replace(/\D/g, '');
  let c = 0;
  const reversedDigits = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversedDigits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][reversedDigits[i]]];
  }
  return VERHOEFF_INV[c];
}

/**
 * Validates an Indian Aadhaar number:
 * - Exactly 12 digits
 * - Does not begin with 0 or 1
 * - Passes Verhoeff checksum algorithm
 */
export function validateAadhaarNumber(val: string): { valid: boolean; reason?: string } {
  if (!val || typeof val !== 'string') {
    return { valid: false, reason: 'Aadhaar number is required.' };
  }

  const clean = val.replace(/\D/g, '');
  if (clean.length !== 12) {
    return {
      valid: false,
      reason: `Aadhaar number must be exactly 12 digits (received ${clean.length}).`,
    };
  }

  if (clean.startsWith('0') || clean.startsWith('1')) {
    return {
      valid: false,
      reason: 'Aadhaar numbers issued by UIDAI cannot begin with 0 or 1.',
    };
  }

  if (!validateVerhoeff(clean)) {
    return {
      valid: false,
      reason: 'Invalid Aadhaar checksum. Please ensure all 12 digits match your official UIDAI card.',
    };
  }

  return { valid: true };
}

/**
 * Validates an Indian or International Passport number.
 */
export function validatePassportNumber(val: string): { valid: boolean; reason?: string } {
  if (!val || typeof val !== 'string') {
    return { valid: false, reason: 'Passport number is required.' };
  }

  const clean = val.trim().toUpperCase();
  const isIndianPassport = /^[A-PR-WYa-pr-wy][1-9]\d{6,7}$/.test(clean);
  const isGeneralPassport = /^[A-Z0-9]{6,12}$/.test(clean);

  if (!isIndianPassport && !isGeneralPassport) {
    return {
      valid: false,
      reason: 'Passport number must be 6 to 12 alphanumeric characters.',
    };
  }

  return { valid: true };
}

/**
 * Detects whether raw text or OCR output contains clear Government ID indicators
 * (Aadhaar, Passport, PAN, Driving License, Voter ID).
 */
export function detectGovernmentIdMarkers(rawText: string): {
  isGovernmentId: boolean;
  idType?: 'Aadhaar' | 'Passport' | 'PAN' | 'Driving License' | 'Voter ID';
  confidence: number;
} {
  if (!rawText || typeof rawText !== 'string') {
    return { isGovernmentId: false, confidence: 0 };
  }

  const text = rawText.toUpperCase();

  // 1. Aadhaar Markers
  const hasAadhaarKeywords =
    text.includes('AADHAAR') ||
    text.includes('UIDAI') ||
    text.includes('UNIQUE IDENTIFICATION') ||
    (text.includes('GOVERNMENT OF INDIA') && (text.includes('MALE') || text.includes('FEMALE') || text.includes('DOB'))) ||
    text.includes('MERA AADHAAR') ||
    text.includes('BHARAT SARKAR');

  const aadhaarRegex = /\b[2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/;
  const hasAadhaarPattern = aadhaarRegex.test(rawText);

  if (hasAadhaarKeywords || (hasAadhaarPattern && (text.includes('DOB') || text.includes('YEAR OF BIRTH') || text.includes('ADDRESS')))) {
    return { isGovernmentId: true, idType: 'Aadhaar', confidence: 95 };
  }

  // 2. Passport Markers
  const hasPassportKeywords =
    text.includes('PASSPORT') ||
    text.includes('P<IND') ||
    (text.includes('REPUBLIC OF INDIA') && (text.includes('NATIONALITY') || text.includes('SURNAME')));

  if (hasPassportKeywords) {
    return { isGovernmentId: true, idType: 'Passport', confidence: 95 };
  }

  // 3. PAN Markers
  const hasPanKeywords =
    text.includes('INCOME TAX DEPARTMENT') ||
    text.includes('PERMANENT ACCOUNT NUMBER') ||
    /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(text);

  if (hasPanKeywords) {
    return { isGovernmentId: true, idType: 'PAN', confidence: 90 };
  }

  // 4. Driving License Markers
  const hasDlKeywords =
    text.includes('DRIVING LICENCE') ||
    text.includes('DRIVING LICENSE') ||
    text.includes('UNION OF INDIA DRIVING') ||
    text.includes('TRANSPORT DEPARTMENT');

  if (hasDlKeywords) {
    return { isGovernmentId: true, idType: 'Driving License', confidence: 90 };
  }

  // 5. Voter ID / Election Commission Markers
  const hasVoterKeywords =
    text.includes('ELECTION COMMISSION OF INDIA') ||
    text.includes('ELECTOR PHOTO IDENTITY CARD');

  if (hasVoterKeywords) {
    return { isGovernmentId: true, idType: 'Voter ID', confidence: 90 };
  }

  return { isGovernmentId: false, confidence: 0 };
}

/**
 * Calculates guest age from varied DOB formats (DD/MM/YYYY, YYYY-MM-DD, or YYYY).
 */
export function calculateAge(dobStr?: string | null): number | null {
  if (!dobStr) return null;
  const trimmed = dobStr.trim();

  let birthDate: Date | null = null;

  // Format 1: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    birthDate = new Date(year, month, day);
  }

  // Format 2: YYYY-MM-DD
  if (!birthDate) {
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      birthDate = new Date(year, month, day);
    }
  }

  // Format 3: Year only (e.g. 1995)
  if (!birthDate) {
    const yOnlyMatch = trimmed.match(/^(?:19|20)\d{2}$/);
    if (yOnlyMatch) {
      const year = parseInt(yOnlyMatch[0], 10);
      birthDate = new Date(year, 0, 1);
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}
