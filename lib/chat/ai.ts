import { ConversationState, FlowName } from './flows';
import { createClient } from '@/lib/supabase/server';

export async function handleAiFallback(
  conversationId: string,
  incomingText: string,
  currentState: ConversationState
) {
  const supabase = await createClient();

  // 1. Fetch live space capacities from Supabase for AI Context
  const { data: activeSpaces } = await supabase
    .from('spaces')
    .select('title, max_guests, check_in_time, check_out_time, key_instructions')
    .eq('active', true);

  let spacesInfo = "Available Luxury Sanctuaries & Max Guest Limits:\n";
  if (activeSpaces && activeSpaces.length > 0) {
    activeSpaces.forEach(s => {
      spacesInfo += `- ${s.title}: Max ${s.max_guests} Guests (Check-in ${s.check_in_time || '3:00 PM'}, Check-out ${s.check_out_time || '11:00 AM'}). Key Info: ${s.key_instructions || 'Key lockbox'}\n`;
    });
  }

  // 2. Fetch conversation history for context
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('sender_type, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10);

  let historyContext = "Recent Conversation History:\n";
  if (messages) {
    messages.forEach((msg) => {
      historyContext += `${msg.sender_type === 'guest' ? 'Guest' : 'System'}: ${msg.content}\n`;
    });
  }

  // 3. Build System Prompt with Listing Capacity & Guest Verification Knowledge
  const systemPrompt = `
You are the Nothingness Stays AI Concierge. You handle guest inquiries outside of our automated flows.

${spacesInfo}

Guest Verification & Account Rules:
- Primary bookers can add accompanying guests up to the listing's max guest capacity.
- Every verified accompanying guest receives their own verified Nothingness Guest Account (valid for 180 days across all stays).
- Only Aadhaar Card and Passport are accepted (Driving License and Voter ID are strictly rejected).

Current State:
Active Flow: ${currentState.active_flow || 'None'}
Flow Step: ${currentState.flow_step || 'None'}
Collected Context: ${JSON.stringify(currentState.flow_context)}

${historyContext}

Your goal is to answer the guest's inquiry helpfully while enforcing listing limits and guest policies.
Keep your responses concise, elegant, and natural (under 3 sentences).
`;

  // 4. Primary: NVIDIA NIM (Llama 3.3 70B - Free, high-speed)
  try {
    const { callNvidiaChat, NVIDIA_MODELS } = await import('@/lib/ai/nvidia');
    const nvidiaRes = await callNvidiaChat({
      model: NVIDIA_MODELS.CONCIERGE_POWER,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: incomingText },
      ],
      temperature: 0.6,
      maxTokens: 500,
    });

    if (nvidiaRes.success && nvidiaRes.content) {
      return {
        responseText: nvidiaRes.content,
        updatedState: currentState,
      };
    }
  } catch (nvidiaErr) {
    console.warn('[AI Concierge] NVIDIA warning, falling back to Gemini:', nvidiaErr);
  }

  // 5. Secondary Fallback: Google Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: incomingText,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      return {
        responseText: response.text || "I'm not quite sure how to answer that, but I will have our concierge team follow up.",
        updatedState: currentState,
      };
    }
  } catch (geminiErr) {
    console.error('[AI Concierge] Gemini Fallback Error:', geminiErr);
  }

  return {
    responseText: "I'm having a little trouble connecting right now. Can I help you with something else?",
    updatedState: currentState,
  };
}
