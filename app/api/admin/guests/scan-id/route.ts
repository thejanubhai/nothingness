import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { frontImage, backImage, image, mimeType } = body;

    const frontData = frontImage || image;
    const backData = backImage || null;

    if (!frontData) {
      return NextResponse.json({ success: false, error: 'No ID image provided for scanning' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Graceful fallback if GEMINI_API_KEY is not configured
      return NextResponse.json({
        success: false,
        error: 'Automated document scanner offline. Please enter details manually.',
        fallback: true
      }, { status: 200 });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
You are an expert hospitality and government ID verification OCR system for "Nothingness" luxury retreats.
Analyze the uploaded Indian or International Government ID card photo(s) (Aadhaar Card, Passport, Voter ID, Driving License, or Foreign ID).

Extract the following information with 100% accuracy:
1. "valid": true if an authentic ID document is detected.
2. "full_name": The exact full legal name of the person as printed on the card.
3. "id_document_type": Best match from ["Aadhaar", "Passport", "Driving License", "Voter ID", "Other"].
4. "document_number": Cleanly formatted ID / Document number (e.g. "1234 5678 9012" for Aadhaar or Passport alphanumeric number).
5. "dob": Date of birth in DD/MM/YYYY or YYYY-MM-DD format if visible.
6. "permanent_address": Full residential address extracted from the card (especially back of Aadhaar / Passport), or empty string if not visible.
7. "is_foreign_national": Boolean (true if nationality is non-Indian or passport is from outside India).
8. "nationality": "Indian" or specific foreign country.
9. "gender": "Male", "Female", "Other", or null.
10. "confidence_score": Number between 0 and 100.

Return ONLY a valid JSON object matching this schema:
{
  "valid": true,
  "full_name": "String",
  "id_document_type": "Aadhaar",
  "document_number": "String",
  "dob": "String",
  "permanent_address": "String",
  "is_foreign_national": false,
  "nationality": "Indian",
  "gender": "Male",
  "confidence_score": 95
}
`;

    const parts: any[] = [{ text: promptText }];

    // Add front image
    const cleanFront = frontData.includes('base64,') ? frontData.split('base64,')[1] : frontData;
    parts.push({
      inlineData: {
        data: cleanFront,
        mimeType: mimeType || 'image/jpeg'
      }
    });

    // Add back image if present
    if (backData) {
      const cleanBack = backData.includes('base64,') ? backData.split('base64,')[1] : backData;
      parts.push({
        inlineData: {
          data: cleanBack,
          mimeType: mimeType || 'image/jpeg'
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }]
    });

    const text = response.text || '{}';
    const cleanJson = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      extracted: result
    });

  } catch (error: any) {
    console.error('ID Scanning OCR Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to scan and extract ID details'
    }, { status: 500 });
  }
}
