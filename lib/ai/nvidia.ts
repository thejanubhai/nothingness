/**
 * NVIDIA NIM (AI Foundation Models) Core Client for Nothingness.
 * Provides high-speed, cost-free AI capabilities for:
 * 1. Multimodal Document OCR (Aadhaar & Passport extraction)
 * 2. Editorial Journal Article Writing (Human-grade nuance, anti-cliché)
 * 3. AI Concierge & Chatflows (Listing availability & luxury inquiry handling)
 */

export interface NvidiaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export function getNvidiaApiKey(): string | null {
  return (
    process.env.nVidia_AI_API_Key ||
    process.env.NVIDIA_AI_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    null
  );
}

export const NVIDIA_MODELS = {
  // Multimodal Vision OCR Models
  VISION_DEFAULT: 'meta/llama-3.2-11b-vision-instruct',
  VISION_PHI: 'microsoft/phi-3.5-vision-instruct',
  VISION_LARGE: 'meta/llama-3.2-90b-vision-instruct',

  // Deep Reasoning & Long-form Editorial Writing
  EDITORIAL_DEFAULT: 'meta/llama-3.3-70b-instruct',
  EDITORIAL_DEEPSEEK: 'deepseek-ai/deepseek-r1',
  EDITORIAL_KIMI: 'moonshotai/kimi-k3',

  // Fast Low-Latency Concierge & Chatflow Generation
  CONCIERGE_FAST: 'meta/llama-3.1-8b-instruct',
  CONCIERGE_POWER: 'meta/llama-3.3-70b-instruct',
} as const;

/**
 * Executes a chat completion request to NVIDIA NIM API.
 */
