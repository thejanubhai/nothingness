import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, guestId, token, frontImage, backImage, mimeType } = body;

    if (!frontImage || !backImage) {
      return NextResponse.json({ error: 'Both Front and Back images are required' }, { status: 400 });
    }

    if (!token && (!bookingId || !guestId)) {
      return NextResponse.json({ error: 'Missing identification credentials (token or booking details)' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `Analyze these two images representing the FRONT and BACK of an identity document.
              Strictly enforce the following rules:
              1. The document MUST be a valid Indian Aadhaar Card OR a valid Passport. Any other document (e.g., PAN card, Driving License, arbitrary photo) MUST be rejected.
              2. Is the person 18 years or older based on the Date of Birth? (Yes/No)
              3. Extract the full name of the person from the ID.
              4. Extract the Document Number (Aadhaar Number or Passport Number).
              5. Identify the Document Type ("Aadhaar" or "Passport").
              
              Return ONLY a JSON object with this exact structure, no markdown blocks:
              {
                "valid": true/false,
                "name": "Extracted Name",
                "document_number": "XXXX",
                "document_type": "Aadhaar",
                "above18": true/false,
                "reason": "Brief explanation if invalid or under 18, else empty string"
              }` 
            },
            { inlineData: { data: frontImage, mimeType: mimeType } },
            { inlineData: { data: backImage, mimeType: mimeType } }
          ]
        }
      ]
    });

    const responseText = response.text || "{}";
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json({ error: 'AI Verification failed to parse' }, { status: 500 });
    }

    if (!result.valid) {
      return NextResponse.json({ verified: false, reason: result.reason || 'Invalid ID provided.' }, { status: 400 });
    }

    if (!result.above18) {
      return NextResponse.json({ verified: false, reason: 'You must be at least 18 years old.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Upsert into global guest_profiles
    let profileId = null;
    if (result.document_number) {
      const { data: profile, error: profileError } = await supabase
        .from('guest_profiles')
        .upsert(
          { 
            document_number: result.document_number, 
            full_name: result.name,
            id_document_type: result.document_type,
            is_verified: true
          }, 
          { onConflict: 'document_number' }
        )
        .select()
        .single();
        
      if (!profileError && profile) {
        profileId = profile.id;
      } else {
        console.error("Profile upsert error:", profileError);
      }
    }
    
    // 2. Update booking_guests
    let updateQuery = supabase
      .from('booking_guests')
      .update({ 
        verification_status: 'verified', 
        name: result.name,
        guest_profile_id: profileId
      });

    if (token) {
      updateQuery = updateQuery.eq('verification_token', token);
    } else {
      updateQuery = updateQuery.eq('id', guestId).eq('booking_id', bookingId);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: 'Failed to update guest status' }, { status: 500 });
    }

    // Trigger Knock id-verification-success workflow
    if (process.env.KNOCK_SECRET_API_KEY) {
      try {
        const { Knock } = await import('@knocklabs/node');
        const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_API_KEY as string });
        
        await knock.workflows.trigger('id-verification-success', {
          recipients: [{
            id: profileId || `guest_${Date.now()}`,
            name: result.name,
          }],
          data: {
            bookingId: bookingId || token,
            documentType: result.document_type
          }
        });
        console.log("Knock id-verification-success workflow triggered.");
      } catch (knockErr) {
        console.error("Failed to trigger Knock workflow:", knockErr);
      }
    }

    return NextResponse.json({ verified: true, name: result.name }, { status: 200 });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
