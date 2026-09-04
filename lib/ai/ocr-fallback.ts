/**
 * Local OCR and Document Extraction Fallback using Tesseract.js.
 * Provides offline, zero-cloud dependency OCR for Indian Aadhaar and Passports.
 */

import { createWorker } from 'tesseract.js';
import { parseAadhaarQrData } from '@/lib/id-utils';

export { parseAadhaarQrData };

export interface ExtractedIdData {
  valid: boolean;
  name: string;
  document_type: 'Aadhaar' | 'Passport';
  document_number: string;
  dob: string;
  permanent_address: string;
  above18: boolean;
  is_foreign_national: boolean;
  nationality: string;
  reason?: string;
}

export function parseDocumentText(rawText: string): ExtractedIdData {
  const result: ExtractedIdData = {
    valid: true,
    name: '',
    document_type: 'Aadhaar',
    document_number: '',
    dob: '',
    permanent_address: '',
    above18: true,
    is_foreign_national: false,
    nationality: 'Indian',
  };

  const text = rawText.replace(/\r\n/g, '\n');

  // 1. Detect Document Type
  const isPassport = /PASSPORT|REPUBLIC OF INDIA|P<IND/i.test(text) && !/AADHAAR|UNIQUE IDENTIFICATION/i.test(text);
  result.document_type = isPassport ? 'Passport' : 'Aadhaar';

  // 2. Extract Document Number
  if (isPassport) {
    const passMatch = text.match(/\b([A-PR-WYa-pr-wy][1-9]\d{6,7})\b/);
    if (passMatch) {
      result.document_number = passMatch[1].toUpperCase();
    }
  } else {
    // Look for 12 digits (with optional spaces/hyphens)
    const aadhMatch = text.match(/\b([2-9]\d{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/);
    if (aadhMatch) {
      const digits = aadhMatch[1].replace(/\D/g, '');
      if (digits.length === 12) {
        result.document_number = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
      }
    } else {
      const anyTwelve = text.match(/\b(\d{12})\b/);
      if (anyTwelve) {
        const digits = anyTwelve[1];
        result.document_number = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
      }
    }
  }

  // 3. Extract Date of Birth
  const dobMatch = text.match(
    /(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth|D\.O\.B)[\s:]*([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:19|20)\d{2}|(?:19|20)\d{2})/i
  );
  if (dobMatch) {
    result.dob = dobMatch[1].replace(/[-.]/g, '/');
  }

  // 4. Extract Full Name
  if (isPassport) {
    const givenMatch = text.match(/Given\s*Name[s\(\)]*[\s:]*([^\n\r]+)/i);
    const surMatch = text.match(/Surname[\s:]*([^\n\r]+)/i);
    if (givenMatch || surMatch) {
      const given = givenMatch ? givenMatch[1].trim() : '';
      const sur = surMatch ? surMatch[1].trim() : '';
      result.name = [given, sur].filter(Boolean).join(' ');
    }
  }

  if (!result.name) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 3);
    const dobIdx = lines.findIndex((l) => /(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth)/i.test(l));

    if (dobIdx > 0) {
      for (let i = dobIdx - 1; i >= 0; i--) {
        const line = lines[i];
        if (
          !/(?:Government|Bharat|Sarkar|Authority|India|UIDAI|Unique|Identification|Republic|Card|Father|Husband|Mother|Male|Female|Enrolment|Help)/i.test(
            line
          ) &&
          !/\d/.test(line) &&
          line.split(/\s+/).length >= 1 &&
          line.split(/\s+/).length <= 4
        ) {
          result.name = line.replace(/[^A-Za-z\s]/g, '').trim();
          break;
        }
      }
    }
  }

  // 5. Extract Permanent Address
  const addrMatch = text.match(/(?:Address|To)[\s:]*([\s\S]+?(?:\b[1-9][0-9]{5}\b))/i);
  if (addrMatch) {
    result.permanent_address = addrMatch[1].replace(/\s+/g, ' ').replace(/^[:\s-]+/, '').trim();
  }

  return result;
}

export async function extractDocumentWithLocalOcr(
  cleanImages: string[]
): Promise<{ success: boolean; extracted?: ExtractedIdData; error?: string }> {
  if (!cleanImages || cleanImages.length === 0) {
    return { success: false, error: 'No image provided for local OCR' };
  }

  let worker: any = null;
  try {
    worker = await createWorker('eng');
    let combinedText = '';

    for (const imgBase64 of cleanImages) {
      const clean = imgBase64.includes('base64,') ? imgBase64.split('base64,')[1] : imgBase64;
      const buffer = Buffer.from(clean, 'base64');
      const res = await worker.recognize(buffer);
      if (res?.data?.text) {
        combinedText += '\n' + res.data.text;
      }
    }

    if (!combinedText.trim()) {
      return { success: false, error: 'No text could be recognized from the image' };
    }

    const extracted = parseDocumentText(combinedText);
    const hasUsefulData = Boolean(
      extracted.name || extracted.document_number || extracted.dob || extracted.permanent_address
    );

    return {
      success: hasUsefulData,
      extracted,
      error: hasUsefulData ? undefined : 'Could not identify ID card attributes from scanned text',
    };
  } catch (err: any) {
    console.warn('[Local OCR] Recognition error:', err?.message);
    return { success: false, error: err.message || 'OCR processing failed' };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
  }
}
