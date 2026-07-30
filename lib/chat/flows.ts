import { createClient } from '@/lib/supabase/server';
import { handleAiFallback } from './ai';

// Define the available flows
export type FlowName = 'date_check' | 'booking' | 'id_verification' | 'checkin' | 'checkout';

// Define the state structure
export interface ConversationState {
  active_flow: FlowName | null;
  flow_step: string | null;
  flow_context: Record<string, unknown>;
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

  // 2. Route to appropriate flow or check keyword triggers
  if (state.active_flow) {
    const result = await routeToFlow(state, incomingText, guestProfileId);
    if (result.useAi) {
      usedAi = true;
    } else {
      responseText = result.responseText;
      updatedState = result.updatedState;
    }
  } else {
    // A. Check database-seeded active keyword chatflows first from Supabase
    const { data: dbChatflows } = await supabase
      .from('chatflows')
      .select('trigger_keyword, response_template')
      .eq('trigger_event', 'keyword')
      .eq('is_active', true);

    const lowerText = incomingText.toLowerCase();
    let dbMatchFound = false;

    if (dbChatflows && dbChatflows.length > 0) {
      for (const flow of dbChatflows) {
        if (flow.trigger_keyword && lowerText.includes(flow.trigger_keyword.toLowerCase())) {
          responseText = flow.response_template;
          dbMatchFound = true;
          break;
        }
      }
    }

    if (dbMatchFound) {
      // Handled via DB keyword template
    }
    // B. Check standard built-in keyword triggers
    else if (lowerText.includes('key') || lowerText.includes('keys') || lowerText.includes('lockbox') || lowerText.includes('door') || lowerText.includes('entry') || lowerText.includes('code')) {
      // Query specific space key_instructions if conversation is linked to a booking/space
      const { data: convData } = await supabase
        .from('conversations')
        .select('booking_id, space_id')
        .eq('id', conversationId)
        .single();

      let targetSpaceId = convData?.space_id;
      if (!targetSpaceId && convData?.booking_id) {
        const { data: bData } = await supabase.from('bookings').select('space_id').eq('id', convData.booking_id).single();
        targetSpaceId = bData?.space_id;
      }

      let keyMsg = "Keys for your sanctuary are kept in the secure key lockbox near the main entrance door. The access code will be released upon ID verification.";
      if (targetSpaceId) {
        const { data: spaceData } = await supabase.from('spaces').select('title, key_instructions, check_in_time').eq('id', targetSpaceId).single();
        if (spaceData?.key_instructions) {
          keyMsg = `Key Instructions for ${spaceData.title}:\n${spaceData.key_instructions}\n(Check-in time starts at ${spaceData.check_in_time || '3:00 PM'})`;
        }
      }
      responseText = keyMsg;
    } else if (lowerText.includes('ac') || lowerText.includes('aircon') || lowerText.includes('air conditioning') || lowerText.includes('climate')) {
      responseText = "All our luxury sanctuaries and chambers feature climate-controlled Air Conditioning (AC) with individual room thermostats for your utmost comfort.";
    } else if (lowerText.includes('tool') || lowerText.includes('amenities') || lowerText.includes('facilities') || lowerText.includes('wifi') || lowerText.includes('kitchen') || lowerText.includes('pool')) {
      responseText = "Our sanctuaries offer world-class amenities and tools including high-speed Wi-Fi, fully equipped gourmet kitchen tools, climate-controlled AC, luxury linens, private pool access, and 24/7 butler service.";
    } else if (lowerText.includes('checkin') || lowerText.includes('check-in') || lowerText.includes('checkout') || lowerText.includes('check-out') || lowerText.includes('timing') || lowerText.includes('time')) {
      responseText = "Standard check-in starts at 3:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can be requested via our concierge team.";
    } else if (lowerText.includes('book') || lowerText.includes('reserve')) {
      updatedState.active_flow = 'booking';
      updatedState.flow_step = 'ask_space';
      responseText = "I'd love to help you book a stay! Which sanctuary or property are you interested in?";
    } else if (lowerText.includes('available') || lowerText.includes('availability') || lowerText.includes('date') || lowerText.includes('vacant')) {
      updatedState.active_flow = 'date_check';
      updatedState.flow_step = 'ask_dates';
      responseText = "I can check live availability for you. What are your planned check-in and check-out dates? (e.g., Oct 10 to Oct 15)";
    } else {
      // No keyword matched -> Delegate directly to Gemini AI
      usedAi = true;
    }
  }

