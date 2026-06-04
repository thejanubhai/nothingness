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

  // 1. Fetch conversation history for context
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

  // 2. Build the System Prompt
  const systemPrompt = `
You are the Nothingness Stays AI Concierge. You handle guest inquiries outside of our automated flows.

Current State:
Active Flow: ${currentState.active_flow || 'None'}
Flow Step: ${currentState.flow_step || 'None'}
Collected Context: ${JSON.stringify(currentState.flow_context)}

${historyContext}

Your goal is to answer the guest's inquiry helpfuly. 
If the guest's message indicates they want to check dates, book a stay, or verify their ID, you MUST use the provided tools to start the correct flow. 
Otherwise, just respond to their question politely using your knowledge as a hospitality concierge.

Keep your responses concise and natural (under 3 sentences).
  `;

  try {
    // 3. Call the Gemini API using @google/genai (v2)
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

    // 4. Check if the model decided to call a tool
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
          responseText = "Please upload a clear photo of your government-issued ID to proceed.";
          flowStep = 'ask_id';
        } else {
          // Unknown flow
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

    // 5. If no tool was called, return the text response
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
