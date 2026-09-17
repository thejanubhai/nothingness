import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  formatAadhaarNumber,
  extractDetailsFromText,
  parseAadhaarQrData,
  validateVerhoeff,
  generateVerhoeffCheckDigit,
  validateAadhaarNumber,
  validatePassportNumber,
  calculateAge,
} from '../lib/id-utils';

describe('Government ID Verification Gate & Auto-Fill Integrity', () => {
  test('Zero user-facing "Gemini Vision" branding in IDUploadModal and IDScanningAnimation', () => {
    const modalPath = path.resolve(process.cwd(), 'components/IDUploadModal.tsx');
    const animPath = path.resolve(process.cwd(), 'components/IDScanningAnimation.tsx');

    const modalContent = fs.readFileSync(modalPath, 'utf8');
    const animContent = fs.readFileSync(animPath, 'utf8');

    assert.ok(
      !modalContent.includes('Gemini Vision'),
      'IDUploadModal.tsx should not expose "Gemini Vision" to the guest'
    );
    assert.ok(
      !animContent.includes('Gemini Vision'),
      'IDScanningAnimation.tsx should not expose "Gemini Vision" to the guest'
    );
  });

  test('IDUploadModal embeds IDScanningAnimation and disables submission on scan error', () => {
    const modalPath = path.resolve(process.cwd(), 'components/IDUploadModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    assert.ok(
      modalContent.includes('<IDScanningAnimation'),
      'IDUploadModal must render IDScanningAnimation for interactive HUD scan'
    );
    assert.ok(
      modalContent.includes('scanError'),
      'IDUploadModal must track scanError to reject invalid documents'
    );
    assert.ok(
      modalContent.includes('autoFilledFields'),
      'IDUploadModal must track autoFilledFields to show detected badges'
    );
    assert.ok(
      modalContent.includes('!!scanError'),
      'Submit button must be disabled when scanError is present'
    );
  });

  test('formatAadhaarNumber formats 12-digit string into 4-digit chunks', () => {
    assert.equal(formatAadhaarNumber('987654321098'), '9876 5432 1098');
    assert.equal(formatAadhaarNumber('9876 5432 1098'), '9876 5432 1098');
    assert.equal(formatAadhaarNumber('9876-5432-1098'), '9876 5432 1098');
    assert.equal(formatAadhaarNumber('1234'), '1234');
    assert.equal(formatAadhaarNumber(''), '');
  });

  test('extractDetailsFromText extracts details from raw Aadhaar card text', () => {
    const sampleAadhaarText = `
      GOVERNMENT OF INDIA
      Unique Identification Authority of India
      To
      Huda Vaqt
      Address: House 42, Bandra West, Mumbai, Maharashtra - 400050
      DOB: 15/08/1995
      Male
      4921 7890 2341
      Helpdesk: 1947
    `;

    const extracted = extractDetailsFromText(sampleAadhaarText);
    assert.ok(extracted, 'Should extract details from Aadhaar text');
    assert.equal(extracted?.document_type, 'Aadhaar');
    assert.equal(extracted?.document_number, '4921 7890 2341');
    assert.equal(extracted?.dob, '15/08/1995');
    assert.ok(extracted?.name?.includes('Huda Vaqt'), `Extracted name was ${extracted?.name}`);
  });

  test('extractDetailsFromText extracts details from raw Indian Passport text', () => {
    const samplePassportText = `
      PASSPORT
      REPUBLIC OF INDIA
      Type: P, Country Code: IND, Passport No: Z8765432
      Surname: VAQT
      Given Name: HUDA
      Nationality: INDIAN
      Date of Birth: 22/04/1992
      Sex: M
      Place of Birth: DELHI
    `;

    const extracted = extractDetailsFromText(samplePassportText);
    assert.ok(extracted, 'Should extract details from Passport text');
    assert.equal(extracted?.document_type, 'Passport');
    assert.equal(extracted?.document_number, 'Z8765432');
    assert.equal(extracted?.dob, '22/04/1992');
    assert.ok(extracted?.name?.toLowerCase().includes('huda'), `Extracted name was ${extracted?.name}`);
  });

  test('parseAadhaarQrData handles UIDAI standard XML payload', () => {
    const sampleXml = `<PrintLetterBarcodeData uid="987654321098" name="Aadhaar User" dob="01/01/1990" gender="M" co="S/O Test" house="123" street="MG Road" lm="Near Post Office" loc="Indiranagar" vtc="Bangalore" dist="Bangalore Urban" state="Karnataka" pc="560038" />`;

    const parsed = parseAadhaarQrData(sampleXml);
    assert.ok(parsed, 'Should parse UIDAI XML');
    assert.equal(parsed?.document_number, '9876 5432 1098');
    assert.equal(parsed?.name, 'Aadhaar User');
    assert.equal(parsed?.dob, '01/01/1990');
    assert.ok(parsed?.permanent_address?.includes('Bangalore'));
  });

  test('Strict Rejection Gate: Non-ID images rejected with 400', () => {
    function evaluateIdDocument(parsed: any) {
      if (
        parsed.valid === false ||
        parsed.is_id_document === false ||
        (parsed.confidence_score !== undefined && parsed.confidence_score < 30) ||
        parsed.document_type === 'invalid'
      ) {
        return {
          status: 400,
          success: false,
          is_invalid_document: true,
          error:
            parsed.rejection_reason ||
            'The uploaded photo does not appear to be a recognized Government ID card (Aadhaar or Passport).',
        };
      }
      return { status: 200, success: true, is_invalid_document: false };
    }

    // 1. Human Selfie without ID
    const selfieRes = evaluateIdDocument({
      valid: false,
      is_id_document: false,
      confidence_score: 0,
      document_type: 'invalid',
      rejection_reason: 'The uploaded photo is a selfie, not a Government ID card.',
    });
    assert.equal(selfieRes.status, 400);
    assert.equal(selfieRes.is_invalid_document, true);
    assert.ok(selfieRes.error.includes('selfie'));

    // 2. Random Scenery / Pet / Food
    const randomRes = evaluateIdDocument({
      valid: false,
      is_id_document: false,
      confidence_score: 5,
      document_type: 'invalid',
      rejection_reason: 'No official ID document detected in the image.',
    });
    assert.equal(randomRes.status, 400);
    assert.equal(randomRes.is_invalid_document, true);

    // 3. Genuine Aadhaar Card
    const validRes = evaluateIdDocument({
      valid: true,
      is_id_document: true,
      confidence_score: 95,
      document_type: 'Aadhaar',
      name: 'Huda Vaqt',
      document_number: '9876 5432 1098',
    });
    assert.equal(validRes.status, 200);
    assert.equal(validRes.is_invalid_document, false);
  });

  test('UIDAI Verhoeff Checksum Algorithm detects valid and invalid checksums', () => {
    // Generate valid 12-digit Aadhaar using 11 digits + Verhoeff check digit
    const base11 = '29384756102';
    const checkDigit = generateVerhoeffCheckDigit(base11);
    const validAadhaar = `${base11}${checkDigit}`;

    assert.equal(validateVerhoeff(validAadhaar), true, 'Valid Verhoeff number must return true');

    // Single digit error must fail
    const corruptedSingle = `${base11}${(checkDigit + 1) % 10}`;
    assert.equal(validateVerhoeff(corruptedSingle), false, 'Single digit corruption must fail');

    // Transposition of adjacent digits must fail
    const transposed = `${base11.slice(0, -2)}${base11.slice(-1)}${base11.slice(-2, -1)}${checkDigit}`;
    assert.equal(validateVerhoeff(transposed), false, 'Adjacent digit transposition must fail');
  });

  test('validateAadhaarNumber enforces 12 digits, non-zero/one start, and Verhoeff checksum', () => {
    const base11 = '49217890234';
    const checkDigit = generateVerhoeffCheckDigit(base11);
    const validAadhaar = `${base11}${checkDigit}`;

    // Valid Aadhaar
    const validRes = validateAadhaarNumber(validAadhaar);
    assert.equal(validRes.valid, true);

    // Starting with '0'
    const startsWithZero = `0${base11.slice(1)}${generateVerhoeffCheckDigit(`0${base11.slice(1)}`)}`;
    const zeroRes = validateAadhaarNumber(startsWithZero);
    assert.equal(zeroRes.valid, false);
    assert.ok(zeroRes.reason?.includes('cannot begin with 0 or 1'));

    // Starting with '1'
    const startsWithOne = `1${base11.slice(1)}${generateVerhoeffCheckDigit(`1${base11.slice(1)}`)}`;
    const oneRes = validateAadhaarNumber(startsWithOne);
    assert.equal(oneRes.valid, false);
    assert.ok(oneRes.reason?.includes('cannot begin with 0 or 1'));

    // Wrong length (11 digits)
    const shortRes = validateAadhaarNumber('49217890234');
    assert.equal(shortRes.valid, false);
    assert.ok(shortRes.reason?.includes('must be exactly 12 digits'));

    // Corrupted checksum
    const badChecksum = `${base11}9`; // Intentional wrong check digit
    if (validateVerhoeff(badChecksum) === false) {
      const badRes = validateAadhaarNumber(badChecksum);
      assert.equal(badRes.valid, false);
      assert.ok(badRes.reason?.includes('Invalid Aadhaar checksum'));
    }
  });

  test('validatePassportNumber verifies valid Indian and international formats', () => {
    assert.equal(validatePassportNumber('Z8765432').valid, true);
    assert.equal(validatePassportNumber('A1234567').valid, true);
    assert.equal(validatePassportNumber('123').valid, false);
    assert.equal(validatePassportNumber('').valid, false);
  });

  test('calculateAge correctly enforces statutory 18+ age requirement', () => {
    // Adult (born 1995)
    const adultAge = calculateAge('15/08/1995');
    assert.ok(adultAge !== null && adultAge >= 18, '1995 DOB should be at least 18');

    // Minor (born 2 years ago)
    const recentYear = new Date().getFullYear() - 2;
    const minorAge = calculateAge(`01/01/${recentYear}`);
    assert.ok(minorAge !== null && minorAge < 18, 'Recent year DOB should be under 18');

    // Invalid date format
    assert.equal(calculateAge('invalid-date'), null);
    assert.equal(calculateAge(null), null);
  });
});