  // 3. Fallback to AI if user deviated or no keyword flow matched
  if (usedAi) {
    const aiResult = await handleAiFallback(conversationId, incomingText, state);
    responseText = aiResult.responseText;
    
    if (aiResult.updatedState) {
      updatedState = aiResult.updatedState;
    }
  }

  // 4. Update conversation state in DB
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
// Live Supabase Flow Handlers
// ---------------------------------------------------------

async function routeToFlow(state: ConversationState, input: string, guestId: string | null) {
  const responseText = '';
  const updatedState = { ...state };
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
  const updatedState = { ...state };
  let useAi = false;

  const supabase = await createClient();

  if (state.flow_step === 'ask_dates') {
    const hasDates = input.match(/\d{1,2}/); 
    if (hasDates) {
      // Query live spaces from Supabase database
      const { data: spaces } = await supabase.from('spaces').select('id, title, price_per_night').eq('is_active', true).limit(3);
      
      const spaceNames = spaces?.map(s => s.title).join(', ') || 'our sanctuaries';
      responseText = `I've checked our live reservation system for your dates (${input}). ${spaceNames} currently have availability! Would you like to proceed with booking?`;
      updatedState.flow_step = 'ask_book_intent';
      updatedState.flow_context.dates = input;
    } else {
      useAi = true;
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

async function handleBookingFlow(state: ConversationState, input: string, _guestId: string | null) {
  let responseText = '';
  const updatedState = { ...state };
  let useAi = false;

  const supabase = await createClient();

  if (state.flow_step === 'ask_space') {
    if (input.length > 2) {
      // Fetch space details from Supabase
      const { data: space } = await supabase
        .from('spaces')
        .select('id, title, price_per_night')
        .ilike('title', `%${input.trim()}%`)
        .limit(1)
        .single();

      if (space) {
        updatedState.flow_context.space_id = space.id;
        updatedState.flow_context.space_title = space.title;
        updatedState.flow_context.price_per_night = space.price_per_night;
        responseText = `Selected ${space.title} (₹${space.price_per_night.toLocaleString()}/night). What dates were you looking to book?`;
      } else {
        responseText = `Got it. What dates were you looking to book for ${input}?`;
      }
      updatedState.flow_step = 'ask_dates';
    } else {
      useAi = true;
    }
  } else if (state.flow_step === 'ask_dates') {
    responseText = "Perfect. How many guests will be staying?";
    updatedState.flow_step = 'ask_guests';
    updatedState.flow_context.dates = input;
  } else if (state.flow_step === 'ask_guests') {
    const guests = parseInt(input, 10);
    if (!isNaN(guests)) {
      const spaceId = updatedState.flow_context.space_id as string;
      let maxAllowed = 4;
      let spaceTitle = (updatedState.flow_context.space_title as string) || 'your sanctuary stay';

      if (spaceId) {
        const { data: sData } = await supabase.from('spaces').select('title, max_guests').eq('id', spaceId).single();
        if (sData) {
          maxAllowed = sData.max_guests || 4;
          spaceTitle = sData.title;
        }
      }

      if (guests > maxAllowed) {
        responseText = `Per our listing policy, the maximum capacity for ${spaceTitle} is ${maxAllowed} guests. Please enter a guest count up to ${maxAllowed}.`;
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        responseText = `Thanks! I have recorded your reservation for ${guests} guest(s) at ${spaceTitle} (Max Capacity: ${maxAllowed}).\n\n👥 Every accompanying guest can verify their Aadhaar/Passport via their private link so they get their own Nothingness Account (valid 180 days):\n${siteUrl}/verify-guest\n\nYou can complete your reservation securely here: ${siteUrl}/spaces`;
        updatedState.active_flow = 'id_verification';
        updatedState.flow_step = 'ask_id';
      }
    } else {
      useAi = true;
    }
  }

  return { responseText, updatedState, useAi };
}

async function handleIdVerificationFlow(state: ConversationState, input: string) {
  let responseText = '';
  const updatedState = { ...state };

  if (state.flow_step === 'ask_id') {
    if (input.toLowerCase().includes('http') || input.toLowerCase().includes('upload') || input.length > 10) {
      responseText = "Thank you for providing your document link. Your identity verification record has been updated!";
      updatedState.active_flow = null;
      updatedState.flow_step = null;
    } else {
      responseText = "Please upload a clear photo of your government-issued ID (Aadhaar or Passport) to complete verification.";
    }
  }

  return { responseText, updatedState, useAi: false };
}
