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

    const cleanFront = frontData.includes('base64,') ? frontData.split('base64,')[1] : frontData;
    const cleanBack = backData && backData.includes('base64,') ? backData.split('base64,')[1] : backData;
    const imageMimeType = mimeType || 'image/jpeg';

    let scanSucceeded = false;
    let extracted: any = null;

    // 1. Primary: NVIDIA Multimodal Vision AI (Free, high-speed)
    try {
      const { extractDocumentWithNvidiaVision } = await import('@/lib/ai/nvidia');
      const nvidiaResult = await extractDocumentWithNvidiaVision({
        frontBase64: cleanFront,
        backBase64: cleanBack,
        mimeType: imageMimeType,
      });

      if (nvidiaResult.success && nvidiaResult.extracted) {
        extracted = {
          valid: nvidiaResult.extracted.valid ?? true,
          full_name: nvidiaResult.extracted.name || 'Guest',
          id_document_type: nvidiaResult.extracted.document_type || 'Aadhaar',
          document_number: nvidiaResult.extracted.document_number || '',
          dob: nvidiaResult.extracted.dob || '',
          permanent_address: nvidiaResult.extracted.permanent_address || '',
          is_foreign_national: nvidiaResult.extracted.is_foreign_national ?? false,
          nationality: nvidiaResult.extracted.nationality || 'Indian',
          confidence_score: 98,
        };
        scanSucceeded = true;
      }
    } catch (nvidiaErr: any) {
      console.warn('[Admin Scan ID] NVIDIA Vision warning, falling back to Gemini:', nvidiaErr?.message);
    }

    // 2. Secondary Fallback: Google Gemini
    if (!scanSucceeded) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });

          const promptText = `
You are an expert hospitality and government ID verification OCR system for "Nothingness" luxury retreats.
Analyze the uploaded Indian or International Government ID card photo(s) (Aadhaar Card, Passport, Voter ID, Driving License, or Foreign ID).

Extract the following information with 100% accuracy:
1. "valid": true if an authentic ID document is detected.
2. "full_name": The exact full legal name of the person as printed on the card.
3. "id_document_type": Best match from ["Aadhaar", "Passport", "Driving License", "Voter ID", "Other"].
4. "document_number": Cleanly formatted ID / Document number.
5. "dob": Date of birth in DD/MM/YYYY or YYYY-MM-DD format if visible.
6. "permanent_address": Full residential address extracted from the card.
7. "is_foreign_national": Boolean (true if nationality is non-Indian or passport is from outside India).
8. "nationality": "Indian" or specific foreign country.
9. "gender": "Male", "Female", "Other", or null.
10. "confidence_score": Number between 0 and 100.

Return ONLY a valid JSON object.
`;

          const parts: any[] = [{ text: promptText }];
          parts.push({
            inlineData: {
              data: cleanFront,
              mimeType: imageMimeType,
            },
          });

          if (cleanBack) {
            parts.push({
              inlineData: {
                data: cleanBack,
                mimeType: imageMimeType,
              },
            });
          }

          const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
          for (const modelName of geminiModels) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts }],
              });

              const text = response.text || '{}';
              const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
              extracted = JSON.parse(cleanJson);
              if (extracted && typeof extracted === 'object') {
                scanSucceeded = true;
                break;
              }
            } catch (modelErr: any) {
              console.warn(`[Admin Scan ID] Gemini ${modelName} fallback error:`, modelErr?.message);
            }
          }
        } catch (geminiErr: any) {
          console.warn('[Admin Scan ID] Gemini OCR fallback warning:', geminiErr?.message);
        }
      }
    }

    if (!scanSucceeded || !extracted) {
      return NextResponse.json({
        success: false,
        error: 'Automated document scanner offline. Please enter details manually.',
        fallback: true,
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      extracted,
    });
  } catch (error: any) {
    console.error('ID Scanning OCR Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to scan and extract ID details',
    }, { status: 500 });
  }
}