export async function callNvidiaChat(options: {
  messages: NvidiaChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<{ success: boolean; content: string; error?: string }> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    return { success: false, content: '', error: 'NVIDIA API Key is not configured.' };
  }

  const {
    messages,
    model = NVIDIA_MODELS.EDITORIAL_DEFAULT,
    temperature = 0.7,
    maxTokens = 4096,
    jsonMode = false,
  } = options;

  try {
    const payload: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        content: '',
        error: `NVIDIA API Error (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { success: true, content: reply };
  } catch (err: any) {
    return { success: false, content: '', error: err.message || 'NVIDIA Network Failure' };
  }
}

/**
 * Extracts and verifies Indian government identity documents (Aadhaar / Passport)
 * using NVIDIA Multimodal Vision AI with high accuracy and zero cost.
 */
export async function extractDocumentWithNvidiaVision(params: {
  frontBase64: string;
  backBase64?: string | null;
  mimeType?: string;
}): Promise<{
  success: boolean;
  extracted?: {
    valid: boolean;
    name: string;
    dob?: string;
    above18?: boolean;
    document_type?: string;
    document_number?: string;
    permanent_address?: string;
    is_foreign_national?: boolean;
    nationality?: string;
    reason?: string;
  };
  error?: string;
}> {
  const { frontBase64, backBase64, mimeType = 'image/jpeg' } = params;

  const promptText = `Analyze these images representing the FRONT and BACK of a guest identity document for "Nothingness" luxury retreats.

STRICT VERIFICATION RULES:
1. Document MUST be an official AADHAAR CARD or PASSPORT.
2. Driving License (DL), Voter ID, PAN Card, or any other document MUST BE STRICTLY REJECTED with reason: "Driving License and Voter ID are not accepted. Please upload a clear Aadhaar Card or Passport."
3. Primary booker MUST be 18 years of age or older based on Date of Birth.
4. Extract full name, document type ("Aadhaar" or "Passport"), document number, DOB (DD/MM/YYYY), and permanent address.

Return ONLY a valid JSON object matching this exact schema (no markdown fences):
{
  "valid": true,
  "name": "Full Legal Name",
  "dob": "DD/MM/YYYY",
  "above18": true,
  "document_type": "Aadhaar",
  "document_number": "XXXX",
  "permanent_address": "Extracted address from card",
  "is_foreign_national": false,
  "nationality": "Indian",
  "reason": "Reason if rejected"
}`;

  const cleanFront = frontBase64.includes('base64,') ? frontBase64.split('base64,')[1] : frontBase64;
  const frontDataUrl = `data:${mimeType};base64,${cleanFront}`;

  const contentParts: any[] = [
    { type: 'text', text: promptText },
    { type: 'image_url', image_url: { url: frontDataUrl } },
  ];

  if (backBase64) {
    const cleanBack = backBase64.includes('base64,') ? backBase64.split('base64,')[1] : backBase64;
    const backDataUrl = `data:${mimeType};base64,${cleanBack}`;
    contentParts.push({ type: 'image_url', image_url: { url: backDataUrl } });
  }

  const result = await callNvidiaChat({
    model: NVIDIA_MODELS.VISION_DEFAULT,
    messages: [
      {
        role: 'user',
        content: contentParts,
      },
    ],
    temperature: 0.1,
    maxTokens: 2048,
  });

  if (!result.success || !result.content) {
    return { success: false, error: result.error || 'NVIDIA Vision extraction failed' };
  }

  try {
    const cleanJson = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return { success: true, extracted: parsed };
  } catch (parseErr: any) {
    return { success: false, error: 'Could not parse NVIDIA Vision JSON output' };
  }
}

/**
 * Generates an authoritative lifestyle & intimacy editorial article using NVIDIA Llama 3.3 70B.
 */
export async function generateArticleWithNvidia(params: {
  topic: string;
  category?: string;
  targetKeywords?: string[];
  intent?: string;
  customPrompt?: string;
}) {
  const { topic, category = 'Dynamics & Kink Culture', targetKeywords = [], intent = '', customPrompt = '' } = params;

  const systemPrompt = `You are a world-class intimacy researcher, somatic educator, and curator writing for "Nothingness" (nothingness.asia) - India's Premier Alternate Lifestyle & Luxury Sanctuary Brand.

CRITICAL BRAND RULES:
1. FOCUS ON LIFESTYLE & DYNAMICS: Write deeply about alternate lifestyles, relationship dynamics (D/s, power exchange, roleplay, ethical non-monogamy, praise kink), BDSM safety, consent frameworks, aftercare, sensory exploration, and navigating privacy in urban India.
2. ZERO THIRD-PARTY ADVERTISING: Never mention or advertise external properties, hotels, or commercial competitors. Focus purely on psychological insight, relationship dynamics, and sensory sanctuary living.
3. ZERO EM DASHES (— or – or --). Absolutely NO em dashes or en dashes anywhere. Use colons (:), commas (,), semicolons (;), parentheses (()), or separate short sentences instead.
4. HUMAN CADENCE & NATURAL VOICE: Absolutely NO generic AI buzzwords or robotic clichés (do NOT use "In conclusion", "Delve into", "Tapestry", "Beacon", "Testament", "It is crucial to note", "Furthermore", "In summary"). Write with raw, sophisticated, human authority.
5. INDIA-SPECIFIC REALITY: Naturally ground insights in Indian social dynamics (joint families, residential surveillance, navigating conservative taboos, urban metro realities across Delhi NCR, Mumbai, and Bangalore).
6. MARKDOWN STRUCTURE: Output substantial body content with ## Section Headings, ### Subsections, bullet points, and > blockquotes.

Respond with ONLY valid raw JSON with this exact structure:
{
  "title": "Compelling Title",
  "slug": "url-friendly-slug",
  "subtitle": "Sharp thesis hook",
  "excerpt": "High-density 2-sentence summary (under 280 chars)",
  "content": "Full markdown body with ## headings, * bullets, and > quotes without any em-dashes",
  "category": "${category}",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "reading_time_minutes": 7,
  "meta_title": "SEO Title (under 60 chars)",
  "meta_description": "Meta description (under 155 chars)",
  "meta_keywords": ["keyword 1", "keyword 2"]
}`;

  const userPrompt = `Topic: ${topic}
Category: ${category}
Target Audience / Intent: ${intent || 'Modern Indian couples and lifestyle practitioners exploring intimacy and dynamics'}
Custom Direction: ${customPrompt || 'In-depth, psychological, practical, and grounded in Indian context'}`;

  const result = await callNvidiaChat({
    model: NVIDIA_MODELS.EDITORIAL_DEFAULT,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 4096,
  });

  if (!result.success || !result.content) {
    return { success: false, error: result.error };
  }

  try {
    const cleanJson = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return { success: true, article: parsed };
  } catch (parseErr) {
    return { success: false, error: 'Failed to parse NVIDIA article output' };
  }
}
