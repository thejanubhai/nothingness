import { GoogleGenAI, Type } from '@google/genai';
import { ConversationState, FlowName } from './flows';
import { createClient } from '@/lib/supabase/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy-key' });

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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: incomingText,
      config: {
        systemInstruction: systemPrompt,
        tools: [{
          functionDeclarations: [
            {
              name: 'start_flow',
              description: 'Starts a specific conversational flow for the user.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  flow_name: {
                    type: Type.STRING,
                    description: 'The name of the flow to start (date_check, booking, id_verification)',
                  },
                },
                required: ['flow_name'],
              },
            },
          ],
        }],
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'start_flow') {
        const args = call.args as any;
        const flowName = args.flow_name as FlowName;
        
        let responseText = '';
        let flowStep = '';

        if (flowName === 'date_check') {
          responseText = "I've started the date check process. What are your planned check-in and check-out dates?";
          flowStep = 'ask_dates';
        } else if (flowName === 'booking') {
          responseText = "Let's get your booking started! Which property are you interested in?";
          flowStep = 'ask_space';
        } else if (flowName === 'id_verification') {
          responseText = "Please upload a clear photo of your Aadhaar Card or Passport to proceed.";
          flowStep = 'ask_id';
        } else {
          return {
            responseText: "I'm sorry, I couldn't start that process. How else can I help?",
            updatedState: currentState,
          };
        }

        return {
          responseText,
          updatedState: {
            active_flow: flowName,
            flow_step: flowStep,
            flow_context: currentState.flow_context,
          }
        };
      }
    }

    return {
      responseText: response.text || "I'm not quite sure how to answer that, but I will have a human agent follow up.",
      updatedState: currentState,
    };

  } catch (error) {
    console.error('AI Fallback Error:', error);
    return {
      responseText: "I'm having a little trouble connecting right now. Can I help you with something else?",
      updatedState: currentState,
    };
  }
}
