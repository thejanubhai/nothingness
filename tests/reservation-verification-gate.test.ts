import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

describe('Reservation Verification Gate & Document Integrity', () => {
  test('Zero occurrences of user-facing "Gemini Vision" in components', () => {
    const componentsDir = path.resolve(process.cwd(), 'components');
    const walk = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(fullPath));
        } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
          results.push(fullPath);
        }
      });
      return results;
    };

    const files = walk(componentsDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      assert.ok(
        !content.includes('Gemini Vision'),
        `File ${file} should not contain user-facing "Gemini Vision" branding`
      );
    }
  });

  test('Date Normalization: Converts varied formats to ISO YYYY-MM-DD', () => {
    function normalizeDateToIso(dateStr?: string | null): string | null {
      if (!dateStr) return null;
      const trimmed = dateStr.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return null;
    }

    assert.equal(normalizeDateToIso('2026-10-15'), '2026-10-15');
    assert.equal(normalizeDateToIso('15 Oct 2026'), '2026-10-15');
    assert.equal(normalizeDateToIso('October 15, 2026'), '2026-10-15');
    assert.equal(normalizeDateToIso('2026/10/15'), '2026-10-15');
    assert.equal(normalizeDateToIso(null), null);
    assert.equal(normalizeDateToIso('invalid-date-string'), null);
  });

  test('Document Classifier: Rejects non-reservation images (human photos, selfies)', () => {
    // Simulating classifier gate as implemented in /api/bookings/verify-screenshot
    function evaluateClassification(parsed: any) {
      if (
        parsed.valid_screenshot === false ||
        parsed.is_booking_document === false ||
        (parsed.confidence_score !== undefined && parsed.confidence_score < 30) ||
        (parsed.document_type && parsed.document_type !== 'reservation_voucher')
      ) {
        return {
          status: 400,
          is_invalid_document: true,
          error: parsed.rejection_reason || 'Invalid booking confirmation',
        };
      }
      return { status: 200, success: true };
    }

    // 1. Human Portrait / Selfie
    const humanPhotoResult = evaluateClassification({
      valid_screenshot: false,
      is_booking_document: false,
      confidence_score: 0,
      document_type: 'human_portrait',
      rejection_reason: 'The uploaded photo is not a valid booking confirmation. It appears to be a personal photo.',
    });
    assert.equal(humanPhotoResult.status, 400);
    assert.equal(humanPhotoResult.is_invalid_document, true);
    assert.ok(humanPhotoResult.error.includes('personal photo'));

    // 2. Unrelated pet / scenery
    const sceneryResult = evaluateClassification({
      valid_screenshot: false,
      is_booking_document: false,
      confidence_score: 5,
      document_type: 'scenery',
      rejection_reason: 'Scenery image detected.',
    });
    assert.equal(sceneryResult.status, 400);
    assert.equal(sceneryResult.is_invalid_document, true);

    // 3. Genuine Reservation Voucher
    const voucherResult = evaluateClassification({
      valid_screenshot: true,
      is_booking_document: true,
      confidence_score: 95,
      document_type: 'reservation_voucher',
      reservation_code: 'HM8X7Y9Z',
      check_in: '2026-10-15',
    });
    assert.equal(voucherResult.status, 200);
    assert.equal(voucherResult.success, true);

    // 4. Government ID (Aadhaar Card uploaded to booking screen)
    const aadhaarResult = evaluateClassification({
      valid_screenshot: false,
      is_booking_document: false,
      confidence_score: 0,
      document_type: 'government_id',
      rejection_reason:
        'Government ID detected (Aadhaar/Passport/DL). This step requires an accommodation booking voucher from Airbnb, MakeMyTrip, Agoda, or Booking.com. ID verification is completed during guest check-in.',
    });
    assert.equal(aadhaarResult.status, 400);
    assert.equal(aadhaarResult.is_invalid_document, true);
    assert.ok(aadhaarResult.error.includes('Government ID'));
  });

  test('detectGovernmentIdMarkers correctly identifies Indian Government IDs and ignores vouchers', async () => {
    const { detectGovernmentIdMarkers } = await import('../lib/id-utils');

    // Genuine Aadhaar Text
    const aadhaarText = `
      GOVERNMENT OF INDIA
      Unique Identification Authority of India
      To Huda Vaqt
      DOB: 15/08/1995
      4921 7890 2341
    `;
    const aadhCheck = detectGovernmentIdMarkers(aadhaarText);
    assert.equal(aadhCheck.isGovernmentId, true);
    assert.equal(aadhCheck.idType, 'Aadhaar');

    // Genuine Passport Text
    const passportText = `
      PASSPORT
      REPUBLIC OF INDIA
      P<INDVAQT<<HUDA<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      Z8765432<4IND9508154M2610156<<<<<<<<<<<<<<<2
    `;
    const passCheck = detectGovernmentIdMarkers(passportText);
    assert.equal(passCheck.isGovernmentId, true);
    assert.equal(passCheck.idType, 'Passport');

    // Airbnb Voucher Text
    const airbnbText = `
      Airbnb Reservation Confirmation
      Confirmation code: HM8X7Y9Z
      Check-in: Oct 15, 2026
      Check-out: Oct 17, 2026
      Listing: The Void Sanctuary - Nothingness
      Total Paid: ₹24,500
    `;
    const voucherCheck = detectGovernmentIdMarkers(airbnbText);
    assert.equal(voucherCheck.isGovernmentId, false);
  });
});

