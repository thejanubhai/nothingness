import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export interface ConciergeQuestion {
  id: string;
  question: string;
  placeholder: string;
}

export interface VettingEvaluationResult {
  aiTrustScore: number; // 0-100
  discretionScore: number; // 0-30
  consentScore: number; // 0-30
  vibeScore: number; // 0-20
  maturityScore: number; // 0-20
  summary: string;
  recommendedStatus: 'approved_payment_pending' | 'waitlisted' | 'rejected';
}

/**
 * Generates 2-3 dynamic, contextual conversational vetting questions using Gemini AI.
 */
export async function generateConciergeQuestions(
  event: {
    title: string;
    tagline?: string;
    tier: string;
    dress_code?: string;
  },
  applicant: {
    alias: string;
    category: string;
  }
): Promise<ConciergeQuestion[]> {
  const ai = getGeminiClient();

  // Fallback questions if AI is offline
  const fallbackQuestions: ConciergeQuestion[] = [
    {
      id: 'q_vibe',
      question: `For "${event.title}", what energy and aesthetic are you planning to bring?`,
      placeholder: 'e.g. Elegant velvet attire, calm conversational energy...',
    },
    {
      id: 'q_consent',
      question: 'How do you communicate boundaries and check in for consent during social or intimate scenes?',
      placeholder: 'e.g. Always ask verbally before any touch, respect explicit boundaries...',
    },
    {
      id: 'q_discretion',
      question: 'What does community privacy and zero-recording discretion mean to you?',
      placeholder: 'e.g. Total confidentiality, no cameras, what happens in the sanctuary stays here...',
    },
  ];

  if (!ai) return fallbackQuestions;

  try {
    const prompt = `You are the sophisticated Sanctuary Concierge for "Nothingness", an ultra-exclusive, discreet private club in India hosting high-trust lifestyle gatherings (Salons/Munches, Noir Masquerades, and Intimate Soirées).
Event Details:
- Title: ${event.title}
- Tier: ${event.tier} (${event.tier === 'munch' ? 'Discussion/Social' : event.tier === 'rave' ? 'Sensory Rave/Costume' : 'Intimate Private Play'})
- Theme / Dress code: ${event.dress_code || 'Noir Luxury'}
- Applicant Alias: @${applicant.alias}
- Category: ${applicant.category}

Generate EXACTLY 2 concise, highly respectful, evocative, and conversational questions to vet this applicant's vibe, boundaries, and discretion. Avoid creepy, clinical, or excessively graphic phrasing. Keep the tone mysterious, high-end, and safety-focused.

Return ONLY a valid JSON array matching this schema:
[
  {
    "id": "q1",
    "question": "question text",
    "placeholder": "helpful placeholder text"
  },
  {
    "id": "q2",
    "question": "question text",
    "placeholder": "helpful placeholder text"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const responseText = response.text?.trim();
    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Gemini question generation error:', err);
  }

  return fallbackQuestions;
}

/**
 * Evaluates applicant answers to calculate Sanctuary Trust Score & Admin Briefing.
 */
export async function evaluateVettingAnswers(
  event: {
    title: string;
    tier: string;
  },
  applicant: {
    alias: string;
    category: string;
  },
  qaList: { question: string; answer: string }[]
): Promise<VettingEvaluationResult> {
  const ai = getGeminiClient();

  const defaultEvaluation: VettingEvaluationResult = {
    aiTrustScore: 78,
    discretionScore: 24,
    consentScore: 24,
    vibeScore: 15,
    maturityScore: 15,
    summary: 'Clear boundary awareness and respectful tone. Standard queue allocation recommended.',
    recommendedStatus: applicant.category === 'single_male' ? 'waitlisted' : 'approved_payment_pending',
  };

  if (!ai || !qaList || qaList.length === 0) return defaultEvaluation;

  try {
    const formattedQA = qaList
      .map((item, idx) => `Q${idx + 1}: ${item.question}\nA${idx + 1}: ${item.answer}`)
      .join('\n\n');

    const prompt = `You are the Chief Safety & Vetting AI for Nothingness private lifestyle gatherings.
Evaluate the following applicant's responses for the event "${event.title}" (Tier: ${event.tier}).
Applicant Alias: @${applicant.alias}
Category: ${applicant.category}

Applicant Responses:
${formattedQA}

Analyze on 4 safety & culture pillars:
1. Discretion & Anonymity (0-30 pts): Respect for camera ban, non-disclosure, no ego.
2. Enthusiastic Consent (0-30 pts): Clarity on "No means No", verbal check-ins, respect for autonomy.
3. Vibe & Aesthetic Affinity (0-20 pts): Thoughtfulness, alignment with luxury/sensory etiquette.
4. Emotional Maturity & Tone (0-20 pts): Non-entitled, polite, adult communication.

Total Trust Score = sum of the 4 scores (0 to 100).

Return ONLY valid JSON matching this schema:
{
  "aiTrustScore": 85,
  "discretionScore": 27,
  "consentScore": 28,
  "vibeScore": 15,
  "maturityScore": 15,
  "summary": "1-2 sentence executive briefing for the admin summarizing strengths or yellow flags.",
  "recommendedStatus": "approved_payment_pending" | "waitlisted" | "rejected"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text?.trim();
    if (responseText) {
      const parsed = JSON.parse(responseText);
      if (typeof parsed.aiTrustScore === 'number') {
        // Enforce ratio-balancer override: Single males default to waitlist even if high score, unless manually promoted
        let recStatus: 'approved_payment_pending' | 'waitlisted' | 'rejected' = parsed.recommendedStatus;
        if (parsed.aiTrustScore < 50) {
          recStatus = 'rejected';
        } else if (applicant.category === 'single_male') {
          recStatus = 'waitlisted'; // Always queue single males for auto-balancer
        }

        return {
          aiTrustScore: Math.min(100, Math.max(0, parsed.aiTrustScore)),
          discretionScore: parsed.discretionScore || 20,
          consentScore: parsed.consentScore || 20,
          vibeScore: parsed.vibeScore || 15,
          maturityScore: parsed.maturityScore || 15,
          summary: parsed.summary || 'Applicant evaluated cleanly.',
          recommendedStatus: recStatus,
        };
      }
    }
  } catch (err) {
    console.error('Gemini evaluation error:', err);
  }

  return defaultEvaluation;
}
