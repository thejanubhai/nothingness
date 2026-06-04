import { createClient } from '@/lib/supabase/server';
import { handleAiFallback } from './ai';

// Define the available flows
export type FlowName = 'date_check' | 'booking' | 'id_verification' | 'checkin' | 'checkout';

// Define the state structure
export interface ConversationState {
  active_flow: FlowName | null;
  flow_step: string | null;
  flow_context: any;
}

export async function processIncomingMessage(
  conversationId: string,
  guestProfileId: string | null,
  incomingText: string,
  channel: string
) {
  const supabase = await createClient();

  // 1. Fetch current conversation state
  const { data: conv } = await supabase
    .from('conversations')
    .select('active_flow, flow_step, flow_context')
    .eq('id', conversationId)
    .single();

  if (!conv) {
    throw new Error('Conversation not found');
  }

  const state: ConversationState = {
    active_flow: conv.active_flow as FlowName | null,
    flow_step: conv.flow_step,
    flow_context: typeof conv.flow_context === 'string' ? JSON.parse(conv.flow_context) : (conv.flow_context || {}),
  };

  let responseText = '';
  let updatedState = { ...state };
  let usedAi = false;

  // 2. Route to appropriate flow or check triggers
  if (state.active_flow) {
    const result = await routeToFlow(state, incomingText, guestProfileId);
    if (result.useAi) {
      usedAi = true;
    } else {
      responseText = result.responseText;
      updatedState = result.updatedState;
    }
  } else {
    // Check keyword triggers to start a flow
    const lowerText = incomingText.toLowerCase();
    if (lowerText.includes('book') || lowerText.includes('reserve')) {
      updatedState.active_flow = 'booking';
      updatedState.flow_step = 'ask_space';
      responseText = "I'd love to help you book a stay! Which property are you interested in?";
    } else if (lowerText.includes('available') || lowerText.includes('date')) {
      updatedState.active_flow = 'date_check';
      updatedState.flow_step = 'ask_dates';
      responseText = "I can check availability for you. What are your planned check-in and check-out dates? (e.g., Oct 10 to Oct 15)";
    } else {
      // No keyword matched, use AI
      usedAi = true;
    }
  }

  // 3. Fallback to AI if the user deviated from the flow or no flow matched
  if (usedAi) {
    const aiResult = await handleAiFallback(conversationId, incomingText, state);
    responseText = aiResult.responseText;
    
    // AI might have decided to change the flow state (e.g. started a booking flow)
    if (aiResult.updatedState) {
      updatedState = aiResult.updatedState;
    }
  }

  // 4. Update the conversation state in the DB
  if (
    updatedState.active_flow !== state.active_flow ||
    updatedState.flow_step !== state.flow_step ||
    JSON.stringify(updatedState.flow_context) !== JSON.stringify(state.flow_context)
  ) {
    await supabase
      .from('conversations')
      .update({
        active_flow: updatedState.active_flow,
        flow_step: updatedState.flow_step,
        flow_context: updatedState.flow_context,
      })
      .eq('id', conversationId);
  }

  // 5. Insert system response into conversation_messages
  await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'system',
      sender_name: 'Nothingness AI',
      channel,
      content: responseText,
      status: 'sent',
    });

  return responseText;
}

// ---------------------------------------------------------
// Flow Handlers
// ---------------------------------------------------------

async function routeToFlow(state: ConversationState, input: string, guestId: string | null) {
  let responseText = '';
  let updatedState = { ...state };
  let useAi = false;

  switch (state.active_flow) {
    case 'date_check':
      return handleDateCheckFlow(state, input);
    case 'booking':
      return handleBookingFlow(state, input, guestId);
    case 'id_verification':
      return handleIdVerificationFlow(state, input);
    default:
      useAi = true;
  }

  return { responseText, updatedState, useAi };
}

async function handleDateCheckFlow(state: ConversationState, input: string) {
  let responseText = '';
  let updatedState = { ...state };
  let useAi = false;

  if (state.flow_step === 'ask_dates') {
    // Very basic parsing - in reality, AI is better at extracting dates, 
    // so if this fails a simple regex, we drop to AI fallback.
    const hasDates = input.match(/\d{1,2}/); 
    if (hasDates) {
      // Simulate DB check
      responseText = "I've checked our calendar, and those dates are available! Would you like to proceed with booking?";
      updatedState.flow_step = 'ask_book_intent';
      updatedState.flow_context.dates = input;
    } else {
      useAi = true; // User didn't provide dates, let AI handle it
    }
  } else if (state.flow_step === 'ask_book_intent') {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('yes') || lowerInput.includes('sure') || lowerInput.includes('ok')) {
      updatedState.active_flow = 'booking';
      updatedState.flow_step = 'ask_guests';
      responseText = "Great! How many guests will be staying?";
    } else if (lowerInput.includes('no')) {
      updatedState.active_flow = null;
      updatedState.flow_step = null;
      responseText = "No problem. Let me know if you need anything else!";
    } else {
      useAi = true;
    }
  }

  return { responseText, updatedState, useAi };
}

async function handleBookingFlow(state: ConversationState, input: string, guestId: string | null) {
  let responseText = '';
  let updatedState = { ...state };
  let useAi = false;

  if (state.flow_step === 'ask_space') {
    // Simulate finding a space
    if (input.length > 2) {
      responseText = "Got it. And what dates were you looking to book?";
      updatedState.flow_step = 'ask_dates';
    } else {
      useAi = true;
    }
  } else if (state.flow_step === 'ask_dates') {
    responseText = "Perfect. How many guests will be staying?";
    updatedState.flow_step = 'ask_guests';
    updatedState.flow_context.dates = input;
  } else if (state.flow_step === 'ask_guests') {
    const guests = parseInt(input);
    if (!isNaN(guests)) {
      responseText = `Thanks! I have everything I need. Your total for ${guests} guests comes to $150. You can complete your reservation via this secure link: https://checkout.cashfree.com/pay/...`;
      // End flow or transition to verification
      updatedState.active_flow = 'id_verification';
      updatedState.flow_step = 'ask_id';
    } else {
      useAi = true;
    }
  }

  return { responseText, updatedState, useAi };
}

async function handleIdVerificationFlow(state: ConversationState, input: string) {
  let responseText = '';
  let updatedState = { ...state };
  let useAi = false;

  if (state.flow_step === 'ask_id') {
    // If the input is just text, they haven't uploaded an image. 
    // In a real webhook, we check for media attachments.
    if (input.toLowerCase().includes('http') || input.toLowerCase().includes('upload')) {
      responseText = "Thank you for providing your ID. Your booking is fully confirmed!";
      updatedState.active_flow = null;
      updatedState.flow_step = null;
    } else {
      responseText = "Please upload a clear photo of your government-issued ID to proceed.";
    }
  }

  return { responseText, updatedState, useAi };
}
